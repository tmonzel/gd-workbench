import type { Dispatch, SetStateAction } from 'react'
import SkillPanel from '@/domain/skill/components/SkillPanel'
import ActiveSkillPanel from '@/domain/skill/components/ActiveSkillPanel'
import type { Character } from '@/domain/hero/types'
import type { SkillEntry } from '@/domain/skill/components/ActiveSkillPanel'

type SkillsViewProps = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  itemBonuses?: Record<string, number>
  activeSkills: SkillEntry[]
}

function SkillsView({ character, setCharacter, itemBonuses, activeSkills }: SkillsViewProps) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
      <SkillPanel character={character} setCharacter={setCharacter} itemBonuses={itemBonuses} />
      <ActiveSkillPanel skills={activeSkills} />
    </div>
  )
}

export default SkillsView
