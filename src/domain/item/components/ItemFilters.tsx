import { RARITIES, rarityBackgroundClasses, rarityBorderClasses, rarityTextClasses } from '@/domain/item/item.utils'
import { useEffect, useRef, useState } from 'react'

type ItemFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  rarities: string[]
  availableRarities?: string[]
  onRarityToggle: (rarity: string) => void
  hideAboveLevel: boolean
  onHideAboveLevelToggle: () => void
  monsterInfrequentOnly: boolean
  onMonsterInfrequentToggle: () => void
  stats: string[]
  availableStats: string[]
  onStatsChange: (stats: string[]) => void
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
  monsterInfrequentOnly,
  onMonsterInfrequentToggle,
  stats,
  availableStats,
  onStatsChange,
  matchingCount,
  page,
  pageCount,
}: ItemFiltersProps) {
  const [statsOpen, setStatsOpen] = useState(false)
  const statsDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!statsOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (statsDropdownRef.current && !statsDropdownRef.current.contains(event.target as Node)) setStatsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [statsOpen])

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
        <label className="flex cursor-pointer items-center gap-1.5 px-1 py-0.5 transition-colors">
          <span className="relative flex size-4 shrink-0 items-center justify-center">
            <input
              className="peer size-4 appearance-none rounded-sm border border-neutral-700 bg-neutral-950 checked:border-orange-300 checked:bg-orange-300 focus:ring-1 focus:ring-orange-300/50"
              type="checkbox"
              checked={monsterInfrequentOnly}
              onChange={onMonsterInfrequentToggle}
            />
            <span className="pointer-events-none absolute text-xs font-bold leading-none text-neutral-950 opacity-0 peer-checked:opacity-100">
              ✓
            </span>
          </span>
          <span>Monster Infrequent only</span>
        </label>
      </section>
      <div className="relative mt-3" ref={statsDropdownRef}>
        <div
          className="flex w-full items-center justify-between rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-left text-xs text-neutral-300 transition-colors hover:border-neutral-500"
          role="button"
          tabIndex={0}
          aria-expanded={statsOpen}
          aria-haspopup="listbox"
          onClick={() => setStatsOpen((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setStatsOpen((current) => !current)
            }
          }}
        >
          <span className="flex min-w-0 flex-wrap items-center gap-1">
            {stats.length > 0 ? (
              stats.map((stat) => (
                <span className="inline-flex items-center gap-1 rounded bg-orange-300/10 pl-1.5 text-[0.68rem] text-orange-200" key={stat}>
                  {stat}
                  <button
                    className="px-1 py-0.5 text-orange-300/70 hover:text-orange-100"
                    type="button"
                    aria-label={`Remove ${stat} stat filter`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onStatsChange(stats.filter((value) => value !== stat))
                    }}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span>Stats</span>
            )}
          </span>
          <span className="text-neutral-500" aria-hidden="true">
            {statsOpen ? '▴' : '▾'}
          </span>
        </div>
        {statsOpen && (
          <div
            className="absolute inset-x-0 z-20 mt-1 max-h-64 overflow-y-auto rounded border border-neutral-700 bg-neutral-950 p-1 shadow-xl shadow-black/40"
            role="listbox"
            aria-label="Filter by item stats"
            aria-multiselectable="true"
          >
            {availableStats.length > 0 ? (
              availableStats.map((stat) => {
                const selected = stats.includes(stat)
                return (
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                      selected ? 'bg-orange-300/10 text-orange-200' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                    }`}
                    key={stat}
                  >
                    <input
                      className="size-3.5 accent-orange-300"
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        onStatsChange(selected ? stats.filter((value) => value !== stat) : [...stats, stat])
                      }
                    />
                    <span>{stat}</span>
                  </label>
                )
              })
            ) : (
              <p className="m-0 px-2 py-2 text-xs text-neutral-600">No stats available</p>
            )}
          </div>
        )}
      </div>
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
