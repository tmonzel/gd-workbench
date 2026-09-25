import { useState } from 'react'
import { IconPencil, IconSkull, IconTrash } from '@tabler/icons-react'
import { Card } from '@/components/Card'
import ItemGrantedSkill from '@/domain/item/components/ItemGrantedSkill'
import ItemPrimaryStats from '@/domain/item/components/ItemPrimaryStats'
import ItemRequirements from '@/domain/item/components/ItemRequirements'
import ItemSetInfo from '@/domain/item/components/ItemSetInfo'
import ItemSkillModifiers from '@/domain/item/components/ItemSkillModifiers'
import ItemStats from '@/domain/item/components/ItemStats'
import type { Item } from '@/domain/item/types'
import {
  getSetForItem,
  isEquippableItem,
  rarityTextClasses,
  type EquippedSetInfo,
  type ItemSet,
} from '@/domain/item/item.utils'

type ItemCardProps = {
  item: Item
  onEquip?: (item: Item) => void
  onUnequip?: (item: Item) => void
  isEquipped?: boolean
  activeSkillNames?: Set<string>
  itemSets?: ItemSet[]
  equippedSetInfo?: EquippedSetInfo[]
  compact?: boolean
  onSelect?: (item: Item) => void
  onCreateInstance?: (item: Item) => void
  onRemoveInstance?: (item: Item) => void
}

