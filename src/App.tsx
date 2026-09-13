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
    <main className="app-shell">
      <section className="intro">
        <div></div>
        <div className="dataset-note">
          <span className="status-dot" />
          <strong>{datasetTotal || '...'} records</strong>
          <span>background loaded</span>
        </div>
      </section>
      <section className="toolbar" aria-label="Filter items">
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Search the archive"
          />
        </label>
        <div className="category-tabs">
          {categories.map((name) => (
            <button
              className={category === name ? 'active' : ''}
              key={name}
              type="button"
              onClick={() => changeFilter(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </section>
      <section className="catalog-head">
        <p>{total} matching items</p>
        <span>
          Page {Math.min(page + 1, pageCount)} of {pageCount}
        </span>
      </section>
      {loading ? (
        <div className="empty-state">
          <strong>Loading database</strong>
          <span>The JSON file is loading in the background.</span>
        </div>
      ) : status === 'error' ? (
        <div className="empty-state">
          <strong>Could not load items</strong>
          <span>Check that public/data/items.json exists.</span>
        </div>
      ) : (
        <section className="item-grid">
          {items.map((item) => (
            <ItemCard item={item} key={item.id} />
          ))}
        </section>
      )}
      {!loading && status === 'ready' && items.length === 0 && (
        <div className="empty-state">
          <strong>No records found</strong>
          <span>Try a different search or category.</span>
        </div>
      )}
      {status === 'ready' && items.length > 0 && (
        <nav className="pagination" aria-label="Item pages">
          <button type="button" disabled={page === 0} onClick={() => requestPage(page - 1)}>
            Previous
          </button>
          <span>
            {page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total}
          </span>
          <button type="button" disabled={page >= pageCount - 1} onClick={() => requestPage(page + 1)}>
            Next
          </button>
        </nav>
      )}
      <footer>
        <span>GD CREATOR</span>
        <span>
          Import source: <code>data/source/items.json</code>
        </span>
      </footer>
    </main>
  )
}

export default App
