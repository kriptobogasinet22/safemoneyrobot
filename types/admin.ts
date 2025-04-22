export interface Conversion {
  id: number
  user_id: number
  username: string
  from_currency: string
  to_currency: string
  amount: number
  result: number
  created_at: string
}

export interface Stats {
  totalConversions: number
  uniqueUsers: number
  currencyCounts: Record<string, { from: number; to: number }>
  recentConversions: number
}

export interface AdminSession {
  isLoggedIn: boolean
}