function ItemCard({
  item,
  onEquip,
  onUnequip,
  isEquipped = false,
  activeSkillNames,
  itemSets = [],
  equippedSetInfo = [],
  compact = false,
  onSelect,
  onCreateInstance,
  onRemoveInstance,
}: ItemCardProps) {
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null)
  const rarityClass = `rarity-${item.rarity.toLowerCase()}`
  const armorClassification = String(item.stats?.armorClassification ?? '')
  const itemClass = String(item.stats?.Class ?? '')
  const weaponType =
    item.category === 'Weapon'
      ? /sword/i.test(itemClass)
        ? 'Sword'
        : /axe/i.test(itemClass)
          ? 'Axe'
          : /mace/i.test(itemClass)
            ? 'Mace'
            : /dagger/i.test(itemClass)
              ? 'Dagger'
              : /scepter/i.test(itemClass)
                ? 'Scepter'
                : /spear/i.test(itemClass)
                  ? 'Spear'
                  : /ranged/i.test(itemClass)
                    ? 'Ranged'
                    : item.category
      : undefined
  const itemType =
    item.category === 'Off-Hand' && /shield/i.test(itemClass) ? 'Shield' : weaponType ?? item.category
  const typeLine = armorClassification && armorClassification !== 'Light' ? `${armorClassification} ${itemType}` : itemType
  const rarityTextClass = rarityTextClasses[item.rarity.toLowerCase()] ?? 'text-neutral-400'
  const itemLevel = Number(item.stats?.itemLevel ?? item.level)
  const itemSet = getSetForItem(item.id, itemSets)
  const equippedCount = itemSet ? (equippedSetInfo.find((info) => info.set.id === itemSet.id)?.equippedCount ?? 0) : 0

  if (compact) {
    return (
      <div
        className="group relative min-w-0"
        onMouseMove={(event) => setHoverPoint({ x: event.clientX, y: event.clientY })}
        onMouseLeave={() => setHoverPoint(null)}
      >
        <div className="flex min-h-18 items-start gap-2 rounded-md border border-neutral-800 bg-neutral-900/70 p-2 transition-colors group-hover:border-neutral-600 group-hover:bg-neutral-800/80">
          <div className="flex shrink-0 items-center justify-center overflow-hidden rounded border border-neutral-800 bg-neutral-950 p-2">
            <img src={item.image} alt="" />
          </div>
          <div className="min-w-0">
            <span
              className={`mb-1 inline-block rounded border border-current/30 px-1 py-0.5 text-[0.58rem] uppercase tracking-[0.08em] ${rarityTextClass}`}
            >
              {item.rarity}
            </span>
            <p className="truncate font-medium text-neutral-100">
              {item.qualityTag && <span>{item.qualityTag} </span>}
              {item.prefix && <span>{item.prefix} </span>}
              {item.name}
              {item.suffix && <span> {item.suffix}</span>}
            </p>
            {item.description && (
              <p className="mt-0.5 line-clamp-2 text-[0.65rem] italic leading-snug text-neutral-500">
                {item.description}
              </p>
            )}
            <p className="mt-1 truncate text-sm text-orange-300">
              {typeLine}
              {item.twoHanded && ' · Two-Handed'}
            </p>
          </div>
        </div>
        {hoverPoint && (
          <div
            className="pointer-events-none fixed z-50 w-80 rounded-lg bg-neutral-950 shadow-2xl shadow-black/60"
            style={{ left: hoverPoint.x + 16, top: hoverPoint.y + 16 }}
          >
            <ItemCard
              item={item}
              isEquipped
              activeSkillNames={activeSkillNames}
              itemSets={itemSets}
              equippedSetInfo={equippedSetInfo}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <Card
      as="article"
      size="md"
      variant="elevated"
      className={`group relative flex min-w-0 w-full flex-col transition-colors hover:border-neutral-500 hover:bg-neutral-800/60 ${isEquipped ? 'border-neutral-600! bg-neutral-700/20! shadow-[0_0_0_1px_rgb(163_163_163/0.35)] hover:bg-neutral-700/30!' : ''} ${rarityClass}`}
    >
      {item.isInstance && (onSelect || onRemoveInstance) && (
        <div className="absolute right-3 top-3 z-10 flex gap-1">
          {onSelect && isEquippableItem(item) && (
            <button
              className="flex size-7 items-center justify-center rounded border border-neutral-700 bg-neutral-950/80 text-neutral-400 hover:border-orange-300/60 hover:text-orange-100"
              type="button"
              onClick={() => onSelect(item)}
              title="Edit item"
              aria-label="Edit item"
            >
              <IconPencil size={15} stroke={1.8} aria-hidden="true" />
            </button>
          )}
          {onRemoveInstance && (
            <button
              className="flex size-7 items-center justify-center rounded border border-neutral-700 bg-neutral-950/80 text-neutral-500 hover:border-red-700 hover:text-red-300"
              type="button"
              onClick={() => onRemoveInstance(item)}
              title="Remove from Collection"
              aria-label="Remove from Collection"
            >
              <IconTrash size={15} stroke={1.8} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-start gap-3">
          <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-800 bg-neutral-950 p-2">
            <img
              src={item.image}
              alt=""
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <div className="min-w-0 pt-0.5">
            <span
              className={`mb-1 inline-block rounded border border-current/30 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.08em] ${rarityTextClass}`}
            >
              {item.rarity}
            </span>
            {item.isMonsterInfrequent && (
              <span className="ml-1 inline-flex align-middle text-orange-300" title="Monster Infrequent item">
                <IconSkull size={14} stroke={1.8} aria-label="Monster Infrequent item" />
              </span>
            )}
            <h3 className="line-clamp-2 text-[0.92rem] font-medium leading-tight text-neutral-50">
              {item.qualityTag && <span>{item.qualityTag} </span>}
              {item.prefix && <span>{item.prefix} </span>}
              {item.name}
              {item.suffix && <span> {item.suffix}</span>}
            </h3>
            {item.description && (
              <p className="mt-1 line-clamp-2 text-[0.7rem] italic leading-snug text-neutral-500">
                &ldquo;{item.description}&rdquo;
              </p>
            )}
            <span className="mt-1 block truncate text-xs text-orange-300">
              {typeLine}
              {item.twoHanded && ' · Two-Handed'}
            </span>
            {itemSet && (
              <span className="mt-1 inline-block rounded border border-neutral-600 bg-neutral-800/60 px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.08em] text-neutral-300">
                {itemSet.name} Set · {equippedCount}/{itemSet.members.length}
              </span>
            )}
            <ItemPrimaryStats attributes={item.attributes} stats={item.stats} />
          </div>
        </div>
        <ItemStats attributes={item.attributes} stats={item.stats} activeSkillNames={activeSkillNames} />
        {item.grantedSkill && (
          <ItemGrantedSkill skill={item.grantedSkill} />
        )}
        {item.specialSkillBonuses && item.specialSkillBonuses.length > 0 && (
          <ItemSkillModifiers modifiers={item.specialSkillBonuses} />
        )}
        {itemSet && (
          <ItemSetInfo set={itemSet} equippedCount={equippedCount} />
        )}
        {(item.componentImage || item.augmentImage) && (
          <div
            className="mt-3 flex items-center gap-2 border-t border-neutral-800 pt-3"
            aria-label="Applied modifications"
          >
            {item.componentImage && (
              <span
                className="flex size-10 items-center justify-center overflow-hidden rounded border border-neutral-700 bg-neutral-950 p-1"
                title="Component"
              >
                <img className="block max-h-full max-w-full object-contain" src={item.componentImage} alt="Component" />
              </span>
            )}
            {item.augmentImage && (
              <span
                className="flex size-10 items-center justify-center overflow-hidden rounded border border-neutral-700 bg-neutral-950 p-1"
                title="Augment"
              >
                <img className="block max-h-full max-w-full object-contain" src={item.augmentImage} alt="Augment" />
              </span>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 space-y-0.5 border-t border-neutral-800 pt-3 text-[0.72rem] leading-snug text-neutral-500">
        <p className="m-0">
          Item Level: <strong>{itemLevel}</strong>
        </p>
        <ItemRequirements stats={item.stats} />
      </div>
      {onEquip && item.isInstance && isEquippableItem(item) && (
        <button
          className={`mt-3 rounded-md border px-3 py-1.5 text-xs transition-colors ${isEquipped ? 'border-[#fcd34d] bg-[#fcd34d]/10 text-[#fcd34d] hover:bg-[#fcd34d]/20' : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800 hover:text-neutral-100'}`}
          type="button"
          onClick={() => (isEquipped ? onUnequip?.(item) : onEquip(item))}
        >
          {isEquipped ? 'Unequip' : 'Equip'}
        </button>
      )}
      {onCreateInstance && isEquippableItem(item) && !item.isInstance && (
        <button
          className="mt-3 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-300/60 hover:text-orange-100"
          type="button"
          onClick={() => onCreateInstance(item)}
        >
          Add to Collection
        </button>
      )}
    </Card>
  )
}

export default ItemCard
