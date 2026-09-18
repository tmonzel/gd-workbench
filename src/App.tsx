import { useEffect, useRef, useState } from 'react'
import './App.css'
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1800px] px-5 pb-10 text-neutral-100 sm:px-8 lg:px-16">
      <section className="flex items-end justify-between gap-6 py-10 sm:py-14">
        <div></div>
        <div className="grid grid-cols-[auto_auto] gap-x-2 gap-y-1 border-l border-neutral-700 pl-4 text-[0.68rem] uppercase tracking-[0.14em] text-neutral-500">
          <span className="mt-1.5 size-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_#fb923c]" />
          <strong className="font-medium tracking-[0.05em] text-neutral-200">{datasetTotal || '...'} records</strong>
          <span className="col-start-2">background loaded</span>
        </div>
      </section>
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
            <ItemCard item={item} key={item.id} />
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
    </main>
  )
}

export default App
