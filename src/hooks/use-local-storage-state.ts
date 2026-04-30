import { Dispatch, SetStateAction, useEffect, useState } from 'react'

function readStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  try {
    const storedValue = window.localStorage.getItem(key)
    return storedValue ? (JSON.parse(storedValue) as T) : defaultValue
  } catch {
    return defaultValue
  }
}

export function useLocalStorageState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStoredValue(key, defaultValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore storage failures so the app remains usable in private or restricted contexts.
    }
  }, [key, value])

  return [value, setValue]
}
