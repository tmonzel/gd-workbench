import { IconMinus, IconPlus } from '@tabler/icons-react'

type LevelProgressControlProps = {
  level: number
  onLevelChange: (delta: number) => void
}

function LevelProgressControl({ level, onLevelChange }: LevelProgressControlProps) {
  return (
    <div className="mb-5" aria-label={`Character level ${level} of 100`}>
      <div className="mb-2 flex items-end justify-between text-lg text-neutral-500">
        <strong className="font-medium text-neutral-200">
          <span>{level}</span> <span className="text-neutral-600 text-md">/ 100</span>{' '}
        </strong>
        <span className="flex items-center gap-2">
          <button
            className="flex size-10 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-neutral-300 transition-colors hover:border-orange-300/60 hover:bg-neutral-800 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50 active:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-900 disabled:hover:text-neutral-300"
            type="button"
            disabled={level <= 1}
            onClick={() => onLevelChange(-1)}
            aria-label="Decrease character level"
          >
            <IconMinus size={24} stroke={2.2} aria-hidden="true" />
          </button>
          <button
            className="flex size-10 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-neutral-300 transition-colors hover:border-orange-300/60 hover:bg-neutral-800 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50 active:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-900 disabled:hover:text-neutral-300"
            type="button"
            disabled={level >= 100}
            onClick={() => onLevelChange(1)}
            aria-label="Increase character level"
          >
            <IconPlus size={24} stroke={2.2} aria-hidden="true" />
          </button>
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-neutral-200 shadow-[0_0_12px_rgb(252_211_77/0.55)] transition-[width] duration-200"
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  )
}

export default LevelProgressControl
