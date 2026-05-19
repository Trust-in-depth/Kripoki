import { motion } from 'framer-motion'
import { BrainCircuit, Cpu, GitBranch, Network } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import type { AnalysisModel } from '../lib/types'

interface Props {
  selected: AnalysisModel | null
  onSelect: (model: AnalysisModel) => void
}

const models = [
  {
    id: 'graph' as AnalysisModel,
    title: 'Graf Tabanlı Analiz',
    subtitle: 'GraphCodeBERT & GraphBERT',
    description:
      'Sözleşme kontrol akışını ve veri bağımlılıklarını grafik sinir ağlarıyla modelleyerek derin zafiyet tespiti yapar.',
    icon: Network,
    features: ['Kontrol Akışı Grafiği', 'Veri Bağımlılığı Haritası', 'Yapısal Desen Tespiti'],
    darkAccent: 'text-neon-purple',
    darkBg: 'bg-neon-purple/10',
    darkBorder: 'border-neon-purple/30',
    darkGlow: 'shadow-neon-purple/30',
    lightAccent: 'text-indigo-700',
    lightBg: 'bg-indigo-50',
    lightBorder: 'border-indigo-200',
    lightRing: 'ring-indigo-100',
  },
  {
    id: 'sequential' as AnalysisModel,
    title: 'Sıralı Derin Öğrenme',
    subtitle: 'CNN-BiLSTM Mimarisi',
    description:
      'Bytecode ve kaynak koddaki sıralı desenleri yakalamak için evrişimsel özellik çıkarımı ile çift yönlü LSTM yaklaşımını birleştirir.',
    icon: BrainCircuit,
    features: ['Sıralı Desen Madenciliği', 'Bytecode Analizi', 'Zamansal Bağımlılık Yakalama'],
    darkAccent: 'text-neon-green',
    darkBg: 'bg-neon-green/10',
    darkBorder: 'border-neon-green/30',
    darkGlow: 'shadow-neon-green/30',
    lightAccent: 'text-emerald-700',
    lightBg: 'bg-emerald-50',
    lightBorder: 'border-emerald-200',
    lightRing: 'ring-emerald-100',
  },
]

export default function ModelSelection({ selected, onSelect }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Analiz Modeli Seç
        </h2>
        <p className={`mt-1 text-sm ${isDark ? 'text-space-300' : 'text-slate-600'}`}>
          Akıllı sözleşme denetimi için yapay zeka motorunu belirleyin
        </p>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-2">
        {models.map((model, i) => {
          const isSelected = selected === model.id
          const accentClass = isDark ? model.darkAccent : model.lightAccent
          const accentBgClass = isDark ? model.darkBg : model.lightBg
          const selectedClass = isDark
            ? `${model.darkBorder} bg-glass-bg-hover shadow-lg ${model.darkGlow}`
            : `${model.lightBorder} bg-white shadow-sm ring-1 ${model.lightRing}`
          const unselectedClass = isDark
            ? 'border-glass-border bg-glass-bg hover:border-space-400 hover:bg-glass-bg-hover'
            : 'border-light-glass-border bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50'

          return (
            <motion.button
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -2 }}
              onClick={() => onSelect(model.id)}
              className={`group relative w-full self-start overflow-hidden rounded-[22px] border text-left transition-all ${
                isSelected ? selectedClass : unselectedClass
              }`}
            >
              <div className="relative z-10 m-1 rounded-[18px] px-6 py-4">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentBgClass}`}>
                      <model.icon className={`h-4.5 w-4.5 ${accentClass}`} />
                    </div>
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected
                          ? isDark
                            ? `${model.darkBorder} ${model.darkBg}`
                            : `${model.lightBorder} ${model.lightBg}`
                          : isDark
                          ? 'border-space-400'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected ? (
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            isDark
                              ? model.id === 'graph'
                                ? 'bg-neon-purple'
                                : 'bg-neon-green'
                              : model.id === 'graph'
                              ? 'bg-indigo-600'
                              : 'bg-emerald-600'
                          }`}
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className={`text-[15px] font-semibold leading-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {model.title}
                    </h3>
                    <p className={`text-xs font-medium ${accentClass}`}>{model.subtitle}</p>
                  </div>

                  <p className={`max-w-[58ch] text-[13px] leading-6 ${isDark ? 'text-space-300' : 'text-slate-700'}`}>
                    {model.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {model.features.map((feature) => (
                      <span
                        key={feature}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium leading-none ${accentBgClass} ${accentClass}`}
                      >
                        {model.id === 'graph' ? (
                          <GitBranch className="h-2.5 w-2.5" />
                        ) : (
                          <Cpu className="h-2.5 w-2.5" />
                        )}
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
