const CURRENCY_LOCALES = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AUD: 'en-AU',
  CAD: 'en-CA',
  JPY: 'ja-JP',
}

export function formatCurrency(
  amount,
  currency = "INR",
  showDecimals = true
) {
  return new Intl.NumberFormat(
    CURRENCY_LOCALES[currency] || "en-US",
    {
      style: "currency",
      currency,
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }
  ).format(Number(amount))
}

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
