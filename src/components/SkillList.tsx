import type { Dispatch, SetStateAction } from 'react'
import type { Character, MasterySkill } from '../types'
import { formatSkillEffectParts, formatSkillValue } from '../damage-utils'
import { skillPointsForLevel, spentSkillPoints } from '../skill-points'

type SkillListProps = {
  skills: MasterySkill[]
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  itemBonuses?: Record<string, number>
  masteryId: string
  masteryLevel: number
}

function SkillList({ skills, character, setCharacter, itemBonuses = {}, masteryId, masteryLevel }: SkillListProps) {
  const skillGroups = [...new Set(skills.map((skill) => skill.groupId))].map((groupId) => ({
    base:
      skills.find((skill) => skill.groupId === groupId && !skill.isModifier) ??
      skills.find((skill) => skill.groupId === groupId),
    modifiers: skills.filter((skill) => skill.groupId === groupId && skill.isModifier),
  }))

  const changeSkillLevel = (skill: MasterySkill, delta: number, baseSkillId = skill.id) => {
    setCharacter((current) => {
      if (skill.isModifier && (current.skillLevels[baseSkillId] ?? 0) < 1) return current
      if (delta > 0 && (current.masteryLevels[masteryId] ?? masteryLevel) < skill.masteryLevelRequired) return current
      if (delta > 0 && spentSkillPoints(current) >= skillPointsForLevel(current.level)) return current
      const currentLevel = current.skillLevels[skill.id] ?? 0
      const level = Math.max(0, Math.min(skill.maxLevel, currentLevel + delta))
      return { ...current, skillLevels: { ...current.skillLevels, [skill.id]: level } }
    })
  }

  const renderSkill = (skill: MasterySkill, baseSkillId: string) => {
    const level = character.skillLevels[skill.id] ?? 0
    // items granting "+X to <skill>" add virtual points on top of allocated ones
    const bonus = itemBonuses[skill.name] ?? 0
    const locked =
      (skill.isModifier && (character.skillLevels[baseSkillId] ?? 0) < 1) || masteryLevel < skill.masteryLevelRequired
    const effectiveLevel = level + bonus
    const rankEffects =
      effectiveLevel > 0
        ? skill.effects
            .filter(
              (effect) =>
                skill.isModifier ||
                skill.isTransmuter ||
                (effect.key !== 'offensiveDamageMultModifier' && effect.key !== 'conversionPercentage'),
            )
            .map((effect) => {
              const value = effect.values[Math.min(effectiveLevel, effect.values.length) - 1]
              return {
                ...effect,
                value,
                displayParts: formatSkillEffectParts({ ...effect, value }, effectiveLevel),
              }
            })
            .filter((effect) => Number.isFinite(effect.value) && effect.value !== 0)
        : []
    const summonEffects =
      effectiveLevel > 0
        ? skill.summonEffects
            .flatMap((summon) =>
              summon.effects.map((effect) => ({
                ...effect,
                summon: summon.name,
                value: effect.values[Math.min(effectiveLevel, effect.values.length) - 1],
              })),
            )
            .filter((effect) => Number.isFinite(effect.value) && effect.value !== 0)
        : []
    return (
      <button
        className={`grid h-fit self-start content-start justify-items-start gap-1 rounded-md border p-3 text-left transition-colors ${skill.isModifier ? 'ml-4' : ''} ${locked ? 'cursor-not-allowed border-neutral-900 bg-neutral-950/40 opacity-45' : 'border-neutral-800 bg-neutral-900/70 hover:border-neutral-500 hover:bg-neutral-800/70'}`}
        key={skill.id}
        type="button"
        disabled={locked}
        onClick={() => changeSkillLevel(skill, 1, baseSkillId)}
        onContextMenu={(event) => {
          event.preventDefault()
          changeSkillLevel(skill, -1, baseSkillId)
        }}
        title={
          locked
            ? 'Allocate at least 1 point in the base skill first'
            : masteryLevel < skill.masteryLevelRequired
              ? `Requires mastery level ${skill.masteryLevelRequired}`
              : 'Left click to increase, right click to decrease'
        }
      >
        <span className="flex items-center justify-between gap-2 text-sm text-neutral-100">
          <span className="flex min-w-0 items-center gap-2">
            {skill.icon && <img className="shrink-0 object-cover" src={skill.icon} alt="" />}
            <span className="truncate">{skill.name}</span>
            {skill.isTransmuter && (
              <span className="shrink-0 rounded border border-orange-400/30 bg-orange-400/10 px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-orange-200">
                Transmuter
              </span>
            )}
          </span>
          <strong className="shrink-0 text-[#fcd34d]">
            {level}
            {bonus > 0 && <span className="text-emerald-400"> +{bonus}</span>} / {skill.maxLevel}
          </strong>
        </span>
        <span className="line-clamp-2 text-xs leading-snug text-neutral-500">
          {skill.description.replaceAll('^o', '')}
        </span>
        {rankEffects.length > 0 && (
          <span className="mt-1 grid gap-0.5 border-t border-neutral-800 pt-1 text-xs text-neutral-400">
            {rankEffects.slice(0, 6).map((effect) => (
              <span className="text-neutral-300" key={effect.key}>
                <strong className="text-neutral-200">{effect.displayParts.value}</strong> {effect.displayParts.label}
              </span>
            ))}
          </span>
        )}
        {summonEffects.length > 0 && (
          <span className="mt-1 grid gap-0.5 border-t border-neutral-800 pt-1 text-xs text-orange-200">
            <strong className="text-[0.68rem] uppercase tracking-[0.12em] text-orange-300">Summoned effects</strong>
            {summonEffects.slice(0, 8).map((effect) => (
              <span key={`${effect.summon}-${effect.key}`}>
                <strong className="text-neutral-100">
                  {formatSkillValue(effect.value)}
                  {effect.suffix ?? ''}
                </strong>{' '}
                {effect.label} <span className="text-neutral-500">({effect.summon})</span>
              </span>
            ))}
          </span>
        )}
      </button>
    )
  }

  if (!skillGroups.length) return null
  return (
    <div className="mt-6 grid items-start gap-2 sm:grid-cols-2">
      {skillGroups.map(({ base, modifiers }) => {
        if (!base) return null
        return modifiers.length === 0 ? (
          renderSkill(base, base.id)
        ) : (
          <div
            className="grid h-fit self-start content-start gap-2 rounded-lg border border-neutral-800 bg-neutral-950/40 p-2"
            key={base.groupId}
          >
            {[base, ...modifiers].map((skill) => renderSkill(skill, base.id))}
          </div>
        )
      })}
    </div>
  )
}

export default SkillList
