import type { Dispatch, SetStateAction } from 'react'
import { IconSword } from '@tabler/icons-react'
import type { Character } from '@/domain/hero/types'
import type { MasterySkill } from '@/domain/skill/types'
import {
  formatSkillEffectParts,
  formatSkillValue,
  skillPointsForLevel,
  spentSkillPoints,
} from '@/domain/skill/skill.utils'

type SkillListProps = {
  skills: MasterySkill[]
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  itemBonuses?: Record<string, number>
  masteryId: string
  masteryLevel: number
}

function SkillList({ skills, character, setCharacter, itemBonuses = {}, masteryId, masteryLevel }: SkillListProps) {
  const skillGroups = [...new Set(skills.map((skill) => skill.groupId))]
    .map((groupId) => ({
      base:
        skills.find((skill) => skill.groupId === groupId && !skill.isModifier) ??
        skills.find((skill) => skill.groupId === groupId),
      modifiers: skills.filter((skill) => skill.groupId === groupId && skill.isModifier),
    }))
    .sort((left, right) => (left.base?.masteryLevelRequired ?? 0) - (right.base?.masteryLevelRequired ?? 0))

  const changeSkillLevel = (skill: MasterySkill, delta: number, baseSkillId = skill.id) => {
    setCharacter((current) => {
      if (skill.isModifier && (current.skillLevels[baseSkillId] ?? 0) < 1) return current
      if (delta > 0 && (current.masteryLevels[masteryId] ?? masteryLevel) < skill.masteryLevelRequired) return current
      if (delta > 0 && spentSkillPoints(current) >= skillPointsForLevel(current.level)) return current
      const currentLevel = current.skillLevels[skill.id] ?? 0
      const level = Math.max(0, Math.min(skill.maxLevel, currentLevel + delta))
      const skillLevels = { ...current.skillLevels, [skill.id]: level }
      if (!skill.isModifier && level === 0) {
        for (const child of skills.filter((entry) => entry.groupId === skill.groupId && entry.isModifier))
          delete skillLevels[child.id]
      }
      return { ...current, skillLevels }
    })
  }

  const renderSkill = (skill: MasterySkill, baseSkillId: string, grouped = false) => {
    const level = character.skillLevels[skill.id] ?? 0
    // items granting "+X to <skill>" add virtual points on top of allocated ones
    const bonus = itemBonuses[skill.name] ?? 0
    const locked =
      (skill.isModifier && (character.skillLevels[baseSkillId] ?? 0) < 1) || masteryLevel < skill.masteryLevelRequired
    const allocated = level > 0
    const allocatedStyle = grouped
      ? ''
      : allocated
        ? 'border-orange-300/70 outline outline-1 outline-orange-300/40'
        : 'border-neutral-800 bg-neutral-900/70'
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
              const displayParts = formatSkillEffectParts({ ...effect, value }, effectiveLevel)
              if (effect.key.startsWith('character') && /Modifier$/i.test(effect.key) && value > 0)
                displayParts.value = `+${displayParts.value}`
              return {
                ...effect,
                value,
                displayParts,
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
      <div className="h-fit break-inside-avoid" key={skill.id}>
        <button
          className={`grid h-fit w-full self-start content-start grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-1 p-3 text-left transition-colors ${skill.isModifier ? 'ml-0 border-t border-neutral-800 pt-3' : ''} ${grouped ? 'rounded-none border-0' : 'rounded-md border'} ${allocatedStyle} ${locked ? 'cursor-not-allowed opacity-45' : grouped ? 'hover:bg-neutral-800/70' : allocated ? 'hover:border-orange-300' : 'hover:border-neutral-500 hover:bg-neutral-800/70'} ${locked && !grouped ? 'border-neutral-900 bg-neutral-950/40' : ''}`}
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
        <span className="row-span-3 flex w-8 items-start justify-center">
          {skill.icon && <img className="size-8 shrink-0 object-cover" src={skill.icon} alt="" />}
        </span>
        <span className="min-w-0 text-sm text-neutral-100">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-neutral-100">{skill.name}</span>
            <span className="shrink-0">
              ({level} / {skill.maxLevel})
            </span>
            {skill.isTransmuter && (
              <span className="shrink-0 rounded border border-orange-400/30 bg-orange-400/10 px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-orange-200">
                Transmuter
              </span>
            )}
            {skill.isWeaponDefaultAttack && (
              <span className="flex items-center text-orange-200" title="Weapon Default Attack Skill">
                <IconSword size={15} stroke={1.8} aria-label="Weapon Default Attack Skill" />
              </span>
            )}
          </span>
        </span>
        <span className="flex flex-col items-end gap-1 text-right">
          <span
            className={`text-[0.68rem] uppercase tracking-widest ${locked ? 'text-neutral-600' : 'text-orange-300/80'}`}
          >
            {skill.masteryLevelRequired} Points required
          </span>
        </span>
        <span className="min-w-0 line-clamp-2 text-xs leading-snug text-neutral-500">
          {skill.description.replaceAll('^o', '')}
        </span>
        {rankEffects.length > 0 && (
          <span className="col-start-2 mt-1 grid min-w-0 gap-0.5 border-t border-neutral-800 pt-1 text-xs text-neutral-400">
            {rankEffects.slice(0, 6).map((effect) => (
              <span className="text-neutral-300" key={effect.key}>
                <strong className="text-neutral-200">{effect.displayParts.value}</strong> {effect.displayParts.label}
              </span>
            ))}
          </span>
        )}
        {summonEffects.length > 0 && (
          <span className="col-start-2 mt-1 grid min-w-0 gap-0.5 border-t border-neutral-800 pt-1 text-xs text-orange-200">
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
      </div>
    )
  }

  if (!skillGroups.length) return null
  return (
    <div className="mt-6 grid gap-2 columns-1 sm:columns-2">
      {skillGroups.map(({ base, modifiers }) => {
        if (!base) return null
        return modifiers.length === 0 ? (
          renderSkill(base, base.id)
        ) : (
          <div
            className={`h-fit break-inside-avoid self-start content-start rounded-md border p-1 transition-colors ${
              (character.skillLevels[base.id] ?? 0) > 0
                ? 'border-orange-300/70 outline outline-1 outline-orange-300/40'
                : 'border-neutral-800 bg-neutral-950/35'
            }`}
            key={base.groupId}
          >
            {renderSkill(base, base.id, true)}
            {(character.skillLevels[base.id] ?? 0) > 0 && (
              <div>{modifiers.map((skill) => renderSkill(skill, base.id, true))}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default SkillList
