import { Card } from './Card'

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
  grantedSkill?: {
    name: string
    description: string
    level: number
    attributes: Array<{ label: string; value: string | number }>
  }
}

const isRollRangeValue = (value: string) => /^[+-]?\d+(\.\d+)?\/\d+(\.\d+)?%?$/.test(value)

const isPathValue = (value: string | number) =>
  typeof value === 'string' &&
  !isRollRangeValue(value) &&
  (/[\\/]/.test(value) || /\.(dbr|tex|msh|arc|tpl|wav|mp3)$/i.test(value))

const hiddenStatLabels = new Set([
  'templateName',
  'artifactFormulaBitmapName',
  'artifactName',
  'baseTexture',
  'bitmap',
  'randomizerName',
  'actorHeight',
  'actorRadius',
  'allowTransparency',
  'cannotPickUp',
  'cannotPickUpMultiple',
  'castsShadows',
  'dexterityRequirement',
  'intelligenceRequirement',
  'forcedRelicCompletion',
  'artifactCreateQuantity',
  'itemLevel',
])

type ItemCardProps = {
  item: Item
}

function ItemCard({ item }: ItemCardProps) {
  const rarityClass = `rarity-${item.rarity.toLowerCase()}`
  const visibleStats = item.attributes?.length
    ? item.attributes.filter(({ label, value }) => !hiddenStatLabels.has(label) && !isPathValue(value))
    : Object.entries(item.stats ?? {})
        .filter(([label, value]) => !hiddenStatLabels.has(label) && !isPathValue(value))
        .slice(0, 8)
        .map(([label, value]) => ({ label, value }))
  const primaryStats = visibleStats.filter(({ value }) => !String(value).startsWith('+'))
  const bonusStats = visibleStats.filter(({ value }) => String(value).startsWith('+'))
  const typeLine =
    item.category.toLowerCase() === item.rarity.toLowerCase() ? item.category : `${item.rarity} ${item.category}`
  const requiredLevel = Number(item.stats?.levelRequirement ?? item.level)
  const itemLevel = Number(item.stats?.itemLevel ?? item.level)

  return (
    <Card
      as="article"
      size="md"
      variant="elevated"
      className={`group flex min-w-0 w-full flex-col transition-colors hover:border-neutral-600 hover:bg-neutral-900 ${rarityClass}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-800 bg-neutral-950 p-2">
          <img
            src={item.image}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="line-clamp-2 text-[0.92rem] font-medium leading-tight text-neutral-50">{item.name}</h3>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-[0.7rem] italic leading-snug text-neutral-500">
              &ldquo;{item.description}&rdquo;
            </p>
          )}
          <span className="mt-1 block truncate text-xs text-orange-300">{typeLine}</span>
          {primaryStats.length > 0 && (
            <div className="mt-2">
              {primaryStats.map(({ label, value }) => (
                <p className="truncate text-[0.78rem] text-neutral-400" key={label}>
                  <strong>{value}</strong> {label}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      {bonusStats.length > 0 && (
        <div className="mt-3">
          {bonusStats.map(({ label, value }) => (
            <p className="truncate text-[0.78rem] text-neutral-400" key={label}>
              <span className="text-white">{value}</span> {label}
            </p>
          ))}
        </div>
      )}
      <div className="mt-auto space-y-0.5 border-t border-neutral-800 pt-3 text-[0.72rem] leading-snug text-neutral-500">
        <p className="m-0">
          Required Level: <strong>{requiredLevel}</strong>
        </p>
        <p className="m-0">
          Item Level: <strong>{itemLevel}</strong>
        </p>
      </div>
      {item.grantedSkill && (
        <div className="mt-3 border-t border-neutral-800 pt-3">
          <p className="m-0 text-xs text-neutral-400">
            <strong>{item.grantedSkill.name}</strong> (Level {item.grantedSkill.level})
          </p>
          {item.grantedSkill.description && (
            <p className="mt-1 text-[0.7rem] italic leading-snug text-neutral-500">{item.grantedSkill.description}</p>
          )}
          {item.grantedSkill.attributes.length > 0 && (
            <div className="mt-2">
              {item.grantedSkill.attributes.map(({ label, value }) => (
                <p className="truncate text-[0.78rem] leading-snug text-orange-200" key={label}>
                  <strong>{value}</strong> {label}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default ItemCard
