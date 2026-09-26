import type { Dispatch, SetStateAction } from 'react'
import SkillPanel from '@/domain/skill/components/SkillPanel'
import ActiveSkillPanel from '@/domain/skill/components/ActiveSkillPanel'
import type { Character } from '@/domain/hero/types'
import type { SkillEntry } from '@/domain/skill/active-skills.utils'

type SkillsViewProps = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  activeSkills: SkillEntry[]
}

function SkillsView({ character, setCharacter, activeSkills }: SkillsViewProps) {
  const toggleSkill = (skillId: string, isProc: boolean) =>
    setCharacter((current) => {
      if (isProc) {
        const enabled = new Set(current.enabledProcSkills ?? [])
        if (enabled.has(skillId)) enabled.delete(skillId)
        else enabled.add(skillId)
        return { ...current, enabledProcSkills: [...enabled] }
      }
      const disabled = new Set(current.disabledPassiveSkills ?? [])
      if (disabled.has(skillId)) disabled.delete(skillId)
      else disabled.add(skillId)
      return { ...current, disabledPassiveSkills: [...disabled] }
    })

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <SkillPanel character={character} setCharacter={setCharacter} />
      <ActiveSkillPanel skills={activeSkills} onSkillToggle={toggleSkill} />
    </div>
  )
}

export default SkillsView
