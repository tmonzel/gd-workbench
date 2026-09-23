import { useState } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import type { Item } from '@/domain/item/types'

type ItemGrantedSkillProps = {
  skill: NonNullable<Item['grantedSkill']>
}

function ItemGrantedSkill({ skill }: ItemGrantedSkillProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-3 border-t border-neutral-800 pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-xs text-neutral-400">
          <strong>{skill.name}</strong> (Level {skill.level})
        </p>
        <button
          className="flex size-6 shrink-0 items-center justify-center rounded text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
          type="button"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${skill.name} details`}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? <IconChevronUp size={15} stroke={2} aria-hidden="true" /> : <IconChevronDown size={15} stroke={2} aria-hidden="true" />}
        </button>
      </div>
      {expanded && (
        <>
          {skill.description && <p className="mt-1 text-[0.7rem] italic leading-snug text-neutral-500">{skill.description}</p>}
          {skill.attributes.length > 0 && (
            <div className="mt-2">
              {skill.attributes.map(({ label, value }, index) => (
                <p className="truncate text-[0.78rem] leading-snug text-orange-200" key={`${label}-${value}-${index}`}>
                  <strong>{value}</strong> {label}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ItemGrantedSkill
