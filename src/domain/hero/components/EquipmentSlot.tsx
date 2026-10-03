import type { Dispatch, SetStateAction } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { IconPencil } from '@tabler/icons-react'
import ItemCard from '@/domain/item/components/ItemCard'
import type { EquippedSetInfo, Item, ItemSet } from '@/domain/item/types'
import type { Character } from '@/domain/hero/types'
import { isItemCompatibleWithEquipmentSlot } from '@/domain/item/item.utils'
import { useItemDndContext } from '@/contexts/ItemDndContext'

type EquipmentSlotProps = {
  slot: string
  label: string
  portrait?: boolean
  item?: Item
  blocked: boolean
  disabled: boolean
  setCharacter: Dispatch<SetStateAction<Character>>
  itemSets: ItemSet[]
  activeSkillNames?: Set<string>
  equippedSetInfo: EquippedSetInfo[]
  onSelect: (slot: string) => void
  onEdit?: (item: Item) => void
  onRemove: (slot: string) => void
}

function EquipmentSlot({
  slot,
  label,
  portrait = false,
  item,
  blocked,
  disabled,
  setCharacter,
  itemSets,
  activeSkillNames,
  equippedSetInfo,
  onSelect,
  onEdit,
  onRemove,
}: EquipmentSlotProps) {
  const { draggedItem, isDragging } = useItemDndContext()
  const compatible = Boolean(draggedItem && isItemCompatibleWithEquipmentSlot(draggedItem, slot) && !blocked)
  const { isOver, setNodeRef } = useDroppable({ id: `equipment-slot-${slot}`, disabled: !compatible })

  return (
    <div
      ref={setNodeRef}
      className={`min-w-0 rounded-md transition-shadow ${compatible ? (isOver ? 'ring-2 ring-orange-300 ring-offset-2 ring-offset-neutral-950' : 'ring-1 ring-orange-300') : ''}`}
    >
      <div
        className={`group relative min-w-0 ${portrait ? 'min-h-56' : 'min-h-32'} max-w-full overflow-hidden rounded-md border ${item ? 'border-neutral-600 bg-neutral-900/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_0_28px_rgba(255,255,255,0.07),inset_0_-12px_20px_rgba(255,255,255,0.05)]' : 'border-neutral-700 bg-neutral-950/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-12px_20px_rgba(255,255,255,0.02)]'} transition-colors ${blocked || disabled ? 'opacity-60' : ''}`}
      >
        <span className="absolute left-1.5 top-1.5 z-10 max-w-[65%] truncate bg-zinc-400/10 text-zinc-200 text-xs font-medium px-1.5 py-0.5 rounded">
          {label}
        </span>
        {item && !isDragging && (
          <div className="pointer-events-none absolute right-1 top-1 z-10 flex items-center rounded border border-neutral-800 bg-neutral-950/95 opacity-0 shadow-sm transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
            <label className="flex h-7 shrink-0 items-center gap-1 px-1.5 text-[0.6rem] text-neutral-500">
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
                aria-label={`Deactivate ${label}`}
                title={`Deactivate ${label}`}
              />
              Off
            </label>
            {!blocked && onEdit && (
              <button
                className="flex size-7 shrink-0 items-center justify-center border-l border-neutral-800 text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
                type="button"
                aria-label={`Edit ${label}`}
                title={`Edit ${label}`}
                onClick={() => onEdit(item)}
              >
                <IconPencil size={14} stroke={1.8} aria-hidden="true" />
              </button>
            )}
            {!blocked && (
              <button
                className="flex size-7 shrink-0 items-center justify-center border-l border-neutral-800 text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
                type="button"
                aria-label={`Remove ${label}`}
                title={`Remove ${label}`}
                onClick={() => onRemove(slot)}
              >
                ×
              </button>
            )}
          </div>
        )}
        {blocked ? (
          <p
            className={`m-0 grid ${portrait ? 'min-h-56' : 'min-h-32'} place-items-center px-3 pt-8 text-center text-xs text-neutral-600`}
          >
            Blocked by two-handed weapon
          </p>
        ) : item ? (
          <div
            className={`mx-auto flex min-w-0 ${portrait ? 'aspect-[3/4] min-h-52 w-full max-w-54' : 'min-h-32 w-full'} items-center justify-center px-2 pb-2 pt-10 ${disabled ? 'opacity-40' : ''}`}
          >
            <ItemCard
              item={item}
              activeSkillNames={activeSkillNames}
              itemSets={itemSets}
              equippedSetInfo={equippedSetInfo}
              imageOnly
              dragSource={`equipment-slot-${slot}`}
            />
          </div>
        ) : (
          <button
            className={`m-1 mt-8 flex ${portrait ? 'aspect-[3/4] min-h-52 w-[calc(100%-0.5rem)] max-w-54' : 'min-h-24 w-[calc(100%-0.5rem)]'} items-center justify-center rounded border border-dashed border-neutral-700/80 bg-neutral-900/25 text-neutral-700 shadow-inner transition-colors hover:border-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-400`}
            type="button"
            onClick={() => onSelect(slot)}
            aria-label={`Select item for ${label}`}
            title={`Select item for ${label}`}
          >
            <span className="size-2 rounded-full border border-current opacity-50" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

export default EquipmentSlot
