import LevelProgressControl from '@/components/LevelProgressControl'
import { IconChevronDown, IconMinus, IconPlus } from '@tabler/icons-react'
import { DIFFICULTY_MODES, type DifficultyMode } from '@/domain/hero/difficulty'
import type { Character } from '@/domain/hero/types'
import { ATTRIBUTE_POINT_VALUE, BASE_ATTRIBUTE_VALUE } from '@/domain/hero/hero.utils'

type HeaderProps = {
  level: number
  onLevelChange: (delta: number) => void
  combinedClassName?: string
  difficulty: DifficultyMode
  onDifficultyChange: (difficulty: DifficultyMode) => void
  character: Character
  onAttributeChange: (field: 'physique' | 'cunning' | 'spirit', delta: number) => void
}

function Header({
  level,
  onLevelChange,
  combinedClassName,
  difficulty,
  onDifficultyChange,
  character,
  onAttributeChange,
}: HeaderProps) {
  const attributes = ['physique', 'cunning', 'spirit'] as const
  const spentPoints =
    (character.physique + character.cunning + character.spirit - BASE_ATTRIBUTE_VALUE * 3) / ATTRIBUTE_POINT_VALUE
  const remainingPoints = character.level - spentPoints

  return (
    <header>
      <div className="-mx-4 flex flex-wrap items-center justify-end gap-2 px-4 py-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
        <span className="flex items-center gap-2 text-[0.68rem] text-neutral-600">
          GD Workbench <span className="size-1 rounded-full bg-neutral-600" aria-hidden="true" /> Game Version 1.3.0.8
        </span>
      </div>
      <section className="flex flex-wrap items-end justify-between gap-x-16 gap-y-4 py-4">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.16em] text-neutral-500">Hero class</p>
          <h1 className="text-4xl font-medium tracking-tight text-neutral-50">
            {combinedClassName ?? 'Choose a mastery'}
          </h1>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <span className="relative grid justify-items-start gap-1 px-2 py-1">
            {/* <span className="text-neutral-500">Difficulty</span> */}
            <select
              className="w-auto appearance-none rounded-md border border-neutral-700 bg-neutral-900 py-2.5 pl-4 pr-9 text-lg text-neutral-200 outline-none focus:border-orange-300"
              value={difficulty}
              onChange={(event) => onDifficultyChange(event.target.value as DifficultyMode)}
              aria-label="Difficulty"
            >
              {DIFFICULTY_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
            <IconChevronDown
              className="pointer-events-none absolute bottom-5 right-5 text-neutral-500"
              size={16}
              stroke={2}
              aria-hidden="true"
            />
          </span>
          <span></span>
          <span></span>
          <span></span>
          {/* <span className="mr-1 pb-1 text-[0.65rem] text-neutral-500" title="Unspent attribute points">
            {remainingPoints} points left
          </span> */}
          {attributes.map((field) => (
            <div className="flex items-end gap-1 px-2 py-1" key={field}>
              <div className="grid justify-items-start leading-none">
                <span className="capitalize text-neutral-500">{field}</span>
                <strong className="mt-1 text-2xl font-medium tabular-nums text-neutral-100">{character[field]}</strong>
              </div>
              <div className="ml-1 flex gap-0.5 pb-0.5">
                <button
                  className="flex size-6 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-30"
                  type="button"
                  disabled={character[field] <= BASE_ATTRIBUTE_VALUE}
                  onClick={() => onAttributeChange(field, -1)}
                  aria-label={`Decrease ${field}`}
                >
                  <IconMinus size={14} stroke={2.2} aria-hidden="true" />
                </button>
                <button
                  className="flex size-6 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-30"
                  type="button"
                  disabled={remainingPoints <= 0}
                  onClick={() => onAttributeChange(field, 1)}
                  aria-label={`Increase ${field}`}
                >
                  <IconPlus size={14} stroke={2.2} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <LevelProgressControl level={level} onLevelChange={onLevelChange} />
    </header>
  )
}

export default Header
