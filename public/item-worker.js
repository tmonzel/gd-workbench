let items = []
let setItemIds = new Set()
const pageSize = 24
let pendingRequest = { page: 0, search: '', category: 'All', maxLevel: undefined, onlySetItems: false }
const categoryGroups = {
  Jewelry: ['Medal', 'Amulet', 'Ring', 'Belt'],
  Armor: ['Chest Armor', 'Gloves', 'Pants', 'Boots', 'Helm', 'Shoulders'],
  Weapon: ['Weapon', 'Off-Hand'],
}

const matchesCategory = (itemCategory, category) =>
  category === 'All' || itemCategory === category || categoryGroups[category]?.includes(itemCategory)

const matches = (item, search, category, maxLevel, onlySetItems) => {
  const haystack = `${item.name} ${item.description} ${item.category}`.toLowerCase()
  const requiredLevel = Number(item.stats?.levelRequirement ?? item.level) || 0
  return (
    (!search || haystack.includes(search)) &&
    matchesCategory(item.category, category) &&
    (maxLevel == null || requiredLevel <= maxLevel) &&
    (!onlySetItems || setItemIds.has(item.id))
  )
}

const sendPage = (page, search = '', category = 'All', maxLevel = undefined, onlySetItems = false) => {
  const filtered = items.filter((item) => matches(item, search, category, maxLevel, onlySetItems))
  postMessage({
    type: 'page',
    page,
    pageSize,
    total: filtered.length,
    items: filtered.slice(page * pageSize, (page + 1) * pageSize),
  })
}

onmessage = (event) => {
  const { type, page = 0, search = '', category = 'All', maxLevel, onlySetItems = false } = event.data
  if (type === 'setIds') {
    setItemIds = new Set(event.data.ids)
  }
  if (type === 'load') {
    fetch('/data/items.json')
      .then((response) => response.json())
      .then((data) => {
        items = data
        postMessage({
          type: 'ready',
          total: items.length,
          categories: ['All', ...new Set(items.map((item) => item.category))],
        })
        sendPage(
          pendingRequest.page,
          pendingRequest.search,
          pendingRequest.category,
          pendingRequest.maxLevel,
          pendingRequest.onlySetItems,
        )
      })
      .catch((error) =>
        postMessage({
          type: 'error',
          message: error instanceof Error ? error.message : String(error),
        }),
      )
  }
  if (type === 'page') {
    pendingRequest = { page, search: search.trim().toLowerCase(), category, maxLevel, onlySetItems }
    if (items.length)
      sendPage(
        pendingRequest.page,
        pendingRequest.search,
        pendingRequest.category,
        pendingRequest.maxLevel,
        pendingRequest.onlySetItems,
      )
  }
}
