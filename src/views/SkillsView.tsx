import type { Dispatch, SetStateAction } from 'react'
import { Card } from '../components/Card'
import SkillList from '../components/SkillList'
import type { Character, Mastery, MasterySkill } from '../types'
import { skillPointsForLevel, spentSkillPoints } from '../skill-points'

type SkillsViewProps = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  masteries: Mastery[]
  skillsets: Record<string, MasterySkill[]>
  itemBonuses?: Record<string, number>
}

function SkillsView({ character, setCharacter, masteries, skillsets, itemBonuses = {} }: SkillsViewProps) {
  const selectedMasteryIds = [character.mastery1, character.mastery2].filter(Boolean) as string[]
  const availablePoints = skillPointsForLevel(character.level) - spentSkillPoints(character)
  const changeMasteryLevel = (masteryId: string, delta: number) =>
    setCharacter((current) => {
      const level = current.masteryLevels[masteryId] ?? 0
      if (delta > 0 && spentSkillPoints(current) >= skillPointsForLevel(current.level)) return current
      const next = Math.max(0, Math.min(50, level + delta))
      const skillLevels = { ...current.skillLevels }
      if (delta < 0) {
        for (const skill of skillsets[masteryId] ?? []) {
          if (skill.masteryLevelRequired > next) delete skillLevels[skill.id]
        }
      }
      return { ...current, masteryLevels: { ...current.masteryLevels, [masteryId]: next }, skillLevels }
    })

  return (
    <Card as="section" size="lg" variant="filled">
      <div className="mb-6">
        <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Skills</p>
        <h2 className="text-xl font-medium text-neutral-50">Skill allocation</h2>
        <p className="mt-2 text-sm text-neutral-500">{availablePoints} skill points available.</p>
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
            const masteryLevel = character.masteryLevels[masteryId] ?? 0
            return (
              <section key={masteryId}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium uppercase tracking-[0.12em] text-neutral-300">
                    {mastery?.name ?? 'Mastery'}
                  </h3>
                  <span className="flex items-center gap-2 text-sm tabular-nums text-neutral-300">
                    <button
                      className="size-7 rounded border border-neutral-700 bg-neutral-900 disabled:opacity-30"
                      type="button"
                      disabled={masteryLevel === 0}
                      onClick={() => changeMasteryLevel(masteryId, -1)}
                    >
                      −
                    </button>
                    {masteryLevel} / 50
                    <button
                      className="size-7 rounded border border-neutral-700 bg-neutral-900 disabled:opacity-30"
                      type="button"
                      disabled={masteryLevel === 50 || availablePoints <= 0}
                      onClick={() => changeMasteryLevel(masteryId, 1)}
                    >
                      +
                    </button>
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-neutral-800">
                  <div className="h-full bg-orange-300" style={{ width: `${masteryLevel * 2}%` }} />
                </div>
                <SkillList
                  skills={skills}
                  character={character}
                  setCharacter={setCharacter}
                  itemBonuses={itemBonuses}
                  masteryId={masteryId}
                  masteryLevel={masteryLevel}
                />
              </section>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default SkillsView