import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import { Card } from '@/components/Card'
import SkillList from '@/domain/skill/components/SkillList'
import type { Character } from '@/domain/hero/types'
import { skillPointsForLevel, spentSkillPoints } from '@/domain/skill/skill.utils'
import { useSkillData } from '@/domain/skill/skill.hooks'

type SkillPanelProps = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
}

function SkillPanel({ character, setCharacter }: SkillPanelProps) {
  const [preferredMasteryId, setPreferredMasteryId] = useState('')
  const { masteries, skillsets } = useSkillData()
  const selectedMasteryIds = [character.mastery1, character.mastery2].filter(Boolean) as string[]
  const activeMasteryId = selectedMasteryIds.includes(preferredMasteryId) ? preferredMasteryId : selectedMasteryIds[0]
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
        <div className="grid gap-5">
          {selectedMasteryIds.length > 1 && (
            <nav className="flex w-full gap-1 border-b border-neutral-800" aria-label="Mastery skill trees">
              {selectedMasteryIds.map((masteryId) => {
                const mastery = masteries.find((entry) => entry.id === masteryId)
                const selected = masteryId === activeMasteryId
                return (
                  <button
                    className={`flex-1 border-b-2 px-3 pb-2 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-orange-300 text-orange-200'
                        : 'border-transparent text-neutral-500 hover:text-neutral-200'
                    }`}
                    key={masteryId}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setPreferredMasteryId(masteryId)}
                  >
                    {mastery?.name ?? 'Mastery'}
                  </button>
                )
              })}
            </nav>
          )}
          {activeMasteryId &&
            (() => {
              const masteryId = activeMasteryId
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
                        aria-label={`Decrease ${mastery?.name ?? 'mastery'} rank`}
                      >
                        −
                      </button>
                      {masteryLevel} / 50
                      <button
                        className="size-7 rounded border border-neutral-700 bg-neutral-900 disabled:opacity-30"
                        type="button"
                        disabled={masteryLevel === 50 || availablePoints <= 0}
                        onClick={() => changeMasteryLevel(masteryId, 1)}
                        aria-label={`Increase ${mastery?.name ?? 'mastery'} rank`}
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
                    masteryId={masteryId}
                    masteryLevel={masteryLevel}
                  />
                </section>
              )
            })()}
        </div>
      )}
    </Card>
  )
}

export default SkillPanel
