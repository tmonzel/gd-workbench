import { useState } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import type { ItemSet } from '@/domain/item/types'

type ItemSetInfoProps = {
  set: ItemSet
  equippedCount: number
}

function ItemSetInfo({ set, equippedCount }: ItemSetInfoProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-3 border-t border-neutral-800 pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-xs text-neutral-400">
          <strong className="text-neutral-200">{set.name}</strong> Set ({equippedCount}/{set.members.length})
        </p>
        <button
          className="flex size-6 shrink-0 items-center justify-center rounded text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
          type="button"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${set.name} set bonuses`}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? <IconChevronUp size={15} stroke={2} aria-hidden="true" /> : <IconChevronDown size={15} stroke={2} aria-hidden="true" />}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 grid gap-1.5">
          {set.bonuses.map((tier) => {
            const active = equippedCount >= tier.count
            const bonuses = [
              ...tier.attributes.map((attribute) => `${attribute.value} ${attribute.label}`),
              tier.skill && `Skill: ${tier.skill.name}`,
            ].filter(Boolean)
            return (
              <div
                className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 rounded border px-2 py-1.5 ${
                  active ? 'border-orange-300/25 bg-orange-300/5' : 'border-neutral-800 bg-neutral-950/30'
                }`}
                key={tier.count}
              >
                <span
                  className={`pt-0.5 text-[0.62rem] font-medium uppercase tracking-[0.08em] ${
                    active ? 'text-orange-200' : 'text-neutral-600'
                  }`}
                >
                  {tier.count} pieces
                </span>
                <div className={`grid gap-0.5 text-[0.72rem] leading-snug ${active ? 'text-orange-100' : 'text-neutral-600'}`}>
                  {bonuses.map((bonus) => (
                    <span key={bonus}>{bonus}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ItemSetInfo
