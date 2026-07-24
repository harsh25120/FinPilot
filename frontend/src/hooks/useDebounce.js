import { useEffect, useState } from 'react'

// Delays updating the returned value until `value` has stopped changing for
// `delayMs` — used on search inputs so we don't fire an API request on
// every keystroke.
export default function useDebounce(value, delayMs = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return debouncedValue
}
