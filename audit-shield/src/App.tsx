import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import AuditHistory from './components/AuditHistory'
import BackgroundEffects from './components/BackgroundEffects'
import CodeEditor from './components/CodeEditor'
import Header from './components/Header'
import ModelSelection from './components/ModelSelection'
import { useTheme } from './lib/ThemeContext'
import { supabase } from './lib/supabase'
import type { AnalysisModel, AuditResult } from './lib/types'
import { useWallet } from './lib/WalletContext'

interface AnalyzeResponse {
  id?: string
  trust_score?: number
  critical_vulns?: number
  fraud_risk?: string
  gas_efficiency?: number
  contract_name?: string
  created_at?: string
  status?: 'completed' | 'failed'
  detail?: string
}

const ANALYZE_ENDPOINT = 'http://localhost:8000/analyze'
const HISTORY_LIMIT = 10
const SOLIDITY_CORE_PATTERN =
  /\bpragma\s+solidity\b|\bcontract\s+[A-Za-z_]\w*|\binterface\s+[A-Za-z_]\w*|\blibrary\s+[A-Za-z_]\w*|\bimport\s+["'][^"']+\.sol["']/i
const SOLIDITY_HINT_PATTERN =
  /\bfunction\b|\bmapping\s*\(|\bevent\b|\bconstructor\b|\brequire\s*\(|\bmsg\.sender\b|\bblock\.(?:timestamp|number)\b|\baddress\b|\buint(?:8|16|32|64|128|256)?\b|\bbytes(?:1|2|4|8|16|32)?\b|\bpayable\b/gi

function extractContractName(code: string) {
  const match = code.match(/\bcontract\s+([A-Za-z_]\w*)/)
  return match?.[1] ?? 'YuklenenSozlesme'
}

function looksLikeSolidityContract(source: string) {
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

export default function App() {
  const [model, setModel] = useState<AnalysisModel | null>(null)
  const [code, setCode] = useState('')
  const [editorFileName, setEditorFileName] = useState('ornek-kontrat.sol')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [history, setHistory] = useState<AuditResult[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { theme } = useTheme()
  const { connected, address, error: walletError } = useWallet()
  const isDark = theme === 'dark'

  const normalizedWalletAddress = useMemo(
    () => (connected && address ? address.toLowerCase() : null),
    [address, connected]
  )

  useEffect(() => {
    async function fetchHistory() {
      if (!normalizedWalletAddress) {
        setHistory([])
        return
      }

      const { data, error } = await supabase
        .from('audit_results')
        .select('*')
        .eq('wallet_address', normalizedWalletAddress)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT)

      if (!error && data) {
        setHistory(data as AuditResult[])
      }
    }

    void fetchHistory()
  }, [normalizedWalletAddress])

  const handleSelectAudit = useCallback((audit: AuditResult) => {
    setModel(audit.model)
    setResult(audit)
    setErrorMessage(null)

    if (audit.source_code?.trim()) {
      setCode(audit.source_code)
      setEditorFileName(`${audit.contract_name}.sol`)
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleRunAudit = useCallback(async () => {
    if (!model) {
      return
    }

    const normalizedCode = code.trim()
    setResult(null)
    setErrorMessage(null)

    if (!normalizedCode) {
      setErrorMessage('Lütfen analiz etmek için Solidity sözleşme kodu ekleyin.')
      return
    }

    if (!looksLikeSolidityContract(normalizedCode)) {
      setErrorMessage(
        'Yapıştırılan içerik geçerli bir Solidity sözleşmesi gibi görünmüyor. Lütfen .sol uzantılı bir sözleşme dosyası veya geçerli Solidity kodu ekleyin.'
      )
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await fetch(ANALYZE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode, model }),
      })

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as AnalyzeResponse | null
        throw new Error(errorPayload?.detail || 'Backend servisi yanıt vermedi.')
      }

      const data = (await response.json()) as AnalyzeResponse
      const auditResult: AuditResult = {
        id: data.id || crypto.randomUUID(),
        trust_score: data.trust_score ?? 0,
        critical_vulns: data.critical_vulns ?? 0,
        fraud_risk: data.fraud_risk ?? 'Low',
        gas_efficiency: data.gas_efficiency ?? 0,
        model,
        contract_name: data.contract_name || extractContractName(normalizedCode),
        created_at: data.created_at || new Date().toISOString(),
        status: data.status === 'failed' ? 'failed' : 'completed',
        wallet_address: normalizedWalletAddress,
        source_code: normalizedCode,
      }

      setResult(auditResult)

      if (normalizedWalletAddress) {
        setHistory((prev) => [auditResult, ...prev].slice(0, HISTORY_LIMIT))

        await supabase.from('audit_results').insert({
          id: auditResult.id,
          trust_score: auditResult.trust_score,
          critical_vulns: auditResult.critical_vulns,
          fraud_risk: auditResult.fraud_risk,
          gas_efficiency: auditResult.gas_efficiency,
          model: auditResult.model,
          contract_name: auditResult.contract_name,
          status: auditResult.status,
          wallet_address: normalizedWalletAddress,
          source_code: normalizedCode,
        })
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Analiz servisiyle bağlantı kurulurken bir hata oluştu.'
      )
    } finally {
      setIsAnalyzing(false)
    }
  }, [code, model, normalizedWalletAddress])

  const sidebarMessage = errorMessage ?? walletError

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects />
      <Header />

      <main className="relative z-10 mx-auto max-w-[1920px] px-6 pb-16 pt-24 sm:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1
            className={`bg-clip-text text-3xl font-bold tracking-tight sm:text-4xl ${
              isDark
                ? 'bg-gradient-to-r from-white via-slate-200 to-slate-400 text-transparent'
                : 'bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 text-transparent'
            }`}
          >
            Akıllı Sözleşme Güvenlik Analizi
          </h1>
          <p className={`mt-2 text-sm sm:text-base ${isDark ? 'text-space-300' : 'text-slate-600'}`}>
            Solidity sözleşmeleri için yapay zeka destekli güvenlik taraması ve analiz
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <ModelSelection selected={model} onSelect={setModel} />
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="min-w-0"
          >
            <CodeEditor
              code={code}
              onChange={setCode}
              fileName={editorFileName}
              onFileNameChange={setEditorFileName}
              model={model}
              onRun={handleRunAudit}
              isAnalyzing={isAnalyzing}
            />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="min-w-0"
          >
            {isAnalyzing ? (
              <div
                className={`flex h-full min-h-[500px] items-center justify-center rounded-2xl border p-8 ${
                  isDark
                    ? 'border-glass-border bg-glass-bg'
                    : 'border-light-glass-border bg-white shadow-sm'
                }`}
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-neon-purple/30 border-t-neon-purple"
                  />
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Taranıyor...
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-space-400' : 'text-slate-600'}`}>
                    {model === 'graph'
                      ? 'Kontrol akışı grafiği oluşturuluyor ve GraphCodeBERT çalıştırılıyor'
                      : 'CNN-BiLSTM hattında analiz yürütülüyor'}
                  </p>
                </div>
              </div>
            ) : result && model ? (
              <AnalyticsDashboard result={result} model={model} />
            ) : sidebarMessage ? (
              <div
                className={`flex h-full min-h-[500px] items-center justify-center rounded-2xl border p-8 ${
                  isDark
                    ? 'border-red-500/20 bg-glass-bg'
                    : 'border-red-200 bg-white shadow-sm'
                }`}
              >
                <div className="max-w-sm text-center">
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    İşlem tamamlanamadı
                  </p>
                  <p className={`mt-2 text-xs leading-6 ${isDark ? 'text-space-300' : 'text-slate-600'}`}>
                    {sidebarMessage}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`flex h-full min-h-[500px] items-center justify-center rounded-2xl border p-8 ${
                  isDark
                    ? 'border-glass-border bg-glass-bg'
                    : 'border-light-glass-border bg-white shadow-sm'
                }`}
              >
                <div className="text-center">
                  <div
                    className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl ${
                      isDark ? 'bg-space-700' : 'bg-slate-100'
                    }`}
                  >
                    <svg
                      className={`h-8 w-8 ${isDark ? 'text-space-400' : 'text-slate-500'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-space-300' : 'text-slate-700'}`}>
                    Henüz analiz yok
                  </p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-space-400' : 'text-slate-600'}`}>
                    Bir model seçip analizi başlattığınızda sonuçlar burada görünecek
                  </p>
                </div>
              </div>
            )}
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <AuditHistory audits={history} onSelect={handleSelectAudit} />
        </motion.section>
      </main>
    </div>
  )
}
