import re
from pathlib import Path

import torch
import torch.nn.functional as F
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForSequenceClassification, AutoTokenizer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
MODEL_ROOT = BASE_DIR / "model_save"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
SOLIDITY_CORE_PATTERN = re.compile(
    r"\bpragma\s+solidity\b|\bcontract\s+[A-Za-z_]\w*|\binterface\s+[A-Za-z_]\w*|\blibrary\s+[A-Za-z_]\w*|\bimport\s+[\"'][^\"']+\.sol[\"']",
    re.IGNORECASE,
)
SOLIDITY_HINT_PATTERN = re.compile(
    r"\bfunction\b|\bmapping\s*\(|\bevent\b|\bconstructor\b|\brequire\s*\(|\bmsg\.sender\b|\bblock\.(?:timestamp|number)\b|\baddress\b|\buint(?:8|16|32|64|128|256)?\b|\bbytes(?:1|2|4|8|16|32)?\b|\bpayable\b",
    re.IGNORECASE,
)

MODEL_CONFIG = {
    "graph": {
        "label": "GraphCodeBERT",
        "path": MODEL_ROOT / "graphBert",
    },
    "sequential": {
        "label": "CNN-BiLSTM",
        "path": MODEL_ROOT / "CNN_BILSTM",
    },
}

MODEL_CACHE: dict[str, dict[str, object]] = {}


class CodeRequest(BaseModel):
    code: str
    model: str = "graph"


def looks_like_solidity_contract(source: str) -> bool:
    code = source.strip()
    if not code:
        return False

    if SOLIDITY_CORE_PATTERN.search(code):
        return True

    matches = SOLIDITY_HINT_PATTERN.findall(code)
    return len(matches) >= 2 and bool(re.search(r"[;{}]", code))


def is_transformers_bundle(path: Path) -> bool:
    required = [
        path / "config.json",
        path / "model.safetensors",
        path / "tokenizer.json",
    ]
    return path.exists() and all(file.exists() for file in required)


def get_bundle(model_key: str) -> dict[str, object]:
    config = MODEL_CONFIG.get(model_key)
    if not config:
        raise HTTPException(status_code=400, detail=f"Unsupported model '{model_key}'.")

    path = config["path"]
    if not is_transformers_bundle(path):
        raise HTTPException(
            status_code=503,
            detail=f"{config['label']} artifacts are not available in {path.name}.",
        )

    if model_key not in MODEL_CACHE:
        tokenizer = AutoTokenizer.from_pretrained(path)
        model = AutoModelForSequenceClassification.from_pretrained(path)
        model.to(DEVICE)
        model.eval()
        MODEL_CACHE[model_key] = {"tokenizer": tokenizer, "model": model}

    return MODEL_CACHE[model_key]


def fraud_risk_from_score(score: float) -> str:
    if score >= 85:
        return "Low"
    if score >= 70:
        return "Medium"
    if score >= 50:
        return "High"
    return "Critical"


def strip_non_code_tokens(source: str) -> str:
    without_block_comments = re.sub(r"/\*.*?\*/", "", source, flags=re.DOTALL)
    without_line_comments = re.sub(r"//.*", "", without_block_comments)
    without_double_quotes = re.sub(r'"(?:\\.|[^"\\])*"', '""', without_line_comments)
    without_single_quotes = re.sub(r"'(?:\\.|[^'\\])*'", "''", without_double_quotes)
    return without_single_quotes


def calculate_gas_efficiency(source: str) -> int:
    code = strip_non_code_tokens(source)

    loop_count = len(re.findall(r"\bfor\s*\(|\bwhile\s*\(", code))
    unchecked_blocks = len(re.findall(r"\bunchecked\s*\{", code))
    view_or_pure_functions = len(re.findall(r"\bfunction\b[^{;]*\b(?:view|pure)\b", code))
    constant_or_immutable = len(re.findall(r"\b(?:constant|immutable)\b", code))
    custom_errors = len(re.findall(r"\berror\s+[A-Za-z_]\w*\s*(?:\(|;)", code))
    revert_strings = len(re.findall(r"\brequire\s*\([^,\n]+,\s*\".*?\"\s*\)", code))
    external_calls = len(re.findall(r"\.\s*[A-Za-z_]\w*\s*\(", code))
    event_emits = len(re.findall(r"\bemit\b", code))
    assignment_ops = len(re.findall(r"(?<![=!<>])=(?!=)", code))
    compound_assignments = len(re.findall(r"\+=|-=|\*=|/=|%=|\+\+|--", code))
    mapping_updates = len(
        re.findall(
            r"\[[^\]]+\]\s*(?:=|\+=|-=|\*=|/=|%=|\+\+|--)",
            code,
        )
    )
    dynamic_types = len(re.findall(r"\bstring\b|\bbytes\b(?!\d)", code))
    array_usage = len(re.findall(r"\[[^\]]*\]", code))

    score = 96.0
    score -= loop_count * 10.0
    score -= external_calls * 2.5
    score -= assignment_ops * 0.8
    score -= compound_assignments * 1.4
    score -= mapping_updates * 2.2
    score -= event_emits * 0.4
    score -= revert_strings * 1.2
    score -= dynamic_types * 2.5
    score -= array_usage * 0.7

    score += min(view_or_pure_functions * 1.8, 7.0)
    score += min(constant_or_immutable * 2.0, 6.0)
    score += min(custom_errors * 1.5, 4.0)
    score += min(unchecked_blocks * 1.8, 4.0)

    return max(20, min(98, int(round(score))))


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "device": str(DEVICE),
        "models": {
            key: {
                "label": value["label"],
                "available": is_transformers_bundle(value["path"]),
            }
            for key, value in MODEL_CONFIG.items()
        },
    }


@app.post("/analyze")
async def analyze(request: CodeRequest):
    if not looks_like_solidity_contract(request.code):
        raise HTTPException(
            status_code=400,
            detail="Gonderilen icerik gecerli bir Solidity sozlesmesi gibi gorunmuyor.",
        )

    model_key = request.model.strip().lower()
    bundle = get_bundle(model_key)
    model_meta = MODEL_CONFIG[model_key]

    tokenizer = bundle["tokenizer"]
    model = bundle["model"]

    inputs = tokenizer(
        request.code,
        return_tensors="pt",
        truncation=True,
        padding="max_length",
        max_length=256,
    )
    input_ids = inputs["input_ids"].to(DEVICE)
    attention_mask = inputs["attention_mask"].to(DEVICE)

    with torch.no_grad():
        outputs = model(input_ids, attention_mask=attention_mask)

    probs = F.softmax(outputs.logits, dim=1).cpu().numpy()[0]
    prediction = int(torch.argmax(outputs.logits, dim=1).item())

    safe_prob = float(probs[0]) if len(probs) > 0 else 0.0
    vuln_prob = float(probs[1]) if len(probs) > 1 else 1.0 - safe_prob
    trust_score = round(safe_prob * 100, 2)
    critical_vulns = 1 if prediction == 1 else 0

    return {
        "trust_score": trust_score,
        "critical_vulns": critical_vulns,
        "fraud_risk": fraud_risk_from_score(trust_score),
        "gas_efficiency": calculate_gas_efficiency(request.code),
        "status": "completed",
        "model": model_meta["label"],
        "confidence": round(max(safe_prob, vuln_prob) * 100, 2),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
