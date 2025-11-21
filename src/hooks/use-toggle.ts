import { useState } from 'react'

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  const toggle = (next?: boolean) => setValue(prev => next ?? !prev)
  return [value, toggle]
}
