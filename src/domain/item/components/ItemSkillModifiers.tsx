import { useState } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import type { ItemSkillDetails } from '@/domain/item/types'

type ItemSkillModifiersProps = {
  modifiers: ItemSkillDetails[]
}

function ItemSkillModifiers({ modifiers }: ItemSkillModifiersProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-3 border-t border-neutral-800 pt-3">
      <button
        className="group flex w-full items-center justify-between gap-2 text-left"
        type="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} skill modifiers`}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="m-0 text-xs font-bold text-neutral-400">
          Skill Modifiers ({modifiers.length})
        </span>
        <span className="flex size-6 shrink-0 items-center justify-center rounded text-neutral-500 group-hover:bg-neutral-900 group-hover:text-neutral-200">
          {expanded ? <IconChevronUp size={15} stroke={2} aria-hidden="true" /> : <IconChevronDown size={15} stroke={2} aria-hidden="true" />}
        </span>
      </button>
      {expanded && (
        <div className="grid gap-2">
          {modifiers.map((modifier) => (
            <div className="mt-3 flex items-start gap-2" key={`${modifier.name}-${modifier.level}`}>
              {modifier.icon && <img className="size-5 shrink-0 rounded object-cover" src={modifier.icon} alt="" />}
              <div className="min-w-0">
                <p className="m-0 truncate text-xs text-neutral-200">{modifier.name}</p>
                {modifier.attributes.length > 0 && (
                  <div className="mt-1">
                    {modifier.attributes.map(({ label, value }, index) => (
                      <p className="truncate text-[0.78rem] leading-snug text-neutral-400" key={`${label}-${value}-${index}`}>
                        <strong>{value}</strong> {label}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ItemSkillModifiers
