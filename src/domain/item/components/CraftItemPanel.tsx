import { useEffect, useMemo, useRef, useState } from 'react'
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
  requiredLevel: number
}

type CraftingCatalog = { affixes: Affix[]; components: Item[]; augments: Item[] }
type RelicBonus = {
  id: string
  name: string
  description?: string
  attributes: Array<{ label: string; value: string | number }>
}
type RelicBonusData = { bonuses: RelicBonus[]; tables: Record<string, string[]> }
let craftingCatalogPromise: Promise<CraftingCatalog> | undefined
let relicBonusCatalogPromise: Promise<RelicBonusData> | undefined

const loadCraftingCatalog = () => {
  craftingCatalogPromise ??= Promise.all([
    fetch('/data/affixes.json').then((response) => response.json() as Promise<Affix[]>),
    fetch('/data/items.json').then((response) => response.json() as Promise<Item[]>),
  ]).then(([affixes, items]) => ({
    affixes,
    components: items.filter((item) => item.category === 'Component' && item.attributes?.length),
    augments: items.filter((item) => item.category === 'Augment' && item.attributes?.length),
  }))
  return craftingCatalogPromise
}
const loadRelicBonusCatalog = () => {
  relicBonusCatalogPromise ??= fetch('/data/relic-bonuses.json').then(
    (response) => response.json() as Promise<RelicBonusData>,
  )
  return relicBonusCatalogPromise
}

type CraftItemPanelProps = {
  item: Item
  onPreview?: (item: Item) => void
}

