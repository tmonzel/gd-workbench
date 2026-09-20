import CollapsiblePanel from '@/components/CollapsiblePanel'
import type { Character } from '@/domain/hero/types'
import type { EquippedSetInfo } from '@/domain/item/types'
import { DAMAGE_COLORS, DAMAGE_TYPES } from '@/domain/skill/skill.utils'
import {
  getAttributeDamageMultiplier,
  getCharacterAttributeTotals,
  parseDamageValue,
  applyArmorPiercingConversion,
  getWeaponArmorPiercingPercent,
} from '@/domain/skill/damage.utils'
import type { MasteryProgression } from '@/domain/skill/damage.utils'

type Devotion = { skills: Array<{ id: string; attributes: Array<{ label: string; value: string }> }> }

type DamagePanelProps = {
  character: Character
  devotions?: { constellations: Devotion[] } | null
  selectedDevotions?: string[]
  equippedSetInfo?: EquippedSetInfo[]
  masteries?: MasteryProgression[]
}

const formatRange = (min: number, max: number) => {
  const roundedMin = Math.round(min * 10) / 10
  const roundedMax = Math.round(max * 10) / 10
  if (roundedMin === 0) return `${roundedMax}`
  if (roundedMax === 0) return `${roundedMin}`
  return roundedMin === roundedMax ? `${roundedMin}` : `${roundedMin}-${roundedMax}`
}

const DAMAGE_OVER_TIME_LABELS: Record<string, string> = {
  Physical: 'Internal Trauma',
  Fire: 'Burn',
  Cold: 'Frostburn',
  Lightning: 'Electrocute',
  Poison: 'Acid',
  Bleeding: 'Bleeding',
}

