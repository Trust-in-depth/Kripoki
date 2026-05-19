export type AnalysisModel = 'graph' | 'sequential'

export interface AuditResult {
  id: string
  trust_score: number
  critical_vulns: number
  fraud_risk: string
  gas_efficiency: number
  model: AnalysisModel
  contract_name: string
  created_at: string
  status: 'completed' | 'failed'
  wallet_address?: string | null
  source_code?: string | null
}
