import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { IconPencil } from '@tabler/icons-react'
import { Card } from '@/components/Card'
import type { Character } from '@/domain/hero/types'
import type { EquippedSetInfo, Item } from '@/domain/item/types'
import ItemCard from '@/domain/item/components/ItemCard'
import ItemCraftModal from '@/domain/item/components/ItemCraftModal'
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
  onUpdateInstance?: (item: Item) => void
}

const SLOT_LABELS: Record<string, string> = {
  Weapon: 'Main-Hand',
  'Off-Hand': 'Off-Hand',
  'Chest Armor': 'Chest',
  Gloves: 'Arms',
  Pants: 'Legs',
  Boots: 'Feet',
  Helm: 'Head',
  Shoulders: 'Shoulders',
}

const MAIN_HAND_TYPES = [
  ['Main-Hand', 'All weapons'],
  ['Main-Hand-Swords', 'Swords'],
  ['Main-Hand-Axes', 'Axes'],
  ['Main-Hand-Maces', 'Maces'],
  ['Main-Hand-Daggers', 'Daggers'],
  ['Main-Hand-Scepters', 'Scepters'],
  ['Main-Hand-Spears', 'Spears'],
  ['Main-Hand-Ranged', 'Ranged'],
] as const

const OFF_HAND_TYPES = [
  ['Off-Hand-Picker-All', 'All'],
  ['Off-Hand-Picker-Shields', 'Shields'],
  ['Off-Hand-Picker-Off-Hands', 'Off-Hands'],
  ['Off-Hand-Picker-One-Handed-Weapons', 'One-Handed Weapons'],
] as const

const ARMOR_TYPES: Record<string, Array<readonly [string, string]>> = {
  'Chest Armor': [
    ['All', 'All'],
    ['Normal', 'Normal'],
    ['Heavy', 'Heavy'],
    ['Caster', 'Caster'],
  ],
  Pants: [
    ['All', 'All'],
    ['Normal', 'Normal'],
    ['Heavy', 'Heavy'],
  ],
  Gloves: [
    ['All', 'All'],
    ['Normal', 'Normal'],
    ['Heavy', 'Heavy'],
  ],
  Helm: [
    ['All', 'All'],
    ['Normal', 'Normal'],
    ['Heavy', 'Heavy'],
    ['Caster', 'Caster'],
  ],
}

