import { getVisibleItemStats } from '@/domain/item/components/item-stats.utils'

type ItemPrimaryStatsProps = {
  attributes?: Array<{ label: string; value: string | number }>
  stats?: Record<string, string | number>
}

function ItemPrimaryStats({ attributes, stats }: ItemPrimaryStatsProps) {
  const primaryStats = getVisibleItemStats(attributes, stats).filter(({ value }) => !String(value).startsWith('+'))
  if (!primaryStats.length) return null

  return (
    <div className="mt-2">
      {primaryStats.map(({ label, value }, index) => (
        <p className="truncate text-[0.78rem] text-neutral-400" key={`${label}-${value}-${index}`}>
          <strong>{value}</strong> {label}
        </p>
      ))}
    </div>
  )
}

export default ItemPrimaryStats
