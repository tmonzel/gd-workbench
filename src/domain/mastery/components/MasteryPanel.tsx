import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'
import { Card } from '@/components/Card'
import MasterySkillTree from '@/domain/mastery/components/MasterySkillTree'
import type { Character } from '@/domain/hero/types'
import { skillPointsForLevel, spentSkillPoints } from '@/domain/mastery/mastery.utils'
import { useMasteryData } from '@/domain/mastery/mastery.hooks'

type MasteryPanelProps = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  onMasteryChange: (slot: 'mastery1' | 'mastery2', value: string) => void
}

function MasteryPanel({ character, setCharacter, onMasteryChange }: MasteryPanelProps) {
  const [activeSlot, setActiveSlot] = useState<'mastery1' | 'mastery2'>('mastery1')
  const { masteries, skillsets } = useMasteryData()
  const activeMasteryId = activeSlot === 'mastery1' ? character.mastery1 : character.mastery2
  const otherMasteryId = activeSlot === 'mastery1' ? character.mastery2 : character.mastery1
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
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Masteries</p>
          <h2 className="text-xl font-medium text-neutral-50">Skill allocation</h2>
        </div>
        <p className="m-0 text-sm tabular-nums text-neutral-500">{availablePoints} skill points available</p>
      </div>
      <nav className="mb-5 grid grid-cols-2 gap-2" role="tablist" aria-label="Mastery slots">
        {(['mastery1', 'mastery2'] as const).map((slot, index) => {
          const masteryId = slot === 'mastery1' ? character.mastery1 : character.mastery2
          const mastery = masteries.find((entry) => entry.id === masteryId)
          const selected = activeSlot === slot
          return (
            <button
              className={`flex min-h-14 items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-colors ${selected ? 'border-purple-400/60 bg-purple-400/10 text-purple-100' : 'border-neutral-700 bg-neutral-950/50 text-neutral-400 hover:border-purple-400/40 hover:bg-purple-400/5 hover:text-neutral-100'} disabled:cursor-not-allowed disabled:opacity-40`}
              key={slot}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={slot === 'mastery2' && !character.mastery1}
              onClick={() => setActiveSlot(slot)}
            >
              <span>
                <span className="block text-[0.62rem] uppercase tracking-[0.12em] opacity-60">Mastery {index + 1}</span>
                <strong className="mt-1 block text-sm font-medium">{mastery?.name ?? 'Choose mastery'}</strong>
              </span>
              <span className="text-lg leading-none" aria-hidden="true">
                {mastery ? '✓' : '+'}
              </span>
            </button>
          )
        })}
      </nav>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
        <nav className="grid content-start gap-2" role="listbox" aria-label={`Available choices for ${activeSlot}`}>
          {masteries.map((mastery) => {
            const selected = mastery.id === activeMasteryId
            const unavailable = mastery.id === otherMasteryId
            return (
              <button
                className={`min-h-12 rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors ${selected ? 'border-neutral-500 bg-neutral-800 text-neutral-50 shadow-[inset_2px_0_0_0_rgb(163_163_163)]' : 'border-neutral-800 bg-neutral-950/45 text-neutral-400 hover:border-neutral-600 hover:bg-neutral-800/70 hover:text-neutral-100'} disabled:cursor-not-allowed disabled:opacity-35`}
                key={mastery.id}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={unavailable}
                onClick={() => onMasteryChange(activeSlot, mastery.id)}
              >
                {mastery.name}
              </button>
            )
          })}
          {activeMasteryId && (
            <button
              className="mt-1 rounded-md px-3 py-2 text-left text-xs text-neutral-600 hover:bg-neutral-900 hover:text-neutral-300"
              type="button"
              onClick={() => onMasteryChange(activeSlot, '')}
            >
              Clear Mastery {activeSlot === 'mastery1' ? '1' : '2'}
            </button>
          )}
        </nav>
        {activeMasteryId ? (
          (() => {
            const masteryId = activeMasteryId
            const mastery = masteries.find((entry) => entry.id === masteryId)
            const skills = skillsets[masteryId] ?? []
            const masteryLevel = character.masteryLevels[masteryId] ?? 0
            return (
              <section className="min-w-0" key={masteryId}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium uppercase tracking-[0.12em] text-neutral-300">
                    {mastery?.name ?? 'Mastery'} Skill Tree
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
                <div className="mb-3 h-1 overflow-hidden rounded-full bg-neutral-800">
                  <div className="h-full bg-orange-300" style={{ width: `${masteryLevel * 2}%` }} />
                </div>
                <MasterySkillTree
                  skills={skills}
                  character={character}
                  setCharacter={setCharacter}
                  masteryId={masteryId}
                  masteryLevel={masteryLevel}
                />
              </section>
            )
          })()
        ) : (
          <div className="grid min-h-64 place-items-center rounded-md border border-dashed border-neutral-800 text-sm text-neutral-600">
            Choose a mastery from the list to view its skill tree.
          </div>
        )}
      </div>
    </Card>
  )
}

export default MasteryPanel
