import { motion } from 'framer-motion'
import { useTheme } from '../lib/ThemeContext'

interface Props {
  score: number
}

export default function TrustScoreGauge({ score }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const radius = 70
  const stroke = 8
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getColor = (value: number) => {
    if (value >= 80) return { stroke: '#10b981', text: 'text-neon-green', label: 'Güvenli' }
    if (value >= 60) return { stroke: '#f59e0b', text: 'text-amber-500', label: 'Orta' }
    if (value >= 40) return { stroke: '#f97316', text: 'text-orange-500', label: 'Riskli' }
    return { stroke: '#ef4444', text: 'text-red-500', label: 'Kritik' }
  }

  const colorInfo = getColor(score)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center"
    >
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
          <circle
            stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.08)'}
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            stroke={colorInfo.stroke}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{ filter: `drop-shadow(0 0 6px ${colorInfo.stroke}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`text-3xl font-bold ${colorInfo.text}`}
          >
            {score}
          </motion.span>
          <span className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? 'text-space-300' : 'text-slate-500'}`}>
            / 100
          </span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-2"
      >
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorInfo.text}`}
          style={{ backgroundColor: `${colorInfo.stroke}15` }}
        >
          {colorInfo.label}
        </span>
      </motion.div>
      <p className={`mt-1 text-xs ${isDark ? 'text-space-300' : 'text-slate-600'}`}>Güven Skoru</p>
    </motion.div>
  )
}
