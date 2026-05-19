import { motion } from 'framer-motion'
import { useTheme } from '../lib/ThemeContext'
import type { AnalysisModel } from '../lib/types'

interface Props {
  model: AnalysisModel
}

interface Node {
  id: string
  x: number
  y: number
  label: string
  type: 'function' | 'variable' | 'event' | 'contract'
}

interface Edge {
  from: string
  to: string
}

const GRAPH_NODES: Node[] = [
  { id: 'contract', x: 200, y: 40, label: 'VaultToken', type: 'contract' },
  { id: 'stake', x: 80, y: 120, label: 'stake()', type: 'function' },
  { id: 'unstake', x: 320, y: 120, label: 'unstake()', type: 'function' },
  { id: 'emergency', x: 200, y: 120, label: 'emergencyWithdraw()', type: 'function' },
  { id: 'stakedBal', x: 60, y: 210, label: 'stakedBalance', type: 'variable' },
  { id: 'stakeTime', x: 200, y: 210, label: 'stakeTimestamp', type: 'variable' },
  { id: 'maxSupply', x: 340, y: 210, label: 'maxSupply', type: 'variable' },
  { id: 'stakedEvt', x: 80, y: 290, label: 'Staked', type: 'event' },
  { id: 'unstakedEvt', x: 320, y: 290, label: 'Unstaked', type: 'event' },
]

const GRAPH_EDGES: Edge[] = [
  { from: 'contract', to: 'stake' },
  { from: 'contract', to: 'unstake' },
  { from: 'contract', to: 'emergency' },
  { from: 'stake', to: 'stakedBal' },
  { from: 'stake', to: 'stakeTime' },
  { from: 'unstake', to: 'stakedBal' },
  { from: 'unstake', to: 'stakeTime' },
  { from: 'contract', to: 'maxSupply' },
  { from: 'stake', to: 'stakedEvt' },
  { from: 'unstake', to: 'unstakedEvt' },
]

const SEQ_LAYERS = [
  { label: 'Girdi Katmanı', nodes: 8 },
  { label: 'Conv1D', nodes: 6 },
  { label: 'Conv1D', nodes: 6 },
  { label: 'BiLSTM', nodes: 4 },
  { label: 'BiLSTM', nodes: 4 },
  { label: 'Yoğun Katman', nodes: 3 },
  { label: 'Çıkış', nodes: 2 },
]

const nodeColors: Record<string, string> = {
  contract: '#a855f7',
  function: '#3b82f6',
  variable: '#10b981',
  event: '#f59e0b',
}

export default function RelationshipGraph({ model }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const containerClass = `overflow-hidden rounded-2xl border p-6 ${
    isDark
      ? 'border-glass-border bg-glass-bg'
      : 'border-light-glass-border bg-white shadow-sm'
  }`

  const titleClass = `mb-3 text-center text-xs font-semibold uppercase tracking-wider ${
    isDark ? 'text-space-300' : 'text-slate-700'
  }`

  const legendTextClass = `text-[10px] ${isDark ? 'text-space-400' : 'text-slate-600'}`

  if (model === 'sequential') {
    return (
      <div className={containerClass}>
        <h4 className={titleClass}>CNN-BiLSTM Hattı</h4>
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
          {SEQ_LAYERS.map((layer, li) => (
            <div key={layer.label} className="flex items-center gap-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: li * 0.15 }}
                className="flex flex-col items-center gap-1.5"
              >
                <span className={`whitespace-nowrap text-[9px] font-medium ${legendTextClass}`}>
                  {layer.label}
                </span>
                <div className="flex flex-col items-center gap-1">
                  {Array.from({ length: layer.nodes }).map((_, ni) => (
                    <motion.div
                      key={ni}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: li * 0.15 + ni * 0.03 }}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: li <= 2 ? '#3b82f6' : li <= 4 ? '#a855f7' : '#10b981',
                        boxShadow:
                          li <= 2
                            ? '0 0 6px #3b82f640'
                            : li <= 4
                            ? '0 0 6px #a855f740'
                            : '0 0 6px #10b98140',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
              {li < SEQ_LAYERS.length - 1 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ delay: li * 0.15 + 0.1 }}
                  className={`h-px w-4 ${
                    isDark
                      ? 'bg-gradient-to-r from-space-400 to-space-400'
                      : 'bg-gradient-to-r from-slate-300 to-slate-300'
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <span className={`flex items-center gap-1 ${legendTextClass}`}>
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Evrişim
          </span>
          <span className={`flex items-center gap-1 ${legendTextClass}`}>
            <span className="h-2 w-2 rounded-full bg-neon-purple" /> Tekrarlayan
          </span>
          <span className={`flex items-center gap-1 ${legendTextClass}`}>
            <span className="h-2 w-2 rounded-full bg-neon-green" /> Yoğun
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={containerClass}>
      <h4 className={titleClass}>Sözleşme İlişki Grafiği</h4>
      <svg viewBox="0 0 400 330" className="mx-auto w-full max-w-lg">
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon
              points="0 0, 6 2, 0 4"
              fill={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(71,85,105,0.35)'}
            />
          </marker>
        </defs>

        {GRAPH_EDGES.map((edge) => {
          const from = GRAPH_NODES.find((n) => n.id === edge.from)!
          const to = GRAPH_NODES.find((n) => n.id === edge.to)!
          return (
            <motion.line
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={
                isDark ? 'rgba(168, 85, 247, 0.55)' : 'rgba(99,102,241,0.35)'
              }
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )
        })}

        {GRAPH_NODES.map((node) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={node.type === 'contract' ? 14 : 10}
              fill={`${nodeColors[node.type]}20`}
              stroke={nodeColors[node.type]}
              strokeWidth={1.5}
              style={{ filter: `drop-shadow(0 0 4px ${nodeColors[node.type]}30)` }}
            />
            <text
              x={node.x}
              y={node.y + 24}
              textAnchor="middle"
              fill={isDark ? '#94a3b8' : '#475569'}
              fontSize="8"
              fontFamily="Inter, sans-serif"
            >
              {node.label}
            </text>
          </motion.g>
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-4">
        <span className={`flex items-center gap-1 ${legendTextClass}`}>
          <span className="h-2 w-2 rounded-full bg-neon-purple" /> Sözleşme
        </span>
        <span className={`flex items-center gap-1 ${legendTextClass}`}>
          <span className="h-2 w-2 rounded-full bg-blue-500" /> Fonksiyon
        </span>
        <span className={`flex items-center gap-1 ${legendTextClass}`}>
          <span className="h-2 w-2 rounded-full bg-neon-green" /> Değişken
        </span>
        <span className={`flex items-center gap-1 ${legendTextClass}`}>
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Olay
        </span>
      </div>
    </div>
  )
}
