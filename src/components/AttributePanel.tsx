import { IconMinus, IconPlus } from '@tabler/icons-react'
import { Card } from '@/components/Card'
import type { Character } from '@/domain/hero/types'
import { BASE_ATTRIBUTE_VALUE, ATTRIBUTE_POINT_VALUE } from '@/domain/hero/hero.utils'

type AttributePanelProps = {
  character: Character
  onAttributeChange: (field: 'physique' | 'cunning' | 'spirit', delta: number) => void
}

const ATTRIBUTES = ['physique', 'cunning', 'spirit'] as const

function AttributePanel({ character, onAttributeChange }: AttributePanelProps) {
  const spentPoints =
    (character.physique + character.cunning + character.spirit - BASE_ATTRIBUTE_VALUE * 3) / ATTRIBUTE_POINT_VALUE
  const remaining = character.level - spentPoints

  return (
    <Card as="aside" size="md" variant="filled" className="lg:sticky lg:top-4">
      <p className="mb-1 text-xs uppercase tracking-[0.16em] text-orange-300">Character</p>
      <h2 className="mb-5 text-lg font-medium text-neutral-50">Attributes</h2>
      <div className="grid gap-4">
        <p className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-neutral-500">
          <span>Attribute points</span>
          <strong className="text-sm font-medium normal-case tracking-normal text-neutral-300">{remaining}</strong>
        </p>
        {ATTRIBUTES.map((field) => (
          <div className="grid gap-1.5 text-xs capitalize text-neutral-500" key={field}>
            <span className="flex items-center justify-between">
              {field}
              <strong className="text-sm font-medium normal-case tracking-normal text-neutral-100">
                {character[field]}
              </strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                className="flex size-8 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-sm font-semibold text-neutral-300 transition-colors hover:border-orange-300/60 hover:bg-neutral-800 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50 active:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-900 disabled:hover:text-neutral-300"
                type="button"
                disabled={character[field] <= BASE_ATTRIBUTE_VALUE}
                onClick={() => onAttributeChange(field, -1)}
                aria-label={`Decrease ${field}`}
              >
                <IconMinus size={20} stroke={2.2} aria-hidden="true" />
              </button>
              <button
                className="flex size-8 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-sm font-semibold text-neutral-300 transition-colors hover:border-orange-300/60 hover:bg-neutral-800 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50 active:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-900 disabled:hover:text-neutral-300"
                type="button"
                disabled={remaining <= 0}
                onClick={() => onAttributeChange(field, 1)}
                aria-label={`Increase ${field}`}
              >
                <IconPlus size={20} stroke={2.2} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default AttributePanel
