import { motion } from 'framer-motion'
import { Clock, ExternalLink, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import type { AuditResult } from '../lib/types'

interface Props {
  audits: AuditResult[]
  onSelect: (audit: AuditResult) => void
}

const riskBadge = (risk: string) => {
  const map: Record<string, string> = {
    Low: 'bg-neon-green/10 text-neon-green',
    Medium: 'bg-amber-500/10 text-amber-500',
    High: 'bg-orange-500/10 text-orange-500',
    Critical: 'bg-red-500/10 text-red-500',
  }
  return map[risk] || 'bg-space-600 text-space-300'
}

const riskLabel = (risk: string) => {
  const map: Record<string, string> = {
    Low: 'Düşük',
    Medium: 'Orta',
    High: 'Yüksek',
    Critical: 'Kritik',
  }
  return map[risk] || risk
}

const statusLabel = (status: string) => (status === 'completed' ? 'Tamamlandı' : 'Başarısız')

const statusIcon = (status: string) =>
  status === 'completed' ? (
    <ShieldCheck className="h-3.5 w-3.5 text-neon-green" />
  ) : (
    <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
  )

const modelLabel = (model: string) => (model === 'graph' ? 'Graf Tabanlı' : 'Sıralı Derin Öğrenme')

export default function AuditHistory({ audits, onSelect }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const visibleAudits = audits.slice(0, 10)

  if (visibleAudits.length === 0) {
    return (
      <div
        className={`rounded-[24px] border p-8 text-center ${
          isDark
            ? 'border-glass-border bg-glass-bg shadow-xl shadow-slate-900/5'
            : 'border-light-glass-border bg-white shadow-sm'
        }`}
      >
        <Clock className={`mx-auto h-8 w-8 ${isDark ? 'text-space-400' : 'text-slate-400'}`} />
        <p className={`mt-2 text-sm ${isDark ? 'text-space-300' : 'text-slate-700'}`}>
          Henüz analiz geçmişi yok
        </p>
        <p className={`text-xs ${isDark ? 'text-space-400' : 'text-slate-500'}`}>
          İlk analizden sonra kayıtlar burada görünecek
        </p>
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-[24px] border ${
        isDark
          ? 'border-glass-border bg-glass-bg shadow-xl shadow-slate-900/5'
          : 'border-light-glass-border bg-white shadow-sm'
      }`}
    >
      <div
        className={`flex flex-col gap-3 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${
          isDark ? 'border-glass-border' : 'border-slate-200'
        }`}
      >
        <div>
          <h3 className={`ml-6 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Analiz Geçmişi
          </h3>
          <p className={`mt-1 text-xs ${isDark ? 'text-space-400' : 'text-slate-600'}`}>
            Son 10 kayıt gösterilir. Bir kayda tıklayarak analizi yeniden açabilirsiniz.
          </p>
        </div>
        <div
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-medium ${
            isDark
              ? 'border-glass-border bg-space-800/60 text-space-300'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          {visibleAudits.length} kayıt
        </div>
      </div>

      <div className="grid max-h-[400px] gap-3 overflow-y-auto p-4 md:hidden">
        {visibleAudits.map((audit, i) => (
          <motion.button
            key={audit.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(audit)}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              isDark
                ? 'border-glass-border bg-space-800/60 hover:bg-glass-bg-hover'
                : 'border-slate-200 bg-slate-50 hover:bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {audit.contract_name}
                  </span>
                  <ExternalLink className={`h-3 w-3 shrink-0 ${isDark ? 'text-space-400' : 'text-slate-400'}`} />
                </div>
                <p className={`mt-1 text-xs ${isDark ? 'text-space-400' : 'text-slate-600'}`}>
                  {modelLabel(audit.model)}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskBadge(
                  audit.fraud_risk
                )}`}
              >
                {riskLabel(audit.fraud_risk)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className={isDark ? 'text-space-400' : 'text-slate-500'}>Skor</p>
                <p
                  className={`mt-1 text-lg font-semibold ${
                    audit.trust_score >= 80
                      ? 'text-neon-green'
                      : audit.trust_score >= 60
                        ? 'text-amber-500'
                        : 'text-red-500'
                  }`}
                >
                  {audit.trust_score}
                </p>
              </div>
              <div>
                <p className={isDark ? 'text-space-400' : 'text-slate-500'}>Durum</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {statusIcon(audit.status)}
                  <span className={isDark ? 'text-space-300' : 'text-slate-700'}>
                    {statusLabel(audit.status)}
                  </span>
                </div>
              </div>
              <div className="col-span-2">
                <p className={isDark ? 'text-space-400' : 'text-slate-500'}>Tarih</p>
                <p className={`mt-1 ${isDark ? 'text-space-300' : 'text-slate-700'}`}>
                  {new Date(audit.created_at).toLocaleDateString('tr-TR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="hidden md:block">
        <div className="min-w-[980px]">
          <div
            className={`grid grid-cols-[minmax(190px,1.8fr)_minmax(140px,1fr)_110px_130px_150px_170px] gap-6 border-b px-7 py-4 text-[11px] font-medium uppercase tracking-wide ${
              isDark ? 'border-glass-border text-space-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <span className="pl-2">Sözleşme</span>
            <span>Model</span>
            <span>Skor</span>
            <span>Risk</span>
            <span>Durum</span>
            <span>Tarih</span>
          </div>

          <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            {visibleAudits.map((audit, i) => (
              <motion.button
                key={audit.id}
                type="button"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelect(audit)}
                className={`grid w-full grid-cols-[minmax(190px,1.8fr)_minmax(140px,1fr)_110px_130px_150px_170px] gap-6 border-b px-7 py-4 text-left text-xs leading-6 transition-colors last:border-0 ${
                  isDark ? 'border-glass-border hover:bg-glass-bg-hover' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2 pl-2">
                  <span className={`truncate font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {audit.contract_name}
                  </span>
                  <ExternalLink className={`h-3.5 w-3.5 shrink-0 ${isDark ? 'text-space-400' : 'text-slate-400'}`} />
                </div>
                <div className={isDark ? 'text-space-300' : 'text-slate-700'}>{modelLabel(audit.model)}</div>
                <div
                  className={`font-semibold ${
                    audit.trust_score >= 80
                      ? 'text-neon-green'
                      : audit.trust_score >= 60
                        ? 'text-amber-500'
                        : 'text-red-500'
                  }`}
                >
                  {audit.trust_score}
                </div>
                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskBadge(
                      audit.fraud_risk
                    )}`}
                  >
                    {riskLabel(audit.fraud_risk)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {statusIcon(audit.status)}
                  <span className={isDark ? 'text-space-300' : 'text-slate-700'}>
                    {statusLabel(audit.status)}
                  </span>
                </div>
                <div className={isDark ? 'text-space-400' : 'text-slate-600'}>
                  {new Date(audit.created_at).toLocaleDateString('tr-TR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
