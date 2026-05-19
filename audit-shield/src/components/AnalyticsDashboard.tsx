import { motion } from 'framer-motion'
import { useTheme } from '../lib/ThemeContext'
import type { AnalysisModel, AuditResult } from '../lib/types'
import MetricCards from './MetricCards'
import RelationshipGraph from './RelationshipGraph'
import TrustScoreGauge from './TrustScoreGauge'

interface Props {
  result: AuditResult
  model: AnalysisModel
}

export default function AnalyticsDashboard({ result, model }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-full flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-green" />
        <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Analiz Sonuçları
        </h2>
        <span className="rounded-full bg-neon-purple/10 px-2 py-0.5 text-[10px] font-medium text-neon-purple">
          {model === 'graph' ? 'GraphCodeBERT' : 'CNN-BiLSTM'}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
        <div
          className={`flex items-center justify-center rounded-2xl border p-6 ${
            isDark
              ? 'border-glass-border bg-glass-bg'
              : 'border-light-glass-border bg-white shadow-sm'
          }`}
        >
          <TrustScoreGauge score={result.trust_score} />
        </div>

        <MetricCards
          criticalVulns={result.critical_vulns}
          fraudRisk={result.fraud_risk}
          gasEfficiency={result.gas_efficiency}
        />
      </div>

      <div className="flex-1">
        <RelationshipGraph model={model} />
      </div>
    </motion.div>
  )
}
