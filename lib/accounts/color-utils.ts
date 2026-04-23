import { ACCOUNT_COLOR_SWATCHES, type AccountColorToken } from '@/lib/accounts/schema'

export function hexToAccountColorToken(hex: string): AccountColorToken {
  const normalized = hex.trim().toLowerCase()
  const hit = ACCOUNT_COLOR_SWATCHES.find((s) => s.hex.toLowerCase() === normalized)
  return hit?.token ?? 'emerald'
}
