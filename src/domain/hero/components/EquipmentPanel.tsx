import type { Dispatch, SetStateAction } from 'react'
import { Card } from '@/components/Card'
import type { Character } from '@/domain/hero/types'
import type { EquippedSetInfo, ItemSet } from '@/domain/item/types'
import ItemCard from '@/domain/item/components/ItemCard'

type EquipmentPanelProps = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  equippedSetInfo?: EquippedSetInfo[]
  itemSets?: ItemSet[]
  activeSkillNames?: Set<string>
}

function EquipmentPanel({
  character,
  setCharacter,
  equippedSetInfo = [],
  itemSets = [],
  activeSkillNames,
}: EquipmentPanelProps) {
  const slots = [
    'Weapon',
    'Off-Hand',
    'Chest Armor',
    'Gloves',
    'Pants',
    'Boots',
    'Helm',
    'Shoulders',
    'Belt',
    'Amulet',
    'Ring 1',
    'Ring 2',
    'Medal',
  ]

  return (
    <Card as="section" size="lg" variant="filled">
      <div className="mb-5">
        <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Equipment</p>
        <h2 className="text-xl font-medium text-neutral-50">Equipped loadout</h2>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {slots.map((slot) => {
          const item = character.equipment[slot]
          const blocked = slot === 'Off-Hand' && character.equipment.Weapon?.twoHanded
          return (
            <div
              className={`rounded-md border px-3 py-2 ${blocked ? 'border-neutral-800 bg-neutral-950/60 opacity-60' : 'border-neutral-700 bg-neutral-950/45'}`}
              key={slot}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-neutral-500">{slot}</span>
                {item && !blocked && (
                  <button
                    className="flex size-5 items-center justify-center rounded text-sm leading-none text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
                    type="button"
                    aria-label={`Remove ${slot}`}
                    title={`Remove ${slot}`}
                    onClick={() =>
                      setCharacter((current) => ({
                        ...current,
                        equipment: { ...current.equipment, [slot]: undefined },
                      }))
                    }
                  >
                    ×
                  </button>
                )}
              </div>
              {blocked ? (
                <span className="block text-xs text-neutral-600">Blocked (two-handed weapon)</span>
              ) : item ? (
                <ItemCard
                  item={item}
                  compact
                  activeSkillNames={activeSkillNames}
                  itemSets={itemSets}
                  equippedSetInfo={equippedSetInfo}
                />
              ) : (
                <span className="block text-xs text-neutral-600">Empty</span>
              )}
            </div>
          )
        })}
      </div>
      {equippedSetInfo.length > 0 && (
        <div className="mt-6 grid gap-3">
          <p className="m-0 text-xs uppercase tracking-[0.16em] text-orange-300">Set bonuses</p>
          {equippedSetInfo.map(({ set, equippedCount, activeTier }) => (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3" key={set.id}>
              <p className="m-0 text-sm text-neutral-100">
                <strong>{set.name}</strong>{' '}
                <span className="text-xs text-neutral-500">
                  ({equippedCount}/{set.members.length} equipped)
                </span>
              </p>
              <div className="mt-2 grid gap-1">
                {set.bonuses.map((tier) => {
                  const active = equippedCount >= tier.count
                  return (
                    <p
                      className={`m-0 text-xs leading-snug ${active ? 'text-orange-200' : 'text-neutral-600'}`}
                      key={tier.count}
                    >
                      <span className="uppercase tracking-[0.08em]">{tier.count} pieces:</span>{' '}
                      {[
                        ...tier.attributes.map((attribute) => `${attribute.value} ${attribute.label}`),
                        tier.skill?.name,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )
                })}
              </div>
              {activeTier?.skill && (
                <p className="mt-2 text-[0.72rem] italic leading-snug text-neutral-500">
                  {activeTier.skill.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default EquipmentPanel
