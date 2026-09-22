import { useEffect, useMemo, useState } from 'react'
import type { Item } from '@/domain/item/types'

type Affix = {
  id: string
  kind: 'Prefix' | 'Suffix'
  name: string
  description?: string
  rarity: 'Magical' | 'Rare' | 'Epic' | 'Legendary'
  attributes: Array<{ label: string; value: string | number }>
  validCategories: string[]
  levelRanges: Array<{ min: number; max: number }>
}

type CraftItemPanelProps = {
  item: Item
  onCraft: (item: Item) => void
  onPreview?: (item: Item) => void
}

function CraftItemPanel({ item, onCraft, onPreview }: CraftItemPanelProps) {
  const [affixes, setAffixes] = useState<Affix[]>([])
  const [prefixId, setPrefixId] = useState('')
  const [suffixId, setSuffixId] = useState('')

  useEffect(() => {
    fetch('/data/affixes.json')
      .then((response) => response.json() as Promise<Affix[]>)
      .then(setAffixes)
      .catch(() => setAffixes([]))
  }, [])

  const validAffixes = useMemo(() => {
    const itemClass = String(item.stats?.Class ?? '')
    const valid = affixes.filter((affix) =>
      affix.validCategories.some(
        (category) =>
          category === item.category ||
          (category === 'Weapon Caster' && item.category === 'Weapon' && /caster/i.test(itemClass)) ||
          (category === 'Off-Hand Focus' && item.category === 'Off-Hand' && /focus/i.test(itemClass)),
      ),
    )
    return {
      prefixes: valid.filter((affix) => affix.kind === 'Prefix'),
      suffixes: valid.filter((affix) => affix.kind === 'Suffix'),
    }
  }, [affixes, item.category])
  const selectedPrefix = validAffixes.prefixes.find((affix) => affix.id === prefixId)
  const selectedSuffix = validAffixes.suffixes.find((affix) => affix.id === suffixId)
  const preview = useMemo<Item>(() => {
    const selectedAffixes = [selectedPrefix, selectedSuffix].filter(Boolean)
    const affixAttributes = selectedAffixes.flatMap((affix) =>
      affix!.attributes.length > 0
        ? affix!.attributes
        : affix!.description
          ? [{ label: `${affix!.name} Effect`, value: affix!.description }]
          : [],
    )
    return {
      ...item,
      rarity:
        item.rarity === 'Common'
          ? selectedAffixes.some((affix) => affix?.rarity === 'Rare')
            ? 'Rare'
            : selectedAffixes.length > 0
              ? 'Magic'
              : item.rarity
          : item.rarity,
      prefix: selectedPrefix?.name,
      suffix: selectedSuffix?.name,
      attributes: [...(item.attributes ?? []), ...affixAttributes],
    }
  }, [item, selectedPrefix, selectedSuffix])

  useEffect(() => {
    onPreview?.(preview)
  }, [onPreview, preview])

  const craft = () => onCraft({ ...preview, id: `${item.id}::crafted::${Date.now()}` })

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 border-t border-neutral-800 pt-3">
        {(
          [
            ['Prefix', validAffixes.prefixes, prefixId, setPrefixId],
            ['Suffix', validAffixes.suffixes, suffixId, setSuffixId],
          ] as const
        ).map(([kind, options, selectedId, setSelectedId]) => (
          <section className="grid gap-2" key={kind}>
            <div className="flex items-center justify-between">
              <p className="m-0 text-xs uppercase tracking-[0.12em] text-neutral-500">{kind}</p>
              {selectedId && (
                <button
                  className="text-xs text-neutral-600 hover:text-neutral-300"
                  type="button"
                  onClick={() => setSelectedId('')}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {options.map((affix) => {
                const stats =
                  affix.attributes.length > 0
                    ? affix.attributes.map((attribute) => `${attribute.value} ${attribute.label}`)
                    : affix.description
                      ? [affix.description]
                      : ['No extracted stats']
                const selected = selectedId === affix.id
                return (
                  <button
                    className={`rounded-md border p-3 text-left transition-colors ${selected ? 'border-orange-300 bg-orange-300/10' : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-600 hover:bg-neutral-800/80'}`}
                    key={affix.id}
                    type="button"
                    onClick={() => setSelectedId(selected ? '' : affix.id)}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <strong className="text-sm text-neutral-100">{affix.name}</strong>
                      <span className="shrink-0 text-[0.62rem] uppercase tracking-[0.08em] text-neutral-500">
                        {affix.rarity}
                      </span>
                    </span>
                    <span className="mt-2 grid gap-0.5 text-xs text-neutral-400">
                      {stats.map((stat) => (
                        <span key={stat}>{stat}</span>
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <button
        className="rounded-md border border-orange-300/60 bg-orange-300/10 px-3 py-2 text-sm text-orange-100 hover:bg-orange-300/20"
        type="button"
        onClick={craft}
      >
        Add finished item to library
      </button>
    </div>
  )
}

export default CraftItemPanel
