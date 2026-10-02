import { IconSword } from '@tabler/icons-react'
import type { Character } from '@/domain/hero/types'
import type { MasterySkill } from '@/domain/mastery/mastery.types'
import { formatSkillEffectParts, formatSkillValue } from '@/domain/mastery/mastery.utils'

type MasterySkillItemProps = {
  skill: MasterySkill
  character: Character
  masteryLevel: number
  baseSkillId: string
  grouped?: boolean
  modifiers?: MasterySkill[]
  onChangeLevel: (skill: MasterySkill, delta: number, baseSkillId: string) => void
}

function MasterySkillItem({
  skill,
  character,
  masteryLevel,
  baseSkillId,
  grouped = false,
  modifiers = [],
  onChangeLevel,
}: MasterySkillItemProps) {
  const level = character.skillLevels[skill.id] ?? 0
  const locked =
    (skill.isModifier && (character.skillLevels[baseSkillId] ?? 0) < 1) || masteryLevel < skill.masteryLevelRequired
  const allocated = level > 0
  const hasModifiers = modifiers.length > 0
  const isGrouped = grouped || hasModifiers
  const allocatedStyle = isGrouped
    ? ''
    : allocated
      ? 'border-orange-300/70 outline outline-1 outline-orange-300/40'
      : 'border-neutral-800 bg-neutral-900/70'
  const effectiveLevel = level
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
            const slowDuration = effect.durationValues?.[Math.min(effectiveLevel, effect.durationValues.length) - 1]
            const displayParts =
              effect.key === 'offensiveSlowAttackSpeedMin'
                ? {
                    value: `${formatSkillValue(value)}% Slower Enemy Attack${slowDuration ? ` for ${formatSkillValue(slowDuration)} ${slowDuration === 1 ? 'Second' : 'Seconds'}` : ''}`,
                    label: '',
                  }
                : effect.key === 'offensiveDamageMultModifier'
                  ? { value: `Total Damage Modified by ${formatSkillValue(value)}${effect.suffix ?? ''}`, label: '' }
                  : formatSkillEffectParts({ ...effect, value }, effectiveLevel)
            if (
              (effect.key.startsWith('character') ||
                effect.key === 'offensiveTotalDamageModifier' ||
                effect.key === 'offensiveElementalModifier' ||
                effect.key === 'offensivePierceModifier') &&
              value > 0
            )
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
    <div
      className={`h-fit break-inside-avoid ${hasModifiers ? `self-start content-start rounded-md border p-1 transition-colors ${allocated ? 'border-orange-300/70 outline outline-1 outline-orange-300/40' : 'border-neutral-800 bg-neutral-950/35'}` : ''}`}
    >
      <button
        className={`grid h-fit w-full self-start content-start grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-1 p-3 text-left transition-colors ${skill.isModifier ? 'ml-0 border-t border-neutral-800 pt-3' : ''} ${isGrouped ? 'rounded-none border-0' : 'rounded-md border'} ${allocatedStyle} ${locked ? 'cursor-not-allowed opacity-45' : isGrouped ? 'hover:bg-neutral-800/70' : allocated ? 'hover:border-orange-300' : 'hover:border-neutral-500 hover:bg-neutral-800/70'} ${locked && !isGrouped ? 'border-neutral-900 bg-neutral-950/40' : ''}`}
        type="button"
        disabled={locked}
        onClick={() => onChangeLevel(skill, 1, baseSkillId)}
        onContextMenu={(event) => {
          event.preventDefault()
          onChangeLevel(skill, -1, baseSkillId)
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
          <span className="col-start-2 mt-1 grid min-w-0 gap-0.5 border-t border-neutral-800 pt-1 text-xs text-neutral-500">
            {rankEffects.slice(0, 6).map((effect) => (
              <span className="text-neutral-500" key={effect.key}>
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
      {hasModifiers && allocated && (
        <div>
          {modifiers.map((modifier) => (
            <MasterySkillItem
              key={modifier.id}
              skill={modifier}
              character={character}
              masteryLevel={masteryLevel}
              baseSkillId={skill.id}
              grouped
              onChangeLevel={onChangeLevel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MasterySkillItem
