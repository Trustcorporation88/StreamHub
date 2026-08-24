import { useEffect, useState } from "react"

/**
 * Returns `value` after it has stopped changing for `delay` ms.
 *
 * Used to keep expensive derived work off the keystroke path: filtering ~4,000
 * channels ran on every character typed, so fast typing queued a full scan per
 * keystroke and the input visibly lagged behind the user on mobile.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
