import { useEffect, useState } from 'react'
import type { Mastery, MasterySkill } from '@/domain/skill/types'

export function useSkillData() {
  const [masteries, setMasteries] = useState<Mastery[]>([])
  const [skillsets, setSkillsets] = useState<Record<string, MasterySkill[]>>({})

  useEffect(() => {
    fetch('/data/masteries.json')
      .then((response) => response.json() as Promise<Mastery[]>)
      .then(setMasteries)
      .catch(() => setMasteries([]))
    fetch('/data/mastery-skills.json')
      .then((response) => response.json() as Promise<Record<string, MasterySkill[]>>)
      .then(setSkillsets)
      .catch(() => setSkillsets({}))
  }, [])

  return { masteries, skillsets }
}
