import { useState, type Dispatch, type SetStateAction } from 'react'
import { Card } from '@/components/Card'
import type { Character } from '@/domain/hero/types'
import type { EquippedSetInfo, Item } from '@/domain/item/types'
import ItemPanel from '@/domain/item/components/ItemPanel'
import type { ItemLibraryState } from '@/domain/item/item.hooks'

type EquipmentPanelProps = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  equippedSetInfo?: EquippedSetInfo[]
  activeSkillNames?: Set<string>
  itemLibrary: ItemLibraryState
  onEquip: (item: Item, slot?: string) => void
  onUnequip: (item: Item) => void
  isEquipped: (item: Item) => boolean
}

function EquipmentPanel({
  character,
  setCharacter,
  equippedSetInfo = [],
  activeSkillNames,
  itemLibrary,
  onEquip,
  onUnequip,
  isEquipped,
}: EquipmentPanelProps) {
  const [selectedSlot, setSelectedSlot] = useState('Weapon')
  const slotGroups = [
    { name: 'Weapon', slots: ['Weapon', 'Off-Hand'] },
    { name: 'Armor', slots: ['Chest Armor', 'Gloves', 'Pants', 'Boots', 'Helm', 'Shoulders'] },
    { name: 'Accessories', slots: ['Belt', 'Amulet', 'Ring 1', 'Ring 2', 'Medal', 'Relic'] },
  ]
  const renderSlot = (slot: string) => {
    const item = character.equipment[slot]
    const blocked = slot === 'Off-Hand' && character.equipment.Weapon?.twoHanded
    return (
      <div className="flex gap-1" key={slot}>
        <button
          className={`min-w-0 flex-1 rounded-md border px-3 py-2 text-left ${selectedSlot === slot ? 'border-orange-300/70 bg-orange-300/10' : 'border-neutral-700 bg-neutral-950/45'} ${blocked ? 'opacity-60' : ''}`}
          type="button"
          onClick={() => setSelectedSlot(slot)}
        >
          <span className="block text-xs font-medium text-neutral-200">{slot}</span>
          <span className="mt-0.5 block truncate text-[0.68rem] text-neutral-500">
            {blocked ? 'Blocked' : item?.name ?? 'Empty'}
          </span>
        </button>
        {item && !blocked && (
          <button
            className="flex size-9 shrink-0 items-center justify-center self-stretch rounded-md border border-neutral-800 text-neutral-600 transition-colors hover:border-neutral-600 hover:text-neutral-200"
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
    )
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
      <Card as="section" size="lg" variant="filled">
        <div className="mb-5">
        <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Equipment</p>
        <h2 className="text-xl font-medium text-neutral-50">Equipped loadout</h2>
        </div>
        <div className="mt-6 grid gap-5">
          {slotGroups.map(({ name, slots }) => (
            <section key={name}>
              <h3 className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-neutral-500">{name}</h3>
              <div className="grid gap-2">{slots.map(renderSlot)}</div>
            </section>
          ))}
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
      <ItemPanel
        itemLibrary={itemLibrary}
        categoryOverride={selectedSlot === 'Ring 1' || selectedSlot === 'Ring 2' ? 'Ring' : selectedSlot}
        onEquip={(item) => onEquip(item, selectedSlot)}
        onUnequip={onUnequip}
        isEquipped={isEquipped}
        equippedSetInfo={equippedSetInfo}
        activeSkillNames={activeSkillNames}
        embedded
        allowTemplateEquip
      />
    </div>
  )
}

export default EquipmentPanel