const ARMOR_PICKER_SLOTS: Record<string, string> = {
  'Chest Armor': 'ChestArmor',
  Pants: 'Pants',
  Gloves: 'Gloves',
  Helm: 'Helm',
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
  onUpdateInstance,
}: EquipmentPanelProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Item | undefined>()
  const [mainHandType, setMainHandType] = useState('Main-Hand')
  const [offHandType, setOffHandType] = useState('Off-Hand-Picker-All')
  const [armorType, setArmorType] = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!selectedSlot) return
    setDrawerOpen(false)
    const frame = requestAnimationFrame(() => setDrawerOpen(true))
    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
    }
  }, [selectedSlot])
  const closeDrawer = () => {
    if (closeTimer.current !== undefined) window.clearTimeout(closeTimer.current)
    setDrawerOpen(false)
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = undefined
      setSelectedSlot(null)
    }, 300)
  }
  const slotGroups = [
    { name: 'Weapon', slots: ['Weapon', 'Off-Hand'] },
    { name: 'Armor', slots: ['Chest Armor', 'Gloves', 'Pants', 'Boots', 'Helm', 'Shoulders'] },
    { name: 'Accessories', slots: ['Belt', 'Amulet', 'Ring 1', 'Ring 2', 'Medal', 'Relic'] },
  ]
  const renderSlot = (slot: string) => {
    const item = character.equipment[slot]
    const blocked = slot === 'Off-Hand' && character.equipment.Weapon?.twoHanded
    const disabled = Boolean(character.disabledEquipmentSlots?.[slot])
    const slotLabel = SLOT_LABELS[slot] ?? slot
    return (
      <div
        className={`min-w-0 max-w-full overflow-hidden rounded-md border border-neutral-700 bg-neutral-950/45 ${blocked || disabled ? 'opacity-60' : ''}`}
        key={slot}
      >
        <div className="flex items-center border-b border-neutral-800">
          <button
            className="min-w-0 flex-1 px-3 py-2 text-left text-xs font-medium text-neutral-200 transition-colors hover:text-orange-200 disabled:cursor-not-allowed"
            type="button"
            disabled={blocked}
            onClick={() => setSelectedSlot(slot)}
          >
            {slotLabel}
          </button>
          {item && (
            <>
              <label className="flex h-8 shrink-0 items-center gap-1 border-l border-neutral-800 px-2 text-[0.62rem] text-neutral-500">
                <input
                  className="app-checkbox"
                  type="checkbox"
                  checked={disabled}
                  onChange={() =>
                    setCharacter((current) => ({
                      ...current,
                      disabledEquipmentSlots: {
                        ...(current.disabledEquipmentSlots ?? {}),
                        [slot]: !current.disabledEquipmentSlots?.[slot],
                      },
                    }))
                  }
                  aria-label={`Deactivate ${slotLabel}`}
                  title={`Deactivate ${slotLabel}`}
                />
                Off
              </label>
              {!blocked && onUpdateInstance && (
                <button
                  className="flex size-8 shrink-0 items-center justify-center border-l border-neutral-800 text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
                  type="button"
                  aria-label={`Edit ${slotLabel}`}
                  title={`Edit ${slotLabel}`}
                  onClick={() => setEditingItem(item)}
                >
                  <IconPencil size={15} stroke={1.8} aria-hidden="true" />
                </button>
              )}
              {!blocked && (
                <button
                  className="flex size-8 shrink-0 items-center justify-center border-l border-neutral-800 text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
                  type="button"
                  aria-label={`Remove ${slotLabel}`}
                  title={`Remove ${slotLabel}`}
                  onClick={() =>
                    setCharacter((current) => {
                      const disabledEquipmentSlots = { ...(current.disabledEquipmentSlots ?? {}) }
                      delete disabledEquipmentSlots[slot]
                      return {
                        ...current,
                        equipment: { ...current.equipment, [slot]: undefined },
                        disabledEquipmentSlots,
                      }
                    })
                  }
                >
                  ×
                </button>
              )}
            </>
          )}
        </div>
        {blocked ? (
          <p className="m-0 px-3 py-2 text-xs text-neutral-600">Blocked by two-handed weapon</p>
        ) : item ? (
          <div className={`min-w-0 p-2 ${disabled ? 'pointer-events-none' : ''}`}>
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
            Empty · Select {slotLabel.toLowerCase()} item
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
        disabledEquipmentSlots: Object.fromEntries(
          Object.entries(current.disabledEquipmentSlots ?? {}).filter(([slot]) => slot !== selectedSlot),
        ),
      }))
      closeDrawer()
      return
    }
    onUnequip(item)
    closeDrawer()
  }
  const equipSelectedItem = (item: Item) => {
    if (!selectedSlot) return
    onEquip(item, selectedSlot)
    closeDrawer()
  }
  const pickerCategory =
    selectedSlot === 'Ring 1' || selectedSlot === 'Ring 2'
      ? 'Ring'
      : selectedSlot === 'Weapon'
        ? mainHandType
        : selectedSlot === 'Off-Hand'
          ? offHandType
          : ARMOR_PICKER_SLOTS[selectedSlot ?? '']
            ? `Armor-Picker-${ARMOR_PICKER_SLOTS[selectedSlot ?? '']}-${armorType}`
            : selectedSlot

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
              <div className="grid grid-cols-2 gap-2">{slots.map(renderSlot)}</div>
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
        <div className="fixed inset-0 z-50" role="presentation">
          <div
            className={`absolute inset-0 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${drawerOpen ? 'bg-black/75 opacity-100' : 'pointer-events-none bg-black/0 opacity-0'}`}
            aria-hidden="true"
            onClick={closeDrawer}
          />
          <section
            className={`relative ml-auto flex h-full w-full max-w-5xl flex-col overflow-hidden border-l border-neutral-700 bg-neutral-950 shadow-2xl shadow-black/60 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="equipment-item-picker-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-800 px-4 py-3 sm:px-5">
              <div>
                <p className="m-0 text-[0.65rem] uppercase tracking-[0.14em] text-orange-300">Equipment</p>
                <h2 id="equipment-item-picker-title" className="m-0 text-base font-medium text-neutral-100">
                  Select item for {SLOT_LABELS[selectedSlot] ?? selectedSlot}
                </h2>
                {selectedSlot === 'Weapon' ? (
                  <label className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                    <span>Weapon type</span>
                    <select
                      className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none focus:border-orange-300"
                      value={mainHandType}
                      onChange={(event) => setMainHandType(event.target.value)}
                    >
                      {MAIN_HAND_TYPES.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : selectedSlot === 'Off-Hand' ? (
                  <label className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                    <span>Off-Hand type</span>
                    <select
                      className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none focus:border-orange-300"
                      value={offHandType}
                      onChange={(event) => setOffHandType(event.target.value)}
                    >
                      {OFF_HAND_TYPES.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : ARMOR_TYPES[selectedSlot] ? (
                  <label className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                    <span>Armor type</span>
                    <select
                      className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none focus:border-orange-300"
                      value={armorType}
                      onChange={(event) => setArmorType(event.target.value)}
                    >
                      {ARMOR_TYPES[selectedSlot].map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <button
                className="flex size-8 shrink-0 items-center justify-center rounded text-lg text-neutral-500 hover:bg-neutral-800 hover:text-neutral-100"
                type="button"
                aria-label="Close item picker"
                onClick={closeDrawer}
              >
                ×
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
              <ItemPanel
                itemLibrary={itemLibrary}
                categoryOverride={pickerCategory ?? undefined}
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
      {editingItem && onUpdateInstance && (
        <ItemCraftModal
          item={editingItem}
          itemSets={itemLibrary.itemSets}
          equippedSetInfo={equippedSetInfo}
          activeSkillNames={activeSkillNames}
          onSave={(item) => {
            onUpdateInstance(item)
            setEditingItem(undefined)
          }}
          onClose={() => setEditingItem(undefined)}
        />
      )}
    </>
  )
}

export default EquipmentPanel
