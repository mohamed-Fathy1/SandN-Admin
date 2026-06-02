import { useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Thumbnail } from '@/designs/shared';
import type { ApiCategory, ApiGroup } from '@/shared/types/api';
import { toLocalized } from '@/shared/utils/bilingual';
import { formatGroupName } from '@/shared/utils/format';
import { idOf } from '@/shared/utils/relations';
import { cn } from '@/shared/utils/cn';

interface SortableCategoryListProps {
  items: ApiCategory[];
  onReorder: (next: ApiCategory[]) => void;
  groups: ApiGroup[];
  disabled?: boolean;
}

export function SortableCategoryList({
  items,
  onReorder,
  groups,
  disabled,
}: SortableCategoryListProps) {
  // Constraint of 5px prevents accidental drags on iOS Safari taps.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const groupNameById = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach((g) => map.set(g._id, formatGroupName(g.name)));
    return map;
  }, [groups]);

  const ids = useMemo(() => items.map((c) => c._id), [items]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {items.map((c, index) => (
            <SortableRow
              key={c._id}
              category={c}
              displayOrder={index}
              groupName={groupNameById.get(idOf(c.groupSize)) ?? '—'}
              disabled={disabled}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

interface SortableRowProps {
  category: ApiCategory;
  displayOrder: number;
  groupName: string;
  disabled?: boolean;
}

function SortableRow({ category, displayOrder, groupName, disabled }: SortableRowProps) {
  const { t } = useTranslation('catalog');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category._id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const localizedName = toLocalized(category.name);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card p-3',
        isDragging && 'z-10 border-accent shadow-lg',
        disabled && 'opacity-60'
      )}
    >
      <button
        type="button"
        aria-label={t('categories.aria.dragHandle', { name: localizedName })}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground',
          'touch-none select-none',
          disabled ? 'cursor-not-allowed' : 'cursor-grab hover:bg-muted active:cursor-grabbing'
        )}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} strokeWidth={1.5} aria-hidden />
      </button>

      <span className="w-8 shrink-0 text-center text-xs font-medium tabular-nums text-light-foreground">
        {displayOrder}
      </span>

      <Thumbnail src={category.image?.mediaUrl} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{localizedName}</p>
        <p
          dir="rtl"
          className="truncate font-body-ar text-xs text-muted-foreground"
          title={category.name.ar}
        >
          {category.name.ar}
        </p>
      </div>

      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{groupName}</span>
    </li>
  );
}
