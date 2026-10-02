import type { Dispatch, SetStateAction } from 'react'
import MasteryPanel from '@/domain/mastery/components/MasteryPanel'
import type { Character } from '@/domain/hero/types'

type MasteriesViewProps = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  onMasteryChange: (slot: 'mastery1' | 'mastery2', value: string) => void
}

function MasteriesView({ character, setCharacter, onMasteryChange }: MasteriesViewProps) {
  return <MasteryPanel character={character} setCharacter={setCharacter} onMasteryChange={onMasteryChange} />
}

export default MasteriesView
