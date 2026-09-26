import CollapsiblePanel from '@/components/CollapsiblePanel'
import type { Character } from '@/domain/hero/types'
import type { EquippedSetInfo } from '@/domain/item/types'
import { DAMAGE_COLORS, DAMAGE_TYPES, resistanceLabel } from '@/domain/skill/skill.utils'
import { DIFFICULTY_RESISTANCE_PENALTIES, type DifficultyMode } from '@/domain/hero/difficulty'

type Devotion = { skills: Array<{ id: string; attributes: Array<{ label: string; value: string }> }> }

type ResistancePanelProps = {
  character: Character
  devotions?: { constellations: Devotion[] } | null
  selectedDevotions?: string[]
  equippedSetInfo?: EquippedSetInfo[]
  difficulty: DifficultyMode
}

function ResistancePanel({
  character,
  devotions,
  selectedDevotions = [],
  equippedSetInfo = [],
  difficulty,
}: ResistancePanelProps) {
  const attributes: Array<{ label: string; value: string }> = []
  for (const item of Object.values(character.equipment))
    for (const attribute of item?.attributes ?? [])
      attributes.push({ label: attribute.label, value: String(attribute.value) })
  for (const constellation of devotions?.constellations ?? [])
    for (const skill of constellation.skills) {
      if (!selectedDevotions.includes(skill.id)) continue
      for (const attribute of skill.attributes) attributes.push(attribute)
    }
  for (const { activeTier } of equippedSetInfo)
    for (const attribute of activeTier?.attributes ?? []) attributes.push(attribute)

  const allResistance = attributes
    .filter((attribute) => attribute.label === 'All Resistances')
    .reduce((total, attribute) => total + (Number.parseFloat(attribute.value) || 0), 0)
  const elementalResistance = attributes
    .filter((attribute) => attribute.label === 'Elemental Resistance')
    .reduce((total, attribute) => total + (Number.parseFloat(attribute.value) || 0), 0)
  const elementalShare = elementalResistance / 3
  const difficultyPenalty = DIFFICULTY_RESISTANCE_PENALTIES[difficulty]
  const totals = Object.fromEntries(
    DAMAGE_TYPES.map((type) => [
      type,
      attributes
        .filter((attribute) => attribute.label === resistanceLabel(type))
        .reduce((total, attribute) => total + (Number.parseFloat(attribute.value) || 0), 0) +
        allResistance +
        (type === 'Fire' || type === 'Cold' || type === 'Lightning' ? elementalShare : 0) +
        difficultyPenalty,
    ]),
  )
  const caps = Object.fromEntries(
    DAMAGE_TYPES.map((type) => [
      type,
      80 +
        attributes
          .filter((attribute) => attribute.label === `Maximum ${type} Resistance`)
          .reduce((total, attribute) => total + (Number.parseFloat(attribute.value) || 0), 0),
    ]),
  )

  return (
    <CollapsiblePanel eyebrow="Defense" title="Resistances">
      {DAMAGE_TYPES.some((type) => (totals[type] ?? 0) !== 0) || allResistance !== 0 ? (
        <table className="w-full border-collapse text-sm">
          <tbody>
            {DAMAGE_TYPES.filter((type) => (totals[type] ?? 0) !== 0).map((type) => (
              <tr className="border-b border-neutral-800 last:border-b-0" key={type}>
                <td className="py-1.5">
                  <span className="flex items-center gap-2 text-neutral-300">
                    <span className="size-2 rounded-full" style={{ backgroundColor: DAMAGE_COLORS[type] }} />
                    {type}
                  </span>
                </td>
                <td className="py-1.5 text-right tabular-nums text-neutral-100">
                  <strong>{Math.round((totals[type] ?? 0) * 10) / 10}%</strong>
                  <span className={caps[type] > 80 ? 'text-[#5eead4]' : 'text-neutral-600'}>
                    {' '}
                    / {Math.round((caps[type] ?? 80) * 10) / 10}%{caps[type] > 80 ? '^' : ''}
                  </span>
                </td>
              </tr>
            ))}
            {allResistance !== 0 && (
              <tr className="border-b border-neutral-800">
                <td className="py-1.5 text-neutral-500">All Resistances</td>
                <td className="py-1.5 text-right tabular-nums text-neutral-100">
                  <strong>{Math.round(allResistance * 10) / 10}%</strong>
                </td>
              </tr>
            )}
            {difficultyPenalty !== 0 && (
              <tr className="border-b border-neutral-800 last:border-b-0">
                <td className="py-1.5 text-neutral-500">{difficulty} Penalty</td>
                <td className="py-1.5 text-right tabular-nums text-neutral-500">
                  {difficultyPenalty}%
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <p className="m-0 text-sm text-neutral-500">No resistances are currently active.</p>
      )}
    </CollapsiblePanel>
  )
}

export default ResistancePanel
