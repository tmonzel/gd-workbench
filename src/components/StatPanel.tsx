import CollapsiblePanel from './CollapsiblePanel'
import type { Character } from '../types'
import type { EquippedSetInfo } from '../itemSets'

type Devotion = { skills: Array<{ id: string; attributes: Array<{ label: string; value: string }> }> }

type StatPanelProps = {
  character: Character
  devotions?: { constellations: Devotion[] } | null
  selectedDevotions?: string[]
  equippedSetInfo?: EquippedSetInfo[]
}

function StatPanel({ character, devotions, selectedDevotions = [], equippedSetInfo = [] }: StatPanelProps) {
  const totals = Object.values(character.equipment).reduce<Record<string, number>>((result, item) => {
    for (const attribute of item?.attributes ?? []) {
      const value = Number(String(attribute.value).replace(/[^0-9.-]/g, ''))
      if (Number.isFinite(value)) result[attribute.label] = (result[attribute.label] ?? 0) + value
    }
    return result
  }, {})
  for (const constellation of devotions?.constellations ?? [])
    for (const skill of constellation.skills) {
      if (!selectedDevotions.includes(skill.id)) continue
      for (const attribute of skill.attributes) {
        const value = Number(String(attribute.value).replace(/[^0-9.-]/g, ''))
        if (Number.isFinite(value)) totals[attribute.label] = (totals[attribute.label] ?? 0) + value
      }
    }
  for (const { activeTier } of equippedSetInfo)
    for (const attribute of activeTier?.attributes ?? []) {
      const value = Number(String(attribute.value).replace(/[^0-9.-]/g, ''))
      if (Number.isFinite(value)) totals[attribute.label] = (totals[attribute.label] ?? 0) + value
    }
  // core attributes secretly feed Health/Energy/OA/DA, per point: https://grimdawn.fandom.com/wiki/Attributes
  const physique = character.physique + (totals.Physique ?? 0)
  const cunning = character.cunning + (totals.Cunning ?? 0)
  const spirit = character.spirit + (totals.Spirit ?? 0)
  totals.Health = (totals.Health ?? 0) + physique * 2.5 + cunning + spirit
  totals.Energy = (totals.Energy ?? 0) + spirit * 2
  // matches offensiveAbilityEquation/defensiveAbilityEquation in data/game/records/game/combatformulas.dbr
  totals['Offensive Ability'] = (totals['Offensive Ability'] ?? 0) + character.level * 12 + cunning * 0.5 + 53
  totals['Defensive Ability'] = (totals['Defensive Ability'] ?? 0) + character.level * 12 + physique * 0.5 + 53

  return (
    <CollapsiblePanel eyebrow="General" title="Stats">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {[
            ['Health', totals.Health ?? 0],
            [
              'Health Regeneration',
              (totals['Health Regeneration'] ?? 0) + (totals['Health Regenerated per second'] ?? 0),
            ],
            ['Energy', totals.Energy ?? 0],
            [
              'Energy Regeneration',
              (totals['Energy Regeneration'] ?? 0) + (totals['Energy Regenerated per second'] ?? 0),
            ],
            ['Offensive Ability', totals['Offensive Ability'] ?? 0],
            ['Defensive Ability', totals['Defensive Ability'] ?? 0],
            ['Armor', totals.Armor ?? 0],
            ['Damage Conversion', Object.keys(character.equipment).length],
          ].map(([label, value]) => (
            <tr className="border-b border-neutral-800 last:border-b-0" key={label as string}>
              <td className="py-1.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-neutral-500">{label}</span>
                  <strong className="tabular-nums text-neutral-100">{Math.round((value as number) * 10) / 10}</strong>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CollapsiblePanel>
  )
}

export default StatPanel
