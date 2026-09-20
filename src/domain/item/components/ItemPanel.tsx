import { Card } from '@/components/Card'
import ItemList from '@/domain/item/components/ItemList'
import ItemSideNav from '@/domain/item/components/ItemSideNav'
import type { Item } from '@/domain/item/types'
import type { EquippedSetInfo } from '@/domain/item/types'
import { useItemLibrary } from '@/domain/item/item.hooks'

type ItemPanelProps = {
  level: number
  onEquip: (item: Item) => void
  onUnequip: (item: Item) => void
  isEquipped: (item: Item) => boolean
  activeSkillNames?: Set<string>
  equippedSetInfo?: EquippedSetInfo[]
}

function ItemPanel({ level, onEquip, onUnequip, isEquipped, activeSkillNames, equippedSetInfo }: ItemPanelProps) {
  const {
    items,
    itemSets,
    search,
    category,
    hideAboveLevel,
    onlySetItems,
    page,
    pageSize,
    total,
    status,
    pageCount,
    changeCategory,
    changeSearch,
    requestPage,
    toggleHideAboveLevel,
    toggleOnlySetItems,
  } = useItemLibrary(level)
  const loading = status === 'loading'
  return (
    <Card as="section" size="lg" variant="filled">
      <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        <ItemSideNav category={category} onCategoryChange={changeCategory} />
        <div className="min-w-0">
          <section className="flex flex-wrap items-center justify-between gap-2" aria-label="Filter items">
            <label className="flex min-w-48 flex-1 items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 px-2 text-orange-300 sm:max-w-52 sm:flex-none">
              <span aria-hidden="true" className="text-base">
                ⌕
              </span>
              <input
                className="w-full bg-transparent py-1.5 text-xs text-neutral-100 outline-none placeholder:text-neutral-600"
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="Search the archive"
              />
            </label>
          </section>
          <section className="mt-1 flex flex-wrap items-center justify-end gap-1" aria-label="Additional filters">
            <label
              className={`flex cursor-pointer items-center gap-1.5 px-1 py-0.5 text-xs transition-colors ${
                hideAboveLevel ? 'text-neutral-200' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              htmlFor="equipable-only"
            >
              <span className="relative flex size-4 shrink-0 items-center justify-center">
                <input
                  className="peer size-4 appearance-none rounded-sm border border-neutral-700 bg-neutral-950 checked:border-orange-300 checked:bg-orange-300 focus:ring-1 focus:ring-orange-300/50"
                  type="checkbox"
                  id="equipable-only"
                  checked={hideAboveLevel}
                  onChange={toggleHideAboveLevel}
                />
                <span className="pointer-events-none absolute text-xs font-bold leading-none text-neutral-950 opacity-0 peer-checked:opacity-100">
                  ✓
                </span>
              </span>
              <span>Equipable only</span>
            </label>
            <label
              className={`flex cursor-pointer items-center gap-1.5 px-1 py-0.5 text-xs transition-colors ${
                onlySetItems ? 'text-neutral-200' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              htmlFor="only-set-items"
            >
              <span className="relative flex size-4 shrink-0 items-center justify-center">
                <input
                  className="peer size-4 appearance-none rounded-sm border border-neutral-700 bg-neutral-950 checked:border-orange-300 checked:bg-orange-300 focus:ring-1 focus:ring-orange-300/50"
                  type="checkbox"
                  id="only-set-items"
                  checked={onlySetItems}
                  onChange={toggleOnlySetItems}
                />
                <span className="pointer-events-none absolute text-xs font-bold leading-none text-neutral-950 opacity-0 peer-checked:opacity-100">
                  ✓
                </span>
              </span>
              <span>Set items only</span>
            </label>
          </section>
          <section className="flex items-center justify-between px-1 py-5 text-[0.68rem] uppercase tracking-[0.14em] text-neutral-500">
            <p className="m-0 text-neutral-300">{total} matching items</p>
            <span className="tabular-nums">
              Page {Math.min(page + 1, pageCount)} of {pageCount}
            </span>
          </section>
          {loading ? (
            <div className="grid gap-2 py-20 text-center text-sm text-neutral-500">
              <strong className="text-lg font-medium text-neutral-200">Loading database</strong>
              <span>The JSON file is loading in the background.</span>
            </div>
          ) : status === 'error' ? (
            <div className="grid gap-2 py-20 text-center text-sm text-neutral-500">
              <strong className="text-lg font-medium text-neutral-200">Could not load items</strong>
              <span>Check that public/data/items.json exists.</span>
            </div>
          ) : items.length > 0 ? (
            <ItemList
              items={items}
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              total={total}
              onPageChange={requestPage}
              onEquip={onEquip}
              onUnequip={onUnequip}
              isEquipped={isEquipped}
              activeSkillNames={activeSkillNames}
              itemSets={itemSets}
              equippedSetInfo={equippedSetInfo}
            />
          ) : null}
          {!loading && status === 'ready' && items.length === 0 && (
            <div className="grid gap-2 py-20 text-center text-sm text-neutral-500">
              <strong className="text-lg font-medium text-neutral-200">No records found</strong>
              <span>Try a different search or item type.</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default ItemPanel