function CraftItemPanel({ item, onPreview }: CraftItemPanelProps) {
  const [affixes, setAffixes] = useState<Affix[]>([])
  const [affixesLoaded, setAffixesLoaded] = useState(false)
  const [prefixId, setPrefixId] = useState('')
  const [suffixId, setSuffixId] = useState('')
  const [components, setComponents] = useState<Item[]>([])
  const [augments, setAugments] = useState<Item[]>([])
  const [componentId, setComponentId] = useState('')
  const [augmentId, setAugmentId] = useState('')
  const [activeTab, setActiveTab] = useState<'affixes' | 'components' | 'augments'>('affixes')
  const [relicBonuses, setRelicBonuses] = useState<RelicBonus[]>([])
  const [relicBonusId, setRelicBonusId] = useState('')

  useEffect(() => {
    Promise.all([loadCraftingCatalog(), loadRelicBonusCatalog()])
      .then(([{ affixes: loadedAffixes, components: loadedComponents, augments: loadedAugments }, bonusData]) => {
        setAffixes(loadedAffixes)
        setComponents(loadedComponents)
        setAugments(loadedAugments)
        const table = String(item.stats?.bonusTableName ?? '').replace(/^records\//, '')
        const bonusIds = bonusData.tables[table] ?? []
        setRelicBonuses(bonusData.bonuses.filter((bonus) => bonusIds.includes(bonus.id)))
        setRelicBonusId(item.relicBonusId ?? '')
        setPrefixId(
          loadedAffixes.find(
            (affix) =>
              affix.kind === 'Prefix' && (affix.id === item.prefixId || (!item.prefixId && affix.name === item.prefix)),
          )?.id ?? '',
        )
        setSuffixId(
          loadedAffixes.find(
            (affix) =>
              affix.kind === 'Suffix' && (affix.id === item.suffixId || (!item.suffixId && affix.name === item.suffix)),
          )?.id ?? '',
        )
        setComponentId(item.componentId ?? '')
        setAugmentId(item.augmentId ?? '')
        setAffixesLoaded(true)
      })
      .catch(() => {
        setAffixes([])
        setComponents([])
        setAugments([])
        setRelicBonuses([])
        setAffixesLoaded(true)
      })
  }, [])

  const isCompatible = (candidate: Item) => {
    const flags = candidate.stats ?? {}
    const itemClass = String(item.stats?.Class ?? '').toLowerCase()
    const targetFlags =
      item.category === 'Weapon'
        ? [
            'weapon',
            itemClass.includes('sword') ? 'sword' : '',
            itemClass.includes('axe') ? 'axe' : '',
            itemClass.includes('dagger') ? 'dagger' : '',
            itemClass.includes('mace') ? 'mace' : '',
            itemClass.includes('ranged') ? 'ranged1h' : '',
          ]
        : item.category === 'Off-Hand'
          ? ['offhand', itemClass.includes('shield') ? 'shield' : '', itemClass.includes('focus') ? 'focus' : '']
          : item.category === 'Amulet' ||
              item.category === 'Medal' ||
              item.category === 'Ring' ||
              item.category === 'Belt'
            ? ['accessory', item.category.toLowerCase()]
            : [
                item.category === 'Chest Armor'
                  ? 'chest'
                  : item.category === 'Gloves'
                    ? 'hands'
                    : item.category === 'Pants'
                      ? 'legs'
                      : item.category === 'Boots'
                        ? 'feet'
                        : item.category === 'Helm'
                          ? 'head'
                          : item.category === 'Shoulders'
                            ? 'shoulders'
                            : '',
              ]
    return targetFlags.some((flag) => flag && Number(flags[flag] ?? 0) !== 0)
  }

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
  }, [affixes, item.category, item.stats?.Class])
  const selectedPrefix = validAffixes.prefixes.find((affix) => affix.id === prefixId)
  const selectedSuffix = validAffixes.suffixes.find((affix) => affix.id === suffixId)
  const selectedComponent = components.find((candidate) => candidate.id === componentId)
  const selectedAugment = augments.find((candidate) => candidate.id === augmentId)
  const selectedRelicBonus = relicBonuses.find((bonus) => bonus.id === relicBonusId)
  const compatibleComponents = components.filter(isCompatible)
  const compatibleAugments = augments.filter(isCompatible)
  const allowAffixes = item.category !== 'Relic' && !['Epic', 'Legendary'].includes(item.originRarity ?? item.rarity)
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
        (item.originRarity ?? item.rarity) === 'Common'
          ? selectedAffixes.some((affix) => affix?.rarity === 'Rare')
            ? 'Rare'
            : selectedAffixes.length > 0
              ? 'Magic'
              : (item.originRarity ?? item.rarity)
          : (item.originRarity ?? item.rarity),
      prefix: selectedPrefix?.name,
      suffix: selectedSuffix?.name,
      prefixId: selectedPrefix?.id,
      suffixId: selectedSuffix?.id,
      componentId: selectedComponent?.id,
      augmentId: selectedAugment?.id,
      relicBonusId: selectedRelicBonus?.id,
      attributes: [
        ...(item.baseAttributes ?? item.attributes ?? []),
        ...affixAttributes,
        ...(selectedComponent?.attributes ?? []),
        ...(selectedAugment?.attributes ?? []),
        ...(selectedRelicBonus?.attributes ?? []),
      ],
    }
  }, [item, selectedPrefix, selectedSuffix, selectedComponent, selectedAugment, selectedRelicBonus])

  const lastPreviewSignature = useRef('')
  useEffect(() => {
    if (!affixesLoaded) return
    const signature = JSON.stringify({
      id: preview.id,
      rarity: preview.rarity,
      prefix: preview.prefix,
      suffix: preview.suffix,
      componentId: preview.componentId,
      augmentId: preview.augmentId,
      relicBonusId: preview.relicBonusId,
      attributes: preview.attributes,
    })
    if (signature === lastPreviewSignature.current) return
    lastPreviewSignature.current = signature
    onPreview?.(preview)
  }, [affixesLoaded, preview])

  return (
    <div className="grid gap-4">
      <nav className="flex gap-1 border-b border-neutral-800" aria-label="Crafting options">
        {(
          [
            ['affixes', 'Affixes'],
            ['components', 'Components'],
            ['augments', 'Augments'],
          ] as const
        ).map(([value, label]) => (
          <button
            className={`border-b-2 px-3 py-2 text-xs font-medium transition-colors ${activeTab === value ? 'border-orange-300 text-orange-100' : 'border-transparent text-neutral-500 hover:text-neutral-200'}`}
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      {activeTab === 'affixes' && allowAffixes && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ['Prefix', validAffixes.prefixes, prefixId, setPrefixId],
              ['Suffix', validAffixes.suffixes, suffixId, setSuffixId],
            ] as const
          ).map(([kind, options, selectedId, setSelectedId]) => (
            <section className="grid gap-2" key={kind}>
              <div>
                <p className="m-0 text-xs uppercase tracking-[0.12em] text-neutral-500">{kind}</p>
              </div>
              <div className="grid max-h-[42vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
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
                      <span className="mt-1 block text-[0.68rem] text-neutral-500">
                        Requires level {affix.requiredLevel}
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
      )}
      {activeTab === 'components' && (
        <section className="grid gap-2">
          <p className="m-0 text-xs uppercase tracking-[0.12em] text-neutral-500">Components</p>
          <div className="grid max-h-[55vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {compatibleComponents.map((candidate) => {
              const selected = candidate.id === componentId
              return (
                <button
                  className={`rounded-md border p-3 text-left transition-colors ${selected ? 'border-orange-300 bg-orange-300/10' : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-600 hover:bg-neutral-800/80'}`}
                  key={candidate.id}
                  type="button"
                  onClick={() => setComponentId(selected ? '' : candidate.id)}
                >
                  <span className="flex items-start gap-3">
                    {candidate.image && (
                      <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-800 bg-neutral-950 p-2">
                        <img className="block" src={candidate.image} alt="" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <strong className="block text-sm text-neutral-100">{candidate.name}</strong>
                      <span className="mt-2 grid gap-0.5 text-xs text-neutral-400">
                        {(candidate.attributes ?? []).map((attribute, index) => (
                          <span key={`${attribute.label}-${attribute.value}-${index}`}>
                            {attribute.value} {attribute.label}
                          </span>
                        ))}
                      </span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}
      {activeTab === 'augments' && (
        <section className="grid gap-2">
          <p className="m-0 text-xs uppercase tracking-[0.12em] text-neutral-500">Augments</p>
          <div className="grid max-h-[55vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {compatibleAugments.map((candidate) => {
              const selected = candidate.id === augmentId
              return (
                <button
                  className={`rounded-md border p-3 text-left transition-colors ${selected ? 'border-orange-300 bg-orange-300/10' : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-600 hover:bg-neutral-800/80'}`}
                  key={candidate.id}
                  type="button"
                  onClick={() => setAugmentId(selected ? '' : candidate.id)}
                >
                  <span className="flex items-start gap-3">
                    {candidate.image && (
                      <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-800 bg-neutral-950 p-2">
                        <img className="block" src={candidate.image} alt="" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <strong className="block text-sm text-neutral-100">{candidate.name}</strong>
                      <span className="mt-2 grid gap-0.5 text-xs text-neutral-400">
                        {(candidate.attributes ?? []).map((attribute, index) => (
                          <span key={`${attribute.label}-${attribute.value}-${index}`}>
                            {attribute.value} {attribute.label}
                          </span>
                        ))}
                      </span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}
      {item.category === 'Relic' && (
        <section className="grid gap-2">
          <p className="m-0 text-xs uppercase tracking-[0.12em] text-neutral-500">Completion Bonus</p>
          <div className="grid max-h-[42vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {relicBonuses.map((bonus) => (
              <button
                className={`rounded-md border p-3 text-left ${bonus.id === relicBonusId ? 'border-orange-300 bg-orange-300/10' : 'border-neutral-800 bg-neutral-900/60'}`}
                key={bonus.id}
                type="button"
                onClick={() => setRelicBonusId(bonus.id === relicBonusId ? '' : bonus.id)}
              >
                <strong className="block text-sm text-neutral-100">{bonus.name}</strong>
                <span className="mt-2 grid gap-0.5 text-xs text-neutral-400">
                  {bonus.attributes.map((attribute, index) => (
                    <span key={`${attribute.label}-${index}`}>
                      {attribute.value} {attribute.label}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default CraftItemPanel
