import { useState } from 'react'
import ItemCard from '@/domain/item/components/ItemCard'
import CraftItemPanel from '@/domain/item/components/CraftItemPanel'
import type { EquippedSetInfo, Item, ItemSet } from '@/domain/item/types'

type ItemCraftModalProps = {
  item: Item
  itemSets?: ItemSet[]
  equippedSetInfo?: EquippedSetInfo[]
  activeSkillNames?: Set<string>
  onSave: (item: Item) => void
  onClose: () => void
}

function ItemCraftModal({ item, itemSets, equippedSetInfo, activeSkillNames, onSave, onClose }: ItemCraftModalProps) {
  const [draftItem, setDraftItem] = useState(item)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative my-auto flex h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] w-full max-w-6xl flex-col overflow-visible rounded-lg border border-neutral-700 bg-neutral-950 p-5 shadow-2xl shadow-black/60 lg:ml-64">
        <div className="mb-5 flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Crafting</p>
            <h2 className="text-lg font-medium text-neutral-50">Edit selected item</h2>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="grid h-full gap-6">
            <section className="min-w-0 lg:absolute lg:right-full lg:top-0 lg:mr-5 lg:w-80" aria-label="Item preview">
              <ItemCard
                item={draftItem}
                itemSets={itemSets}
                equippedSetInfo={equippedSetInfo}
                activeSkillNames={activeSkillNames}
              />
            </section>
            <section className="min-h-0 min-w-0 overflow-y-auto pr-2" aria-label="Item configuration">
              <CraftItemPanel key={item.id} item={draftItem} onPreview={setDraftItem} />
            </section>
          </div>
        </div>
        <div className="mt-5 flex shrink-0 justify-end gap-2 border-t border-neutral-800 pt-4">
          <button
            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-100"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-md border border-orange-300/60 bg-orange-300/10 px-3 py-2 text-sm text-orange-100 hover:bg-orange-300/20"
            type="button"
            onClick={() => onSave(draftItem)}
          >
            Save item
          </button>
        </div>
      </div>
    </div>
  )
}

export default ItemCraftModal
