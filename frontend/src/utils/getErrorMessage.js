// The backend returns errors as either {"detail": "some message"} or, for
// validation errors, {"detail": "Validation error", "errors": [{field, message}]}.
// This normalizes both (plus network failures) into one string for display.
export default function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback

  const data = error.response?.data

  if (data?.errors?.length) {
    const first = data.errors[0]
    return first.field ? `${first.field}: ${first.message}` : first.message
  }

  if (typeof data?.detail === 'string') {
    return data.detail
  }

  if (error.request && !error.response) {
    return 'Could not reach the server. Is the backend running?'
  }

  return error.message || fallback
}
