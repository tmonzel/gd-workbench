import { useEffect, useState } from 'react'
import type { DevotionData } from '@/domain/devotion/types'

export function useDevotionData() {
  const [data, setData] = useState<DevotionData | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    fetch('/data/devotions.json')
      .then((response) => response.json() as Promise<DevotionData>)
      .then(setData)
      .catch(() => setData(null))
  }, [])

  return { data, selected, setSelected }
}
