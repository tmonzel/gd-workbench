import { RARITIES, rarityBackgroundClasses, rarityBorderClasses, rarityTextClasses } from '@/domain/item/item.utils'

type ItemFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  rarities: string[]
  availableRarities?: string[]
  onRarityToggle: (rarity: string) => void
  hideAboveLevel: boolean
  onHideAboveLevelToggle: () => void
  matchingCount: number
  page: number
  pageCount: number
}

function ItemFilters({
  search,
  onSearchChange,
  searchPlaceholder,
  rarities,
  availableRarities = RARITIES,
  onRarityToggle,
  hideAboveLevel,
  onHideAboveLevelToggle,
  matchingCount,
  page,
  pageCount,
}: ItemFiltersProps) {
  return (
    <>
      <section className="mb-4 flex flex-wrap items-center justify-between gap-2" aria-label="Filter items">
        <div className="flex flex-wrap items-center gap-1" aria-label="Rarity filters">
          {RARITIES.filter((rarity) => availableRarities.includes(rarity)).map((rarity) => (
            <label
              className={`cursor-pointer rounded border px-2.5 py-1.5 text-md transition-colors ${
                rarities.includes(rarity)
                  ? `${rarityBorderClasses[rarity.toLowerCase()] ?? 'border-neutral-400/70'} brightness-125 ${rarityBackgroundClasses[rarity.toLowerCase()] ?? 'bg-neutral-800/80'} ${rarityTextClasses[rarity.toLowerCase()] ?? 'text-neutral-100'}`
                  : 'border-neutral-700 bg-neutral-900/80 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300'
              }`}
              key={rarity}
            >
              <input
                className="sr-only"
                type="checkbox"
                checked={rarities.includes(rarity)}
                onChange={() => onRarityToggle(rarity)}
              />
              {rarity}
            </label>
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
            placeholder={searchPlaceholder}
          />
        </label>
      </section>
      <section
        className="mt-1 flex flex-wrap items-center justify-start gap-1 text-xs text-neutral-500"
        aria-label="Additional filters"
      >
        <label className="flex cursor-pointer items-center gap-1.5 px-1 py-0.5 transition-colors">
          <span className="relative flex size-4 shrink-0 items-center justify-center">
            <input
              className="peer size-4 appearance-none rounded-sm border border-neutral-700 bg-neutral-950 checked:border-orange-300 checked:bg-orange-300 focus:ring-1 focus:ring-orange-300/50"
              type="checkbox"
              checked={hideAboveLevel}
              onChange={onHideAboveLevelToggle}
            />
            <span className="pointer-events-none absolute text-xs font-bold leading-none text-neutral-950 opacity-0 peer-checked:opacity-100">
              ✓
            </span>
          </span>
          <span>Equipable only</span>
        </label>
      </section>
      <section className="flex items-center justify-between px-1 py-5 text-[0.68rem] uppercase tracking-[0.14em] text-neutral-500">
        <span>{matchingCount} matching items</span>
        <span className="tabular-nums">
          Page {Math.min(page + 1, pageCount)} of {pageCount}
        </span>
      </section>
    </>
  )
}

export default ItemFilters