function DamagePanel({
  character,
  devotions,
  selectedDevotions = [],
  equippedSetInfo = [],
  masteries = [],
}: DamagePanelProps) {
  const { cunning, spirit } = getCharacterAttributeTotals(character, masteries)

  const sourceAttributes: Array<{ label: string; value: string }> = []
  for (const item of Object.values(character.equipment))
    for (const attribute of item?.attributes ?? [])
      sourceAttributes.push({ label: attribute.label, value: String(attribute.value) })
  for (const constellation of devotions?.constellations ?? [])
    for (const skill of constellation.skills) {
      if (!selectedDevotions.includes(skill.id)) continue
      for (const attribute of skill.attributes) sourceAttributes.push(attribute)
    }
  for (const { activeTier } of equippedSetInfo)
    for (const attribute of activeTier?.attributes ?? []) sourceAttributes.push(attribute)

  // keep the flat base range and the % modifiers separate, then apply the modifiers on top of the base
  const calculateDamage = (labelSuffix: string, damageOverTime = false) =>
    DAMAGE_TYPES.map((type) => {
      const displayType = damageOverTime
        ? DAMAGE_OVER_TIME_LABELS[type]
        : labelSuffix === ' Retaliation' && type === 'Poison'
          ? 'Acid'
          : type
      if (!displayType) return null
      const label = `${displayType}${labelSuffix} Damage`
      let min = 0
      let max = 0
      let percent = 0
      for (const attribute of sourceAttributes) {
        const acidRetaliation =
          labelSuffix === ' Retaliation' && type === 'Poison' && attribute.label === 'Acid Retaliation Damage'
        if (
          attribute.label !== label &&
          !(labelSuffix === ' Retaliation' && attribute.label === 'Retaliation Damage') &&
          !acidRetaliation
        )
          continue
        const parsed = parseDamageValue(attribute.value)
        min += parsed.min
        max += parsed.max
        percent += parsed.percent
      }
      // Apply attribute multipliers (only for regular damage, not retaliation)
      const attributeMultiplier =
        labelSuffix === '' ? getAttributeDamageMultiplier(type, damageOverTime, cunning, spirit) : 0
      const totalPercent = percent + attributeMultiplier * 100
      const totalMin = min * (1 + totalPercent / 100)
      const totalMax = max * (1 + totalPercent / 100)
      return {
        type,
        displayType,
        min,
        max,
        percent,
        attributeBonus: attributeMultiplier * 100,
        totalPercent,
        totalMin,
        totalMax,
        average: (totalMin + totalMax) / 2,
      }
    }).filter(
      // hide rows that don't resolve to a concrete total (e.g. an attribute bonus with no base damage to apply to)
      (stat): stat is NonNullable<typeof stat> => stat !== null && (stat.totalMin !== 0 || stat.totalMax !== 0),
    )
  const armorPiercingPercent = getWeaponArmorPiercingPercent(character.equipment.Weapon?.attributes)
  // Armor Piercing converts a % of ALL Physical attack damage (weapon + skill + item bonuses) to Piercing
  const damageStats = applyArmorPiercingConversion(calculateDamage(''), armorPiercingPercent).map((stat) => ({
    ...stat,
    displayType: stat.type === 'Piercing' ? 'Piercing' : stat.displayType,
    average: (stat.totalMin + stat.totalMax) / 2,
  }))
  const damageOverTimeStats = calculateDamage('', true)
  const retaliationStats = calculateDamage(' Retaliation')
  const distributionTotal = (stats: typeof damageStats) =>
    stats.reduce((sum, stat) => sum + (stat.totalMin > 0 || stat.totalMax > 0 ? Math.max(stat.average, 0) : 0), 0)
  const totalDamage = distributionTotal(damageStats)
  const totalDamageOverTime = distributionTotal(damageOverTimeStats)
  const renderDistribution = (stats: typeof damageStats, total: number, label: string) =>
    total > 0 && (
      <div className="mb-4">
        <p className="m-0 mb-1.5 text-[0.68rem] text-neutral-500">{label}</p>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-900">
          {stats
            .filter((stat) => stat.totalMin > 0 || stat.totalMax > 0)
            .map((stat) => {
              const weight = Math.max(stat.average, 0)
              return (
                <div
                  key={stat.type}
                  className="h-full"
                  style={{ width: `${(weight / total) * 100}%`, backgroundColor: DAMAGE_COLORS[stat.type] }}
                  title={`${stat.displayType}: ${formatRange(stat.totalMin, stat.totalMax)} (${Math.round((weight / total) * 100)}%)`}
                />
              )
            })}
        </div>
      </div>
    )
  const renderDamageTable = (stats: typeof damageStats) => (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="text-[0.62rem] uppercase tracking-[0.08em] text-neutral-600">
          <th className="pb-1.5 text-left font-normal">Type</th>
          <th className="pb-1.5 text-right font-normal">Base</th>
          <th className="pb-1.5 pl-2 text-right font-normal">Modifier</th>
          <th className="pb-1.5 pl-2 text-right font-normal">Total</th>
        </tr>
      </thead>
      <tbody>
        {stats.map((stat) => (
          <tr className="border-b border-neutral-800 last:border-b-0" key={stat.type}>
            <td className="py-1.5 pr-2">
              <span className="flex items-center gap-2 text-neutral-300">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: DAMAGE_COLORS[stat.type] }} />
                {stat.displayType}
              </span>
            </td>
            <td className="py-1.5 text-right tabular-nums text-neutral-400">{formatRange(stat.min, stat.max)}</td>
            <td className="py-1.5 pl-2 text-right tabular-nums text-neutral-500">
              {stat.percent || stat.attributeBonus ? (
                <span>
                  {stat.percent ? `+${Math.round(stat.percent * 10) / 10}%` : ''}
                  {stat.percent && stat.attributeBonus ? ' + ' : ''}
                  {stat.attributeBonus ? `+${Math.round(stat.attributeBonus * 10) / 10}%` : ''}
                </span>
              ) : (
                '—'
              )}
            </td>
            <td className="py-1.5 pl-2 text-right tabular-nums text-neutral-100">
              <strong>{stat.totalMin || stat.totalMax ? formatRange(stat.totalMin, stat.totalMax) : '—'}</strong>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <CollapsiblePanel eyebrow="Damage" title="Damage breakdown">
      {damageStats.length === 0 && damageOverTimeStats.length === 0 && retaliationStats.length === 0 ? (
        <p className="m-0 border-t border-neutral-800 pt-3 text-sm text-neutral-500">
          No damage bonuses or flat damage are currently available.
        </p>
      ) : (
        <div className="grid gap-4">
          {damageStats.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-400">Attack Damage</h3>
              {renderDamageTable(damageStats)}
              {renderDistribution(damageStats, totalDamage, 'Direct damage distribution')}
            </div>
          )}
          {damageOverTimeStats.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-400">Attack Damage Over Time</h3>
              {renderDamageTable(damageOverTimeStats)}
              {renderDistribution(damageOverTimeStats, totalDamageOverTime, 'Damage over time distribution')}
            </div>
          )}
          {retaliationStats.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-[0.12em] text-orange-200">Retaliation Damage</h3>
              {renderDamageTable(retaliationStats)}
            </div>
          )}
        </div>
      )}
    </CollapsiblePanel>
  )
}

export default DamagePanel
