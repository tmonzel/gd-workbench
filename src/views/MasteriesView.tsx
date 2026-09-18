import type { Dispatch, SetStateAction } from 'react'
import { Card } from '../components/Card'
import SkillList from '../components/SkillList'
import type { Character, Mastery, MasterySkill } from '../types'

type MasteriesViewProps = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  masteries: Mastery[]
  skillsets: Record<string, MasterySkill[]>
  itemBonuses?: Record<string, number>
}

function MasteriesView({ character, setCharacter, masteries, skillsets, itemBonuses = {} }: MasteriesViewProps) {
  const selectedMasteryIds = [character.mastery1, character.mastery2].filter(Boolean) as string[]

  return (
    <Card as="section" size="lg" variant="elevated">
      <div className="mb-6">
        <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Skills</p>
        <h2 className="text-xl font-medium text-neutral-50">Skill allocation</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Select two masteries, then click skills to allocate or remove points.
        </p>
      </div>
      {selectedMasteryIds.length === 0 ? (
        <p className="m-0 text-sm text-neutral-500">
          Select one or two masteries in the header to view their skill trees.
        </p>
      ) : (
        <div className="grid gap-8">
          {selectedMasteryIds.map((masteryId) => {
            const mastery = masteries.find((entry) => entry.id === masteryId)
            const skills = skillsets[masteryId] ?? []
            return (
              <section key={masteryId}>
                <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.12em] text-neutral-300">
                  {mastery?.name ?? 'Mastery'}
                </h3>
                <SkillList
                  skills={skills}
                  character={character}
                  setCharacter={setCharacter}
                  itemBonuses={itemBonuses}
                />
              </section>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default MasteriesView
