import CollapsiblePanel from '@/components/CollapsiblePanel'
import { useState } from 'react'
import type { Character } from '@/domain/hero/types'
import { BASE_ATTRIBUTE_VALUE, BASE_ENERGY_VALUE, BASE_HEALTH_VALUE } from '@/domain/hero/hero.utils'
import type { Mastery } from '@/domain/skill/types'
import type { EquippedSetInfo } from '@/domain/item/types'

type Devotion = { skills: Array<{ id: string; attributes: Array<{ label: string; value: string }> }> }
type StatTab = 'attributes' | 'combat' | 'resources'

type StatPanelProps = {
  character: Character
  devotions?: { constellations: Devotion[] } | null
  selectedDevotions?: string[]
  equippedSetInfo?: EquippedSetInfo[]
  masteries?: Mastery[]
}

function StatPanel({
  character,
  devotions,
  selectedDevotions = [],
  equippedSetInfo = [],
  masteries = [],
}: StatPanelProps) {
  const [activeTab, setActiveTab] = useState<StatTab>('attributes')
  const totals: Record<string, number> = {}
  const attributeModifiers: Record<string, number> = { Physique: 0, Cunning: 0, Spirit: 0 }
  const addAttribute = (label: string, rawValue: string | number) => {
    const value = Number(String(rawValue).replace(/[^0-9.-]/g, ''))
    if (!Number.isFinite(value)) return
    if (label in attributeModifiers && String(rawValue).trim().endsWith('%')) {
      attributeModifiers[label] += value
      return
    }
    totals[label] = (totals[label] ?? 0) + value
  }
  for (const item of Object.values(character.equipment))
    for (const attribute of item?.attributes ?? []) addAttribute(attribute.label, attribute.value)
  for (const constellation of devotions?.constellations ?? [])
    for (const skill of constellation.skills) {
      if (!selectedDevotions.includes(skill.id)) continue
      for (const attribute of skill.attributes) {
        addAttribute(attribute.label, attribute.value)
      }
    }
  for (const { activeTier } of equippedSetInfo)
    for (const attribute of activeTier?.attributes ?? []) {
      addAttribute(attribute.label, attribute.value)
    }
  for (const masteryId of [character.mastery1, character.mastery2]) {
    const rank = character.masteryLevels[masteryId ?? ''] ?? 0
    const progression = masteries.find((mastery) => mastery.id === masteryId)?.progression
    if (!progression || rank < 1) continue
    for (const [label, values] of Object.entries(progression))
      totals[label] = (totals[label] ?? 0) + (values[Math.min(rank, values.length) - 1] ?? 0)
  }
  // Core attributes feed Health, Energy, OA, and DA.
  const physique = (character.physique + (totals.Physique ?? 0)) * (1 + attributeModifiers.Physique / 100)
  const cunning = (character.cunning + (totals.Cunning ?? 0)) * (1 + attributeModifiers.Cunning / 100)
  const spirit = (character.spirit + (totals.Spirit ?? 0)) * (1 + attributeModifiers.Spirit / 100)
  totals.Health =
    BASE_HEALTH_VALUE +
    (totals.Health ?? 0) +
    (physique - BASE_ATTRIBUTE_VALUE) * 2.5 +
    (cunning - BASE_ATTRIBUTE_VALUE) +
    (spirit - BASE_ATTRIBUTE_VALUE)
  totals.Energy = BASE_ENERGY_VALUE + (totals.Energy ?? 0) + (spirit - BASE_ATTRIBUTE_VALUE) * 2
  // matches offensiveAbilityEquation/defensiveAbilityEquation in data/game/records/game/combatformulas.dbr
  totals['Offensive Ability'] = (totals['Offensive Ability'] ?? 0) + character.level * 12 + cunning * 0.5 + 53
  totals['Defensive Ability'] = (totals['Defensive Ability'] ?? 0) + character.level * 12 + physique * 0.5 + 53
  const attackSpeed = 100 + (totals['Attack Speed'] ?? 0)
  const attackSpeedMaximum = 200 + (totals['Maximum Attack Speed'] ?? 0)
  const runSpeed = 100 + (totals['Movement Speed'] ?? 0) + (totals['Run Speed'] ?? 0)
  const runSpeedMaximum = 135 + (totals['Maximum Movement Speed'] ?? 0) + (totals['Maximum Run Speed'] ?? 0)
  const attributeRows = [
    {
      label: 'Physique',
      base: character.physique + (totals.Physique ?? 0),
      modifier: attributeModifiers.Physique,
      total: physique,
    },
    {
      label: 'Cunning',
      base: character.cunning + (totals.Cunning ?? 0),
      modifier: attributeModifiers.Cunning,
      total: cunning,
    },
    {
      label: 'Spirit',
      base: character.spirit + (totals.Spirit ?? 0),
      modifier: attributeModifiers.Spirit,
      total: spirit,
    },
  ]
  const rows: Array<{ label: string; value: string | number; modifier?: number; maximum?: number }> = [
    { label: 'Health', value: totals.Health ?? 0 },
    {
      label: 'Health Regeneration',
      value: (totals['Health Regeneration'] ?? 0) + (totals['Health Regenerated per second'] ?? 0),
    },
    { label: 'Energy', value: totals.Energy ?? 0 },
    {
      label: 'Energy Regeneration',
      value: (totals['Energy Regeneration'] ?? 0) + (totals['Energy Regenerated per second'] ?? 0),
    },
    { label: 'Attack Speed', value: attackSpeed, maximum: attackSpeedMaximum },
    { label: 'Run Speed', value: runSpeed, maximum: runSpeedMaximum },
    { label: 'Offensive Ability', value: totals['Offensive Ability'] ?? 0 },
    { label: 'Defensive Ability', value: totals['Defensive Ability'] ?? 0 },
    { label: 'Armor', value: totals.Armor ?? 0 },
    { label: 'Damage Conversion', value: Object.keys(character.equipment).length },
  ]
  const rowsByTab: Record<StatTab, typeof rows> = {
    attributes: [],
    combat: rows.slice(4),
    resources: rows.slice(0, 4),
  }
  const tabs: Array<{ value: StatTab; label: string }> = [
    { value: 'attributes', label: 'Attributes' },
    { value: 'combat', label: 'Combat' },
    { value: 'resources', label: 'Resources' },
  ]

  return (
    <CollapsiblePanel eyebrow="Character" title="Stats">
      <nav className="mb-3 flex w-full gap-1 border-b border-neutral-800" aria-label="Character stat categories">
        {tabs.map((tab) => {
          const selected = activeTab === tab.value
          return (
            <button
              className={`flex-1 border-b-2 px-2.5 pb-2 text-xs font-medium transition-colors ${
                selected
                  ? 'border-orange-300 text-orange-200'
                  : 'border-transparent text-neutral-500 hover:text-neutral-200'
              }`}
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>
      {activeTab === 'attributes' ? (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-[0.62rem] uppercase tracking-[0.08em] text-neutral-600">
              <th className="pb-1.5 text-left font-normal">Attribute</th>
              <th className="pb-1.5 text-right font-normal">Base</th>
              <th className="pb-1.5 pl-2 text-right font-normal">Modifier</th>
              <th className="pb-1.5 pl-2 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {attributeRows.map(({ label, base, modifier, total }) => (
              <tr className="border-b border-neutral-800 last:border-b-0" key={label}>
                <td className="py-1.5 text-neutral-300">{label}</td>
                <td className="py-1.5 text-right tabular-nums text-neutral-400">{Math.round(base * 10) / 10}</td>
                <td className="py-1.5 pl-2 text-right tabular-nums text-neutral-500">
                  {modifier ? `${modifier > 0 ? '+' : ''}${Math.round(modifier * 10) / 10}%` : '—'}
                </td>
                <td className="py-1.5 pl-2 text-right tabular-nums text-neutral-100">
                  <strong>{Math.round(total * 10) / 10}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="w-full border-collapse text-sm">
          <tbody>
            {rowsByTab[activeTab].map(({ label, value, modifier, maximum }) => (
            <tr className="border-b border-neutral-800 last:border-b-0" key={label}>
              <td className="py-1.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-neutral-500">{label}</span>
                  <strong className="tabular-nums text-neutral-100">
                    {modifier ? (
                      <span className="mr-2 font-normal text-neutral-500">
                        {modifier > 0 ? '+' : ''}
                        {Math.round(modifier * 10) / 10}%
                      </span>
                    ) : null}
                    {typeof value === 'string' ? value : `${Math.round(value * 10) / 10}${maximum !== undefined ? '%' : ''}`}
                    {maximum !== undefined && (
                      <span className="font-normal text-neutral-600"> / {Math.round(maximum * 10) / 10}%</span>
                    )}
                  </strong>
                </span>
              </td>
            </tr>
            ))}
          </tbody>
        </table>
      )}
    </CollapsiblePanel>
  )
}

export default StatPanel
