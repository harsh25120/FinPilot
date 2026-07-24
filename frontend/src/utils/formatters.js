// The backend sends money as decimal strings (e.g. "1500.00") to avoid
// floating-point rounding issues, and plain dates as "YYYY-MM-DD" strings
// (no time/timezone). These helpers format both for display.

export function formatCurrency(amount, currency = 'USD') {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  if (value === null || value === undefined || Number.isNaN(value)) return '—'

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    // Intl throws on a currency code it doesn't recognize.
    return `${value.toFixed(2)} ${currency}`
  }
}

// Parses a plain "YYYY-MM-DD" date into a *local* Date at midnight. Using
// `new Date("2026-07-01")` directly parses it as UTC midnight, which can
// display as the previous day for anyone west of UTC — this avoids that.
export function parseDateOnly(dateString) {
  if (!dateString) return null
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDate(dateString, options = {}) {
  const date = parseDateOnly(dateString)
  if (!date) return '—'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

// For full ISO timestamps like created_at/updated_at, which do carry
// timezone info and can be parsed directly.
export function formatDateTime(isoString) {
  if (!isoString) return '—'

  const date = new Date(isoString)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(decimals)}%`
}

// Today's date as "YYYY-MM-DD", the format <input type="date"> expects.
export function todayISO() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
