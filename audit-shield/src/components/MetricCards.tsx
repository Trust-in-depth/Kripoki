import { motion } from 'framer-motion'
import { Fuel, ShieldAlert, TriangleAlert as AlertTriangle } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'

interface Props {
  criticalVulns: number
  fraudRisk: string
  gasEfficiency: number
}

const fraudLabelMap: Record<string, string> = {
  Low: 'Düşük',
  Medium: 'Orta',
  High: 'Yüksek',
  Critical: 'Kritik',
}

const fraudColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  Low: { bg: 'bg-neon-green/10', text: 'text-neon-green', dot: 'bg-neon-green' },
  Medium: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
  High: { bg: 'bg-orange-500/10', text: 'text-orange-500', dot: 'bg-orange-500' },
  Critical: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
}

export default function MetricCards({ criticalVulns, fraudRisk, gasEfficiency }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const metrics = [
    {
      label: 'Kritik Zafiyetler',
      value: criticalVulns.toString(),
      icon: AlertTriangle,
      color: criticalVulns === 0 ? 'text-neon-green' : criticalVulns <= 2 ? 'text-amber-500' : 'text-red-500',
      bg: criticalVulns === 0 ? 'bg-neon-green/10' : criticalVulns <= 2 ? 'bg-amber-500/10' : 'bg-red-500/10',
      sub: criticalVulns === 0 ? 'Sorun bulunmadı' : `${criticalVulns} sorun tespit edildi`,
    },
    {
      label: 'Dolandırıcılık Riski',
      value: fraudLabelMap[fraudRisk] || fraudRisk,
      icon: ShieldAlert,
      color: fraudColorMap[fraudRisk]?.text || 'text-space-300',
      bg: fraudColorMap[fraudRisk]?.bg || 'bg-space-600',
      sub: fraudRisk === 'Low' ? 'Güvenli sınırlar içinde' : 'İnceleme gerektiriyor',
      isText: true,
      dot: fraudColorMap[fraudRisk]?.dot,
    },
    {
      label: 'Gas Verimliliği',
      value: `${gasEfficiency}%`,
      icon: Fuel,
      color: gasEfficiency >= 80 ? 'text-neon-green' : gasEfficiency >= 60 ? 'text-amber-500' : 'text-red-500',
      bg: gasEfficiency >= 80 ? 'bg-neon-green/10' : gasEfficiency >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10',
      sub: gasEfficiency >= 80 ? 'İyi optimize edilmiş' : 'Optimizasyon gerekli',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric, i) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }}
          className={`rounded-2xl border p-6 ${
            isDark
              ? 'border-glass-border bg-glass-bg'
              : 'border-light-glass-border bg-white shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${metric.bg}`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
            <span className={`text-xs font-medium ${isDark ? 'text-space-300' : 'text-slate-700'}`}>
              {metric.label}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            {metric.isText && metric.dot ? (
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${metric.dot}`} />
                <span className={`text-xl font-bold ${metric.color}`}>{metric.value}</span>
              </div>
            ) : (
              <span className={`text-xl font-bold ${metric.color}`}>{metric.value}</span>
            )}
          </div>

          <p className={`mt-1 text-[11px] ${isDark ? 'text-space-400' : 'text-slate-500'}`}>
            {metric.sub}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
