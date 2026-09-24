import { useState } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import type { ItemSkillDetails } from '@/domain/item/types'

type ItemGrantedSkillProps = {
  skill: ItemSkillDetails
}

function ItemGrantedSkill({ skill }: ItemGrantedSkillProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-neutral-400">
          {skill.icon && <img className="size-5 shrink-0 rounded object-cover" src={skill.icon} alt="" />}
          <p className="m-0 truncate">
          <strong>{skill.name}</strong> (Level {skill.level})
          </p>
        </div>
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
                <p className="truncate text-[0.78rem] leading-snug text-neutral-400" key={`${label}-${value}-${index}`}>
                  <span className="text-neutral-200">{value}</span> {label}
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
