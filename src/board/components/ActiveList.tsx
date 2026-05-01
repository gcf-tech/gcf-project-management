import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ColumnKey, Task } from '../types.js';
import { getActiveTasks } from '../boardApi.js';
import { TaskCard } from './TaskCard.js';

/** Estimated card height in px — virtualizer refines this via measureElement. */
const ESTIMATED_ITEM_HEIGHT = 170;

interface Props {
  columnKey: ColumnKey;
  onCountChange: (count: number) => void;
}

export function ActiveList({ columnKey, onCountChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['board', 'active', columnKey],
    queryFn: () => getActiveTasks(columnKey),
    staleTime: 0,
  });

  // Notify parent of count changes so it can show/hide the column empty-state
  const prevCount = useRef(-1);
  if (tasks.length !== prevCount.current) {
    prevCount.current = tasks.length;
    // Use a microtask to avoid setState-during-render
    Promise.resolve().then(() => onCountChange(tasks.length));
  }

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT,
    overscan: 3,
    gap: 12,
  });

  if (isLoading) {
    return (
      <div className="infinite-list-skeleton" aria-busy="true" aria-label="Cargando…">
        <div className="task-card-skeleton" />
        <div className="task-card-skeleton" />
        <div className="task-card-skeleton" />
      </div>
    );
  }

  if (tasks.length === 0) return null;

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={containerRef}
      className="active-list-scroller"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((vItem) => {
          const task = tasks[vItem.index];
          if (!task) return null;
          return (
            <div
              key={vItem.key}
              data-index={vItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vItem.start}px)`,
              }}
            >
              <TaskCard task={task} isCompleted={false} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
