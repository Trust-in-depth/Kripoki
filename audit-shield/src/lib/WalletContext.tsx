/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface EthereumProvider {
  isMetaMask?: boolean
  providers?: EthereumProvider[]
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
}

interface EthereumRequestError extends Error {
  code?: number
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

interface WalletContextValue {
  connected: boolean
  address: string
  chainId: string
  isConnecting: boolean
  isAvailable: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const STORAGE_KEY = 'kripoki-wallet-autoconnect'

const WalletContext = createContext<WalletContextValue>({
  connected: false,
  address: '',
  chainId: '',
  isConnecting: false,
  isAvailable: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
})

function normalizeAccounts(accounts: unknown) {
  if (!Array.isArray(accounts)) return []
  return accounts.filter((account): account is string => typeof account === 'string')
}

function getEthereumProvider() {
  if (typeof window === 'undefined') {
    return null
  }

  const injected = window.ethereum
  if (!injected) {
    return null
  }

  if (Array.isArray(injected.providers) && injected.providers.length > 0) {
    return injected.providers.find((provider) => provider.isMetaMask) ?? injected.providers[0]
  }

  return injected
}

function getUnavailableWalletMessage() {
  return 'MetaMask bulunamadı. Uygulamayı MetaMask yüklü Chrome, Brave veya Edge tarayıcısında açın. Kod editörü uygulama içi önizlemede açıksa eklenti görünmeyebilir.'
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<EthereumProvider | null>(null)
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState('')
  const [chainId, setChainId] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shouldAutoconnect, setShouldAutoconnect] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const syncProvider = () => {
      setProvider(getEthereumProvider())
    }

    syncProvider()

    const timer = window.setTimeout(syncProvider, 750)
    window.addEventListener('ethereum#initialized', syncProvider as EventListener)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('ethereum#initialized', syncProvider as EventListener)
    }
  }, [])

  const isAvailable = Boolean(provider)

  useEffect(() => {
    if (!provider) {
      return
    }

    const handleAccountsChanged = (accountsValue: unknown) => {
      const accounts = normalizeAccounts(accountsValue)

      if (accounts.length === 0) {
        setConnected(false)
        setAddress('')
        setChainId('')
        return
      }

      setConnected(true)
      setAddress(accounts[0])
      setError(null)
    }

    const handleChainChanged = (chainValue: unknown) => {
      if (typeof chainValue === 'string') {
        setChainId(chainValue)
      }
    }

    provider.on?.('accountsChanged', handleAccountsChanged)
    provider.on?.('chainChanged', handleChainChanged)

    const loadExistingSession = async () => {
      if (!shouldAutoconnect) return

      try {
        const [accounts, currentChainId] = await Promise.all([
          provider.request({ method: 'eth_accounts' }),
          provider.request({ method: 'eth_chainId' }),
        ])

        handleAccountsChanged(accounts)
        handleChainChanged(currentChainId)
      } catch {
        setError('Cüzdan oturumu kontrol edilirken bir hata oluştu.')
      }
    }

    void loadExistingSession()

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged)
      provider.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [provider, shouldAutoconnect])

  const connect = useCallback(async () => {
    if (!provider) {
      setError(getUnavailableWalletMessage())
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const [accounts, currentChainId] = await Promise.all([
        provider.request({ method: 'eth_requestAccounts' }),
        provider.request({ method: 'eth_chainId' }),
      ])

      const normalizedAccounts = normalizeAccounts(accounts)
      if (normalizedAccounts.length === 0) {
        throw new Error('Cüzdan hesabı alınamadı.')
      }

      setConnected(true)
      setAddress(normalizedAccounts[0])
      setChainId(typeof currentChainId === 'string' ? currentChainId : '')
      setShouldAutoconnect(true)
      window.localStorage.setItem(STORAGE_KEY, 'true')
      setError(null)
    } catch (connectError) {
      const requestError = connectError as EthereumRequestError

      if (requestError?.code === 4001) {
        setError('Cüzdan bağlantısı kullanıcı tarafından iptal edildi.')
      } else {
        setError(
          connectError instanceof Error
            ? connectError.message
            : 'Cüzdan bağlantısı sırasında bir hata oluştu.'
        )
      }
    } finally {
      setIsConnecting(false)
    }
  }, [provider])

  const disconnect = useCallback(() => {
    setConnected(false)
    setAddress('')
    setChainId('')
    setError(null)
    setShouldAutoconnect(false)
    window.localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({
      connected,
      address,
      chainId,
      isConnecting,
      isAvailable,
      error,
      connect,
      disconnect,
    }),
    [address, chainId, connect, connected, disconnect, error, isAvailable, isConnecting]
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  return useContext(WalletContext)
}
