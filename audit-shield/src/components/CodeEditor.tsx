import { useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, FileCode2, Upload, Zap } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import type { AnalysisModel } from '../lib/types'

const SAMPLE_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VaultToken is ERC20, Ownable {
    uint256 public maxSupply;
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakeTimestamp;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    constructor(uint256 _maxSupply) ERC20("VaultToken", "VLT") {
        maxSupply = _maxSupply * 10 ** decimals();
        _mint(msg.sender, maxSupply);
    }
}`

const SOLIDITY_CORE_PATTERN =
  /\bpragma\s+solidity\b|\bcontract\s+[A-Za-z_]\w*|\binterface\s+[A-Za-z_]\w*|\blibrary\s+[A-Za-z_]\w*|\bimport\s+["'][^"']+\.sol["']/i
const SOLIDITY_HINT_PATTERN =
  /\bfunction\b|\bmapping\s*\(|\bevent\b|\bconstructor\b|\brequire\s*\(|\bmsg\.sender\b|\bblock\.(?:timestamp|number)\b|\baddress\b|\buint(?:8|16|32|64|128|256)?\b|\bbytes(?:1|2|4|8|16|32)?\b|\bpayable\b/gi

interface Props {
  code: string
  onChange: (code: string) => void
  fileName: string
  onFileNameChange: (fileName: string) => void
  model: AnalysisModel | null
  onRun: () => void
  isAnalyzing: boolean
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function looksLikeSoliditySource(source: string) {
  const code = source.trim()

  if (!code) {
    return false
  }

  if (SOLIDITY_CORE_PATTERN.test(code)) {
    return true
  }

  const matches = code.match(SOLIDITY_HINT_PATTERN) ?? []
  return matches.length >= 2 && /[;{}]/.test(code)
}

function getEditorFileName(source: string) {
  return looksLikeSoliditySource(source)
    ? 'panodan-yapistirilan-kod.sol'
    : 'panodan-yapistirilan-metin.txt'
}

function tokenizeLine(line: string) {
  const tokens: Array<{ type: 'code' | 'string' | 'comment'; value: string }> = []
  let buffer = ''
  let index = 0

  while (index < line.length) {
    const current = line[index]
    const next = line[index + 1]

    if (current === '/' && next === '/') {
      if (buffer) tokens.push({ type: 'code', value: buffer })
      tokens.push({ type: 'comment', value: line.slice(index) })
      return tokens
    }

    if (current === '"') {
      if (buffer) {
        tokens.push({ type: 'code', value: buffer })
        buffer = ''
      }

      let end = index + 1
      while (end < line.length) {
        if (line[end] === '"' && line[end - 1] !== '\\') {
          end += 1
          break
        }
        end += 1
      }

      tokens.push({ type: 'string', value: line.slice(index, end) })
      index = end
      continue
    }

    buffer += current
    index += 1
  }

  if (buffer) tokens.push({ type: 'code', value: buffer })
  return tokens
}

function highlightSolidity(code: string, isDark: boolean) {
  const keywords = [
    'pragma',
    'solidity',
    'import',
    'contract',
    'is',
    'function',
    'external',
    'internal',
    'public',
    'private',
    'view',
    'pure',
    'payable',
    'returns',
    'return',
    'require',
    'emit',
    'event',
    'mapping',
    'modifier',
    'if',
    'else',
    'for',
    'while',
    'break',
    'continue',
    'true',
    'false',
    'this',
    'super',
    'new',
    'delete',
    'indexed',
    'memory',
    'storage',
    'calldata',
    'constructor',
    'using',
  ]
  const types = ['uint256', 'address', 'bool', 'string', 'bytes', 'int256', 'uint8', 'uint']
  const keywordSet = new Set(keywords)
  const typeSet = new Set(types)
  const tokenRegex = /\b[A-Za-z_]\w*\b|\b\d+\b/g

  const commentClass = isDark ? 'italic text-space-300' : 'italic text-slate-400'
  const stringClass = isDark ? 'text-neon-green-light' : 'text-emerald-600'
  const keywordClass = isDark ? 'font-medium text-neon-purple-light' : 'font-medium text-indigo-600'
  const typeClass = isDark ? 'text-neon-green' : 'text-emerald-700'
  const numberClass = isDark ? 'text-amber-400' : 'text-amber-600'
  const functionClass = isDark ? 'text-sky-300' : 'text-sky-600'

  return code
    .split('\n')
    .map((line) =>
      tokenizeLine(line)
        .map((token) => {
          if (token.type === 'comment') {
            return `<span class="${commentClass}">${escapeHtml(token.value)}</span>`
          }

          if (token.type === 'string') {
            return `<span class="${stringClass}">${escapeHtml(token.value)}</span>`
          }

          const raw = token.value
          const parts: string[] = []
          let cursor = 0

          for (const match of raw.matchAll(tokenRegex)) {
            const tokenText = match[0]
            const index = match.index ?? 0
            const nextChunk = raw.slice(index + tokenText.length)

            parts.push(escapeHtml(raw.slice(cursor, index)))

            if (typeSet.has(tokenText)) {
              parts.push(`<span class="${typeClass}">${escapeHtml(tokenText)}</span>`)
            } else if (keywordSet.has(tokenText)) {
              parts.push(`<span class="${keywordClass}">${escapeHtml(tokenText)}</span>`)
            } else if (/^\d+$/.test(tokenText)) {
              parts.push(`<span class="${numberClass}">${tokenText}</span>`)
            } else if (/^\s*\(/.test(nextChunk)) {
              parts.push(`<span class="${functionClass}">${escapeHtml(tokenText)}</span>`)
            } else {
              parts.push(escapeHtml(tokenText))
            }

            cursor = index + tokenText.length
          }

          parts.push(escapeHtml(raw.slice(cursor)))
          return parts.join('')
        })
        .join('')
    )
    .join('\n')
}

export default function CodeEditor({
  code,
  onChange,
  fileName,
  onFileNameChange,
  model,
  onRun,
  isAnalyzing,
}: Props) {
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const isShowingSample = code.trim().length === 0
  const displayCode = isShowingSample ? SAMPLE_CODE : code
  const lines = displayCode.split('\n')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    onChange(text)
    onFileNameChange(file.name)
    event.target.value = ''
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) return

      onChange(text)
      onFileNameChange(getEditorFileName(text))
    } catch {
      // If clipboard access is blocked, Ctrl+V still works in the editor.
    }
  }

  const handleEditorPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData('text')
    if (!pastedText.trim()) return

    onFileNameChange(getEditorFileName(pastedText))
  }

  return (
    <div className="space-y-3">
      <div
        className={`flex items-center justify-between rounded-2xl border p-4 ${
          isDark
            ? 'border-glass-border bg-space-800'
            : 'border-light-glass-border bg-white shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              isDark ? 'bg-neon-purple/10' : 'bg-indigo-50'
            }`}
          >
            <FileCode2
              className={`h-4 w-4 ${isDark ? 'text-neon-purple' : 'text-light-primary'}`}
            />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-light-text'}`}>
              Solidity Sözleşmesi
            </h3>
            <div className="mt-0.5 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-neon-green" />
              <span className={`text-xs font-medium ${isDark ? 'text-space-300' : 'text-slate-500'}`}>
                {fileName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".sol,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
              isDark
                ? 'border-glass-border bg-glass-bg text-space-300 hover:bg-glass-bg-hover hover:text-white'
                : 'border-light-glass-border bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Upload className="h-3 w-3" />
            Dosya Yükle
          </button>
          <button
            onClick={handlePasteFromClipboard}
            className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
              isDark
                ? 'border-glass-border bg-glass-bg text-space-300 hover:bg-glass-bg-hover hover:text-white'
                : 'border-light-glass-border bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Yapıştır
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
              isDark
                ? 'border-glass-border bg-glass-bg text-space-300 hover:bg-glass-bg-hover hover:text-white'
                : 'border-light-glass-border bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {copied ? <Check className="h-3 w-3 text-neon-green" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border ${
          isDark
            ? 'border-glass-border bg-space-800'
            : 'border-light-glass-border bg-slate-900'
        }`}
      >
        <div
          className={`flex items-center gap-0 border-b px-4 ${
            isDark
              ? 'border-glass-border bg-space-700/50'
              : 'border-slate-700 bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-2 border-b-2 border-neon-purple px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-neon-green" />
            <span className="text-xs font-medium text-white">{fileName}</span>
            {isShowingSample ? (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-space-400">Örnek</span>
            ) : null}
          </div>
        </div>

        <div className="flex max-h-[420px] overflow-auto">
          <div
            className={`sticky left-0 select-none border-r px-3 py-4 text-right font-mono text-xs leading-6 ${
              isDark
                ? 'border-glass-border bg-space-800 text-space-400'
                : 'border-slate-700 bg-slate-900 text-slate-500'
            }`}
          >
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          <div className="relative flex-1 pl-8">
            <pre
              className={`p-4 pl-0 font-mono text-xs leading-6 text-slate-300 ${
                isShowingSample ? 'opacity-45' : 'opacity-100'
              }`}
            >
              <code
                dangerouslySetInnerHTML={{
                  __html: highlightSolidity(displayCode, isDark),
                }}
              />
            </pre>
            <textarea
              value={code}
              onChange={(event) => onChange(event.target.value)}
              onPaste={handleEditorPaste}
              className="absolute inset-0 resize-none bg-transparent p-4 pl-8 font-mono text-xs leading-6 text-transparent caret-neon-purple outline-none"
              spellCheck={false}
              placeholder=""
            />
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onRun}
        disabled={!model || isAnalyzing}
        className={`group relative w-full overflow-hidden rounded-2xl py-3.5 text-sm font-semibold transition-all ${
          !model
            ? isDark
              ? 'cursor-not-allowed bg-space-600 text-space-400'
              : 'cursor-not-allowed bg-slate-200 text-slate-400'
            : isAnalyzing
              ? isDark
                ? 'cursor-wait bg-space-600 text-space-300'
                : 'cursor-wait bg-slate-200 text-slate-400'
              : 'bg-gradient-to-r from-neon-purple to-neon-green text-white shadow-lg shadow-neon-purple/20'
        }`}
      >
        {model && !isAnalyzing ? (
          <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-green opacity-0 blur-xl transition-opacity group-hover:opacity-40" />
        ) : null}
        <span className="relative flex items-center justify-center gap-2">
          {isAnalyzing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="h-4 w-4" />
              </motion.div>
              Taranıyor...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Analizi Başlat
            </>
          )}
        </span>
      </motion.button>
    </div>
  )
}
