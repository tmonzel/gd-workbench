import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import type { Character } from '@/domain/hero/types'
import type { Item } from '@/domain/item/types'
import { isItemCompatibleWithEquipmentSlot } from '@/domain/item/item.utils'

type ItemDndContextValue = {
  draggedItem?: Item
  isDragging: boolean
}

type ItemDndProviderProps = {
  children: ReactNode
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  equipAvailableItem: (item: Item, targetSlot?: string) => void
  unequipItem: (item: Item) => void
}

const ItemDndContext = createContext<ItemDndContextValue | undefined>(undefined)

export function ItemDndProvider({
  children,
  character,
  setCharacter,
  equipAvailableItem,
  unequipItem,
}: ItemDndProviderProps) {
  const [draggedItem, setDraggedItem] = useState<Item>()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const item = active.data.current?.item as Item | undefined
    const sourceId = typeof active.data.current?.dragSource === 'string' ? active.data.current.dragSource : ''
    const targetId = typeof over?.id === 'string' ? over.id : ''
    if (item && targetId.startsWith('equipment-slot-')) {
      const slot = targetId.slice('equipment-slot-'.length)
      const canEquip =
        isItemCompatibleWithEquipmentSlot(item, slot) && !(slot === 'Off-Hand' && character.equipment.Weapon?.twoHanded)
      if (canEquip && sourceId.startsWith('equipment-slot-')) {
        setCharacter((current) => {
          const equipment = { ...current.equipment }
          const disabledEquipmentSlots = { ...(current.disabledEquipmentSlots ?? {}) }
          for (const [equippedSlot, equippedItem] of Object.entries(equipment)) {
            if (equippedItem?.id === item.id) {
              delete equipment[equippedSlot]
              delete disabledEquipmentSlots[equippedSlot]
            }
          }
          equipment[slot] = item
          if (item.category === 'Weapon' && item.twoHanded) {
            delete equipment['Off-Hand']
            delete disabledEquipmentSlots['Off-Hand']
          }
          return { ...current, equipment, disabledEquipmentSlots }
        })
      } else if (canEquip) equipAvailableItem(item, slot)
      else if (sourceId.startsWith('equipment-slot-')) unequipItem(item)
    } else if (item && sourceId.startsWith('equipment-slot-')) {
      unequipItem(item)
    }
    setDraggedItem(undefined)
  }

  return (
    <ItemDndContext.Provider value={{ draggedItem, isDragging: Boolean(draggedItem) }}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        modifiers={[snapCenterToCursor]}
        onDragStart={({ active }) => setDraggedItem(active.data.current?.item as Item | undefined)}
        onDragCancel={() => setDraggedItem(undefined)}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {draggedItem && (
            <img
              className="block h-auto w-auto max-h-none max-w-none origin-center scale-125 brightness-125 contrast-125 drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
              src={draggedItem.image}
              alt=""
            />
          )}
        </DragOverlay>
      </DndContext>
    </ItemDndContext.Provider>
  )
}

export function useItemDndContext() {
  const context = useContext(ItemDndContext)
  if (!context) throw new Error('useItemDndContext must be used within ItemDndProvider')
  return context
}
