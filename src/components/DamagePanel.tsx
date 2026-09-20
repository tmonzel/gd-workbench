import CollapsiblePanel from '@/components/CollapsiblePanel'
import type { Character } from '@/domain/hero/types'
import type { EquippedSetInfo } from '@/domain/item/types'
import { DAMAGE_COLORS, DAMAGE_TYPES } from '@/domain/skill/skill.utils'

type Devotion = { skills: Array<{ id: string; attributes: Array<{ label: string; value: string }> }> }

type DamagePanelProps = {
  character: Character
  devotions?: { constellations: Devotion[] } | null
  selectedDevotions?: string[]
  equippedSetInfo?: EquippedSetInfo[]
}

// values are either a flat number, a "min-max" range, or a "+X%" modifier
const parseDamageValue = (raw: string) => {
  const text = raw.trim()
  const percentMatch = /^([+-]?\d+(\.\d+)?)%$/.exec(text)
  if (percentMatch) return { min: 0, max: 0, percent: Number(percentMatch[1]) }
  const rangeMatch = /^([+-]?\d+(\.\d+)?)-(\d+(\.\d+)?)$/.exec(text)
  if (rangeMatch) return { min: Number(rangeMatch[1]), max: Number(rangeMatch[3]), percent: 0 }
  const flatMatch = /^([+-]?\d+(\.\d+)?)$/.exec(text)
  if (flatMatch) {
    const value = Number(flatMatch[1])
    return { min: value, max: value, percent: 0 }
  }
  return { min: 0, max: 0, percent: 0 }
}
const formatRange = (min: number, max: number) => {
  const roundedMin = Math.round(min * 10) / 10
  const roundedMax = Math.round(max * 10) / 10
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

function DamagePanel({ character, devotions, selectedDevotions = [], equippedSetInfo = [] }: DamagePanelProps) {
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
      const totalMin = min * (1 + percent / 100)
      const totalMax = max * (1 + percent / 100)
      return { type, displayType, min, max, percent, totalMin, totalMax, average: (totalMin + totalMax) / 2 }
    }).filter(
      (stat): stat is NonNullable<typeof stat> =>
        stat !== null && (stat.min !== 0 || stat.max !== 0 || stat.percent !== 0),
    )
  const damageStats = calculateDamage('')
  const damageOverTimeStats = calculateDamage('', true)
  const retaliationStats = calculateDamage(' Retaliation')
  const totalDamage = damageStats.reduce((sum, stat) => sum + stat.average, 0)
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
              {stat.percent ? `+${Math.round(stat.percent * 10) / 10}%` : '—'}
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
            </div>
          )}
          {damageOverTimeStats.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-[0.12em] text-neutral-400">Attack Damage Over Time</h3>
              {renderDamageTable(damageOverTimeStats)}
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
      {totalDamage > 0 && (
        <div className="mt-4">
          <p className="m-0 mb-1.5 text-[0.68rem] text-neutral-500">Damage distribution</p>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-900">
            {damageStats
              .filter((stat) => stat.average > 0)
              .map((stat) => (
                <div
                  key={stat.type}
                  className="h-full"
                  style={{ width: `${(stat.average / totalDamage) * 100}%`, backgroundColor: DAMAGE_COLORS[stat.type] }}
                  title={`${stat.type}: ${formatRange(stat.totalMin, stat.totalMax)} (${Math.round((stat.average / totalDamage) * 100)}%)`}
                />
              ))}
          </div>
        </div>
      )}
    </CollapsiblePanel>
  )
}

export default DamagePanel
