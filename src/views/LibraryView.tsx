import ItemCard from '../components/ItemCard'
import { Card } from '../components/Card'
import type { Item } from '../types'
import type { EquippedSetInfo, ItemSet } from '../itemSets'

type LibraryViewProps = {
  items: Item[]
  category: string
  search: string
  page: number
  pageCount: number
  pageSize: number
  total: number
  loading: boolean
  status: 'loading' | 'ready' | 'error'
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onPageChange: (page: number) => void
  onEquip: (item: Item) => void
  onUnequip: (item: Item) => void
  isEquipped: (item: Item) => boolean
  activeSkillNames?: Set<string>
  itemSets?: ItemSet[]
  equippedSetInfo?: EquippedSetInfo[]
  hideAboveLevel?: boolean
  onToggleHideAboveLevel?: () => void
  onlySetItems?: boolean
  onToggleOnlySetItems?: () => void
}

const CATEGORY_GROUPS: Record<string, string[]> = {
  Jewelry: ['Medal', 'Amulet', 'Ring', 'Belt'],
  Armor: ['Chest Armor', 'Gloves', 'Pants', 'Boots', 'Helm', 'Shoulders'],
  Weapon: ['Weapon', 'Off-Hand'],
}
const TOP_CATEGORIES = ['All', ...Object.keys(CATEGORY_GROUPS)]

function LibraryView({
  items,
  category,
  search,
  page,
  pageCount,
  pageSize,
  total,
  loading,
  status,
  onSearchChange,
  onCategoryChange,
  onPageChange,
  onEquip,
  onUnequip,
  isEquipped,
  activeSkillNames,
  itemSets,
  equippedSetInfo,
  hideAboveLevel = false,
  onToggleHideAboveLevel,
  onlySetItems = false,
  onToggleOnlySetItems,
}: LibraryViewProps) {
  const selectedGroup = Object.entries(CATEGORY_GROUPS).find(([, subcategories]) =>
    subcategories.includes(category),
  )?.[0]
  const activeTopCategory = selectedGroup ?? category
  const visibleSubcategories = CATEGORY_GROUPS[selectedGroup ?? category] ?? []

  return (
    <Card as="section" size="lg" variant="filled">
      <section className="flex flex-wrap items-center justify-between gap-2" aria-label="Filter items">
        <div className="flex flex-wrap gap-1">
          {TOP_CATEGORIES.map((name) => (
            <button
              className={`rounded border px-2 py-1 text-[0.7rem] transition-colors ${
                activeTopCategory === name
                  ? 'border-neutral-500 bg-neutral-600 text-white'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800 hover:text-neutral-100'
              }`}
              key={name}
              type="button"
              onClick={() => onCategoryChange(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <label className="flex min-w-48 flex-1 items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 px-2 text-orange-300 sm:max-w-52 sm:flex-none">
          <span aria-hidden="true" className="text-base">
            ⌕
          </span>
          <input
            className="w-full bg-transparent py-1.5 text-xs text-neutral-100 outline-none placeholder:text-neutral-600"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search the archive"
          />
        </label>
      </section>
      {visibleSubcategories.length > 0 && (
        <section
          className="mt-1 flex flex-wrap items-center gap-0.5 border-l border-neutral-800 pl-1.5"
          aria-label="Item subcategories"
        >
          {visibleSubcategories.map((name) => (
            <button
              className={`rounded border px-1.5 py-0.5 text-[0.62rem] transition-colors ${
                category === name
                  ? 'border-neutral-600 bg-neutral-800/70 text-neutral-200'
                  : 'border-transparent text-neutral-500 hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-300'
              }`}
              key={name}
              type="button"
              onClick={() => onCategoryChange(name)}
            >
              {name}
            </button>
          ))}
        </section>
      )}
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
              onChange={onToggleHideAboveLevel}
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
              onChange={onToggleOnlySetItems}
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
      {status === 'ready' && items.length > 0 && (
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
      )}
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
      ) : (
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
            />
          ))}
        </section>
      )}
      {!loading && status === 'ready' && items.length === 0 && (
        <div className="grid gap-2 py-20 text-center text-sm text-neutral-500">
          <strong className="text-lg font-medium text-neutral-200">No records found</strong>
          <span>Try a different search or item type.</span>
        </div>
      )}
      {status === 'ready' && items.length > 0 && (
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
      )}
    </Card>
  )
}

export default LibraryView
