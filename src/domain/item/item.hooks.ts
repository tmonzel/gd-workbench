import { useCallback, useEffect, useState } from 'react'
import type { Item } from '@/domain/item/types'
import type { ItemSet } from '@/domain/item/types'

type WorkerMessage =
  | { type: 'ready'; total: number }
  | { type: 'page'; page: number; pageSize: number; total: number; items: Item[] }
  | { type: 'error'; message: string }

export type ItemLibraryState = ReturnType<typeof useItemLibrary>

export function useItemSets() {
  const [itemSets, setItemSets] = useState<ItemSet[]>([])

  useEffect(() => {
    fetch('/data/item-sets.json')
      .then((response) => response.json() as Promise<ItemSet[]>)
      .then(setItemSets)
      .catch(() => setItemSets([]))
  }, [])

  return itemSets
}

export function useItemLibrary(level: number) {
  const [items, setItems] = useState<Item[]>([])
  const itemSets = useItemSets()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [hideAboveLevel, setHideAboveLevel] = useState(false)
  const [onlySetItems, setOnlySetItems] = useState(false)
  const [rarities, setRarities] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(24)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [worker, setWorker] = useState<Worker | null>(null)

  const requestPage = useCallback(
    (
      nextPage: number,
      nextSearch = search,
      nextCategory = category,
      nextHideAboveLevel = hideAboveLevel,
      nextOnlySetItems = onlySetItems,
      nextRarities = rarities,
    ) => {
      setPage(nextPage)
      worker?.postMessage({
        type: 'page',
        page: nextPage,
        search: nextSearch,
        category: nextCategory,
        maxLevel: nextHideAboveLevel ? level : undefined,
        onlySetItems: nextOnlySetItems,
        rarities: nextRarities,
      })
    },
    [category, hideAboveLevel, level, onlySetItems, rarities, search, worker],
  )

  useEffect(() => {
    const itemWorker = new Worker('/item-worker.js')
    setWorker(itemWorker)
    itemWorker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data
      if (message.type === 'ready') setStatus('ready')
      if (message.type === 'page') {
        setItems(message.items)
        setPageSize(message.pageSize)
        setTotal(message.total)
        setStatus('ready')
      }
      if (message.type === 'error') setStatus('error')
    }
    itemWorker.postMessage({ type: 'load' })
    return () => itemWorker.terminate()
  }, [])

  useEffect(() => {
    if (worker && itemSets.length > 0)
      worker.postMessage({ type: 'setIds', ids: itemSets.flatMap((set) => set.members) })
  }, [itemSets, worker])

  const changeCategory = (value: string) => {
    setCategory(value)
    requestPage(0, search, value)
  }
  const changeSearch = (value: string) => {
    setSearch(value)
    requestPage(0, value, category)
  }
  const toggleHideAboveLevel = () => {
    const next = !hideAboveLevel
    setHideAboveLevel(next)
    requestPage(0, search, category, next, onlySetItems)
  }
  const toggleOnlySetItems = () => {
    const next = !onlySetItems
    setOnlySetItems(next)
    requestPage(0, search, category, hideAboveLevel, next)
  }
  const toggleRarity = (rarity: string) => {
    const next = rarities.includes(rarity) ? rarities.filter((value) => value !== rarity) : [...rarities, rarity]
    setRarities(next)
    requestPage(0, search, category, hideAboveLevel, onlySetItems, next)
  }

  useEffect(() => {
    if (hideAboveLevel) requestPage(0, search, category, hideAboveLevel, onlySetItems, rarities)
  }, [category, hideAboveLevel, level, onlySetItems, rarities, requestPage, search])

  return {
    items,
    itemSets,
    search,
    category,
    hideAboveLevel,
    onlySetItems,
    rarities,
    page,
    pageSize,
    total,
    status,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    changeCategory,
    changeSearch,
    requestPage,
    toggleHideAboveLevel,
    toggleOnlySetItems,
    toggleRarity,
  }
}
