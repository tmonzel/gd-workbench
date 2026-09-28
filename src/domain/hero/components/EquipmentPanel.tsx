import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Card } from '@/components/Card'
import type { Character } from '@/domain/hero/types'
import type { EquippedSetInfo, Item } from '@/domain/item/types'
import ItemCard from '@/domain/item/components/ItemCard'
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
  isEquipped: (item: Item, slot?: string) => boolean
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
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  useEffect(() => {
    if (!selectedSlot) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [selectedSlot])
  const slotGroups = [
    { name: 'Weapon', slots: ['Weapon', 'Off-Hand'] },
    { name: 'Armor', slots: ['Chest Armor', 'Gloves', 'Pants', 'Boots', 'Helm', 'Shoulders'] },
    { name: 'Accessories', slots: ['Belt', 'Amulet', 'Ring 1', 'Ring 2', 'Medal', 'Relic'] },
  ]
  const renderSlot = (slot: string) => {
    const item = character.equipment[slot]
    const blocked = slot === 'Off-Hand' && character.equipment.Weapon?.twoHanded
    return (
      <div
        className={`min-w-0 max-w-full overflow-hidden rounded-md border border-neutral-700 bg-neutral-950/45 ${blocked ? 'opacity-60' : ''}`}
        key={slot}
      >
        <div className="flex items-center border-b border-neutral-800">
          <button
            className="min-w-0 flex-1 px-3 py-2 text-left text-xs font-medium text-neutral-200 transition-colors hover:text-orange-200 disabled:cursor-not-allowed"
            type="button"
            disabled={blocked}
            onClick={() => setSelectedSlot(slot)}
          >
            {slot}
          </button>
          {item && !blocked && (
            <button
              className="flex size-8 shrink-0 items-center justify-center border-l border-neutral-800 text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
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
          <p className="m-0 px-3 py-2 text-xs text-neutral-600">Blocked by two-handed weapon</p>
        ) : item ? (
          <div className="min-w-0 p-2">
            <ItemCard
              item={item}
              activeSkillNames={activeSkillNames}
              itemSets={itemLibrary.itemSets}
              equippedSetInfo={equippedSetInfo}
            />
          </div>
        ) : (
          <button
            className="w-full px-3 py-3 text-left text-xs text-neutral-600 transition-colors hover:text-neutral-300"
            type="button"
            onClick={() => setSelectedSlot(slot)}
          >
            Empty · Select item
          </button>
        )}
      </div>
    )
  }
  const unequipSelectedItem = (item: Item) => {
    if (!selectedSlot) return
    const equippedItem = character.equipment[selectedSlot]
    if (equippedItem && (equippedItem.id === item.id || equippedItem.templateId === item.id)) {
      setCharacter((current) => ({
        ...current,
        equipment: { ...current.equipment, [selectedSlot]: undefined },
      }))
      setSelectedSlot(null)
      return
    }
    onUnequip(item)
    setSelectedSlot(null)
  }
  const equipSelectedItem = (item: Item) => {
    if (!selectedSlot) return
    onEquip(item, selectedSlot)
    setSelectedSlot(null)
  }

  return (
    <>
      <Card as="section" size="lg" variant="filled">
        <div className="mb-5">
        <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Equipment</p>
        <h2 className="text-xl font-medium text-neutral-50">Equipped loadout</h2>
        </div>
        <div className="mt-6 grid gap-5">
          {slotGroups.map(({ name, slots }) => (
            <section key={name}>
              <h3 className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-neutral-500">{name}</h3>
              <div className={`grid gap-2 ${name === 'Weapon' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {slots.map(renderSlot)}
              </div>
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
      {selectedSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3 sm:p-6"
          role="presentation"
          onClick={() => setSelectedSlot(null)}
        >
          <section
            className="my-auto flex max-h-[calc(100vh-1.5rem)] w-full max-w-[88rem] flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-950 shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-3rem)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="equipment-item-picker-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-800 px-4 py-3 sm:px-5">
              <div>
                <p className="m-0 text-[0.65rem] uppercase tracking-[0.14em] text-orange-300">Equipment</p>
                <h2 id="equipment-item-picker-title" className="m-0 text-base font-medium text-neutral-100">
                  Select item for {selectedSlot}
                </h2>
              </div>
              <button
                className="flex size-8 shrink-0 items-center justify-center rounded text-lg text-neutral-500 hover:bg-neutral-800 hover:text-neutral-100"
                type="button"
                aria-label="Close item picker"
                onClick={() => setSelectedSlot(null)}
              >
                ×
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
              <ItemPanel
                itemLibrary={itemLibrary}
                categoryOverride={
                  selectedSlot === 'Ring 1' || selectedSlot === 'Ring 2'
                    ? 'Ring'
                    : selectedSlot === 'Weapon'
                      ? 'Weapons'
                      : selectedSlot
                }
                onEquip={equipSelectedItem}
                onUnequip={unequipSelectedItem}
                isEquipped={(item) => isEquipped(item, selectedSlot ?? undefined)}
                equippedSetInfo={equippedSetInfo}
                activeSkillNames={activeSkillNames}
                embedded
                allowTemplateEquip
              />
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default EquipmentPanel
