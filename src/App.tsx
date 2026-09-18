import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import './App.css'
import { Card } from './components/Card'
import ItemCard from './components/ItemCard'

type Item = {
  id: string
  name: string
  description: string
  category: string
  rarity: string
  level: number
  image?: string
  attributes?: Array<{ label: string; value: string | number }>
  stats?: Record<string, string | number>
}
type Character = {
  level: number
  physique: number
  cunning: number
  spirit: number
  equipment: Partial<Record<string, Item>>
}
type WorkerMessage =
  | { type: 'ready'; total: number; categories: string[] }
  | { type: 'page'; page: number; pageSize: number; total: number; items: Item[] }
  | { type: 'error'; message: string }

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState(['All'])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(24)
  const [total, setTotal] = useState(0)
  const [datasetTotal, setDatasetTotal] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [view, setView] = useState<'library' | 'character'>('library')
  const [character, setCharacter] = useState<Character>({
    level: 1,
    physique: 50,
    cunning: 50,
    spirit: 50,
    equipment: {},
  })
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    const worker = new Worker('/item-worker.js')
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data
      if (message.type === 'ready') {
        setDatasetTotal(message.total)
        setCategories(message.categories)
        setStatus('ready')
      }
      if (message.type === 'page') {
        setItems(message.items)
        setPageSize(message.pageSize)
        setTotal(message.total)
        setStatus('ready')
      }
      if (message.type === 'error') setStatus('error')
    }
    worker.postMessage({ type: 'load' })
    return () => worker.terminate()
  }, [])

  const requestPage = (nextPage: number, nextSearch = search, nextCategory = category) => {
    setPage(nextPage)
    workerRef.current?.postMessage({ type: 'page', page: nextPage, search: nextSearch, category: nextCategory })
  }

  const changeFilter = (value: string) => {
    setCategory(value)
    requestPage(0, search, value)
  }
  const changeSearch = (value: string) => {
    setSearch(value)
    requestPage(0, value, category)
  }
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const loading = status === 'loading'
  const equipItem = (item: Item) => {
    setCharacter((current) => ({
      ...current,
      equipment: { ...current.equipment, [item.category]: item },
    }))
    setView('character')
  }

  return (
    <main className="min-h-screen w-full px-4 pb-10 text-neutral-100 sm:px-6 lg:px-8 xl:px-10">
      <section className="flex items-end justify-between gap-6 py-10 sm:py-14">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-orange-300">Grim Dawn builder</p>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-50">Character workshop</h1>
        </div>
        <div className="grid grid-cols-[auto_auto] gap-x-2 gap-y-1 border-l border-neutral-700 pl-4 text-[0.68rem] uppercase tracking-[0.14em] text-neutral-500">
          <span className="mt-1.5 size-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_#fb923c]" />
          <strong className="font-medium tracking-[0.05em] text-neutral-200">{datasetTotal || '...'} records</strong>
          <span className="col-start-2">background loaded</span>
        </div>
      </section>
      <nav className="mb-4 flex gap-1 border-b border-neutral-800" aria-label="Workspace views">
        {(['library', 'character'] as const).map((name) => (
          <button
            className={`border-b-2 px-4 py-2 text-sm transition-colors ${
              view === name
                ? 'border-orange-400 text-orange-200'
                : 'border-transparent text-neutral-500 hover:text-neutral-200'
            }`}
            key={name}
            type="button"
            onClick={() => setView(name)}
          >
            {name === 'library' ? 'Item library' : 'Character'}
          </button>
        ))}
      </nav>
      {view === 'character' ? (
        <CharacterPanel character={character} setCharacter={setCharacter} />
      ) : (
        <>
          <section
            className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3"
            aria-label="Filter items"
          >
            <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-3 text-orange-300 sm:flex-none">
              <span aria-hidden="true" className="text-lg">
                ⌕
              </span>
              <input
                className="w-full bg-transparent py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="Search the archive"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((name) => (
                <button
                  className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                    category === name
                      ? 'border-neutral-500 bg-neutral-600 text-white'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-neutral-100'
                  }`}
                  key={name}
                  type="button"
                  onClick={() => changeFilter(name)}
                >
                  {name}
                </button>
              ))}
            </div>
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
          ) : (
            <section className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
              {items.map((item) => (
                <ItemCard item={item} key={item.id} onEquip={equipItem} />
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
                className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-300 transition-colors hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                disabled={page === 0}
                onClick={() => requestPage(page - 1)}
              >
                Previous
              </button>
              <span>
                {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total}
              </span>
              <button
                className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-300 transition-colors hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => requestPage(page + 1)}
              >
                Next
              </button>
            </nav>
          )}
          <footer className="mt-16 flex justify-between border-t border-neutral-800 pt-5 text-[0.68rem] uppercase tracking-[0.14em] text-neutral-600">
            <span>GD CREATOR</span>
            <span>
              Import source: <code>data/source/items.json</code>
            </span>
          </footer>
        </>
      )}
    </main>
  )
}

function CharacterPanel({
  character,
  setCharacter,
}: {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
}) {
  const totals = Object.values(character.equipment).reduce<Record<string, number>>((result, item) => {
    for (const attribute of item?.attributes ?? []) {
      const value = Number(String(attribute.value).replace(/[^0-9.-]/g, ''))
      if (Number.isFinite(value)) result[attribute.label] = (result[attribute.label] ?? 0) + value
    }
    return result
  }, {})
  const slots = [
    'Weapon',
    'Chest Armor',
    'Gloves',
    'Pants',
    'Boots',
    'Helm',
    'Shoulders',
    'Belt',
    'Amulet',
    'Ring',
    'Medal',
  ]
  const update = (field: 'level' | 'physique' | 'cunning' | 'spirit', value: string) =>
    setCharacter((current) => ({ ...current, [field]: Math.max(1, Number(value) || 1) }))

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <Card as="section" size="lg" variant="elevated">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Character sheet</p>
            <h2 className="text-xl font-medium text-neutral-50">Build your character</h2>
          </div>
          <label className="grid min-w-56 gap-2 text-xs text-neutral-500">
            <span className="flex items-center justify-between uppercase tracking-[0.14em]">
              <span>Character level</span>
              <strong className="text-sm font-medium normal-case tracking-normal text-orange-200">
                {character.level} / 100
              </strong>
            </span>
            <input
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-700 accent-orange-400"
              type="range"
              min="1"
              max="100"
              step="1"
              value={character.level}
              onChange={(event) => update('level', event.target.value)}
              aria-label="Character level"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(['physique', 'cunning', 'spirit'] as const).map((field) => (
            <label className="grid gap-1 text-xs capitalize text-neutral-500" key={field}>
              {field}
              <input
                className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-400"
                type="number"
                min="1"
                value={character[field]}
                onChange={(event) => update(field, event.target.value)}
              />
            </label>
          ))}
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {slots.map((slot) => {
            const item = character.equipment[slot]
            return (
              <div
                className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2"
                key={slot}
              >
                <span className="text-xs text-neutral-500">{slot}</span>
                <span className="max-w-[60%] truncate text-xs text-neutral-200">{item?.name ?? 'Empty'}</span>
                {item && (
                  <button
                    className="ml-2 text-xs text-neutral-500 hover:text-orange-300"
                    type="button"
                    onClick={() =>
                      setCharacter((current) => ({
                        ...current,
                        equipment: { ...current.equipment, [slot]: undefined },
                      }))
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </Card>
      <Card as="aside" size="lg" variant="filled">
        <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Resulting stats</p>
        <h2 className="mb-5 text-xl font-medium text-neutral-50">Level {character.level} profile</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Physique', character.physique + (totals.Physique ?? 0)],
            ['Cunning', character.cunning + (totals.Cunning ?? 0)],
            ['Spirit', character.spirit + (totals.Spirit ?? 0)],
            ['Health', totals.Health ?? 0],
            ['Armor', totals.Armor ?? 0],
            ['Offensive Ability', totals['Offensive Ability'] ?? 0],
            ['Defensive Ability', totals['Defensive Ability'] ?? 0],
            ['Damage Conversion', Object.keys(character.equipment).length],
          ].map(([label, value]) => (
            <div className="rounded-md border border-neutral-800 bg-neutral-950/60 px-3 py-2" key={label as string}>
              <p className="m-0 text-[0.68rem] text-neutral-500">{label}</p>
              <strong className="text-sm text-neutral-100">{value}</strong>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}

export default App
