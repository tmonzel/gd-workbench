import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { useState, type ReactNode } from 'react'
import { Card } from '@/components/Card'

type CollapsiblePanelProps = {
  eyebrow: string
  title: string
  children: ReactNode
}

function CollapsiblePanel({ eyebrow, title, children }: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card as="aside" size="md" variant="filled" className="w-full min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">{eyebrow}</p>
          <h2 className="text-xl font-medium text-neutral-50">{title}</h2>
        </div>
        <button
          className="flex shrink-0 items-center justify-center text-neutral-500 transition-colors hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50"
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
