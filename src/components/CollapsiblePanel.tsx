import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useState, type ReactNode } from 'react'
import { Card } from './Card'

type CollapsiblePanelProps = {
  eyebrow: string
  title: string
  children: ReactNode
}

function CollapsiblePanel({ eyebrow, title, children }: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card as="aside" size="lg" variant="filled" className="w-full min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">{eyebrow}</p>
          <h2 className="text-xl font-medium text-neutral-50">{title}</h2>
        </div>
        <button
          className="flex size-8 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-neutral-300 transition-colors hover:border-orange-300/60 hover:bg-neutral-800 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50"
          type="button"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? (
            <IconChevronUp size={18} stroke={2} aria-hidden="true" />
          ) : (
            <IconChevronDown size={18} stroke={2} aria-hidden="true" />
          )}
        </button>
      </div>
      {expanded && <div className="mt-5">{children}</div>}
    </Card>
  )
}

export default CollapsiblePanel
