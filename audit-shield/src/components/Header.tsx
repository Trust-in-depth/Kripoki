import { motion } from 'framer-motion'
import { Activity, Moon, Shield, Sun, Wallet } from 'lucide-react'
import { useTheme } from '../lib/ThemeContext'
import { useWallet } from '../lib/WalletContext'

function shortenAddress(address: string) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function Header() {
  const { theme, toggle } = useTheme()
  const { connected, address, connect, disconnect, isConnecting, isAvailable, error } = useWallet()
  const isDark = theme === 'dark'

  const walletLabel = connected
    ? shortenAddress(address)
    : isConnecting
      ? 'Bağlanıyor...'
      : isAvailable
        ? 'Cüzdanı Bağla'
        : 'MetaMask Yok'

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 border-b backdrop-blur-xl ${
        isDark
          ? 'border-glass-border bg-space-900/80'
          : 'border-light-glass-border bg-white/90'
      }`}
    >
      <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-4 px-6 py-3 sm:px-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-neon-purple to-neon-green">
            <Shield className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-neon-purple to-neon-green opacity-50 blur-sm" />
          </div>
          <div>
            <h1 className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-light-text'}`}>
              Kripoki
            </h1>
            <p className={`text-[10px] font-medium tracking-widest ${isDark ? 'text-space-300' : 'text-slate-500'}`}>
              AKILLI SÖZLEŞME GÜVENLİĞİ
            </p>
          </div>
        </motion.div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`hidden items-center gap-1.5 rounded-full px-3 py-1 sm:flex ${
                isDark ? 'bg-neon-green/10' : 'bg-emerald-50'
              }`}
            >
              <Activity className="h-3 w-3 text-neon-green" />
              <span className="text-xs font-medium text-neon-green">Canlı</span>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggle}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                isDark
                  ? 'border border-glass-border bg-glass-bg text-space-300 hover:bg-glass-bg-hover hover:text-white'
                  : 'border border-light-glass-border bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
              aria-label="Temayı değiştir"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={connected ? disconnect : connect}
              title={connected ? address : error || walletLabel}
              disabled={isConnecting}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                connected
                  ? isDark
                    ? 'border border-neon-green/30 bg-neon-green/10 text-neon-green'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : !isAvailable
                    ? isDark
                      ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border border-amber-200 bg-amber-50 text-amber-700'
                    : 'bg-gradient-to-r from-neon-purple to-neon-purple-dark text-white shadow-lg shadow-neon-purple/20'
              } ${isConnecting ? 'cursor-wait opacity-80' : ''}`}
            >
              <Wallet className="h-4 w-4" />
              {walletLabel}
            </motion.button>
          </div>

          {!connected && error ? (
            <p className={`max-w-[420px] text-right text-[11px] leading-4 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
