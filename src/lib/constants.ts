export const CORRUPTION_CATEGORIES = {
  bribery: 'Bribery',
  nepotism: 'Nepotism',
  extortion: 'Extortion',
  embezzlement: 'Embezzlement',
  fraud: 'Fraud',
  abuse_of_power: 'Abuse of Power',
  kickbacks: 'Kickbacks',
  misuse_of_funds: 'Misuse of Public Funds',
  other: 'Other'
} as const;

export const REPORT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  disputed: 'bg-red-100 text-red-800',
  resolved: 'bg-blue-100 text-blue-800'
} as const;

export const SEVERITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626'
} as const;