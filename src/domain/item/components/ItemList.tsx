import ItemCard from '@/domain/item/components/ItemCard'
import type { EquippedSetInfo, ItemSet } from '@/domain/item/types'
import type { Item } from '@/domain/item/types'

type ItemListProps = {
  items: Item[]
  page: number
  pageCount: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onEquip: (item: Item) => void
  onUnequip: (item: Item) => void
  isEquipped: (item: Item) => boolean
  activeSkillNames?: Set<string>
  itemSets?: ItemSet[]
  equippedSetInfo?: EquippedSetInfo[]
  onCreateInstance?: (item: Item) => void
  onSelect?: (item: Item) => void
  onRemoveInstance?: (item: Item) => void
}

function ItemList({
  items,
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onEquip,
  onUnequip,
  isEquipped,
  activeSkillNames,
  itemSets,
  equippedSetInfo,
  onCreateInstance,
  onSelect,
  onRemoveInstance,
}: ItemListProps) {
  return (
    <>
      <nav
        className="mb-4 flex items-center justify-between gap-4 text-xs tabular-nums text-neutral-500"
        aria-label="Top item pages"
      >
        <button
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-300 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span>
          {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total}
        </span>
        <button
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-300 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </nav>
      <section className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 xl:grid-cols-4">
        {items.map((item) => (
          <ItemCard
            item={item}
            key={item.id}
            onEquip={onEquip}
            onUnequip={onUnequip}
            isEquipped={isEquipped(item)}
            activeSkillNames={activeSkillNames}
            itemSets={itemSets}
            equippedSetInfo={equippedSetInfo}
            onCreateInstance={onCreateInstance}
            onSelect={onSelect}
            onRemoveInstance={onRemoveInstance}
          />
        ))}
      </section>
      <nav
        className="mt-7 flex items-center justify-center gap-4 text-xs tabular-nums text-neutral-500"
        aria-label="Item pages"
      >
        <button
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-300 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span>
          {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total}
        </span>
        <button
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-300 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </nav>
    </>
  )
}

export default ItemList
