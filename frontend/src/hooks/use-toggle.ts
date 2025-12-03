import { useState } from 'react'

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  const toggle = (next?: boolean) => setValue(v => next ?? !v)
  return [value, toggle]
}
