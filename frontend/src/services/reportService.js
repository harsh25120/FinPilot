import api from './api'

export function getMonthlyReport(year, month) {
  return api.get(`/reports/monthly/${year}/${month}`).then((res) => res.data)
}

export function getYearlyReport(year) {
  return api.get(`/reports/yearly/${year}`).then((res) => res.data)
}

// Returns a Blob — the caller turns it into a download link.
export function exportTransactionsCsv(params) {
  return api.get('/reports/export/csv', { params, responseType: 'blob' }).then((res) => res.data)
}
