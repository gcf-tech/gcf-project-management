import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnKey, Task } from '../types.js';
import { getCompletedPage, getCompletedCount } from '../boardApi.js';
import { ActiveList } from './ActiveList.js';
import { InfiniteList } from './InfiniteList.js';
import { TaskCard } from './TaskCard.js';

/** Columns that support a completed-tasks infinite-scroll section. */
const ACCORDION_COLUMNS = new Set<ColumnKey>(['actively-working', 'activities']);

const COMPLETED_LIMIT = 50;

interface Props {
  columnKey: ColumnKey;
}

export function BoardColumn({ columnKey }: Props) {
  const [activeCount, setActiveCount] = useState(0);
  const [completedOpen, setCompletedOpen] = useState(false);

  const hasCompletedSection = ACCORDION_COLUMNS.has(columnKey);

  // Completed count drives the accordion header label and empty-state logic.
  // Invalidated alongside other board queries via the ['board'] prefix.
  const { data: completedCount = 0 } = useQuery<number>({
    queryKey: ['board', 'completed-count', columnKey],
    queryFn: () => getCompletedCount(columnKey),
    staleTime: 0,
    enabled: hasCompletedSection,
  });

  const handleActiveCount = useCallback((count: number) => {
    setActiveCount(count);
  }, []);

  const completedQueryKey = ['board', 'completed', columnKey] as const;
  const completedFetcher = useCallback(
    (cursor: string | null) => getCompletedPage(columnKey, cursor, COMPLETED_LIMIT),
    [columnKey],
  );

  const renderCompletedItem = useCallback(
    (task: Task, i: number) => <TaskCard key={task.id ?? i} task={task} isCompleted />,
    [],
  );

  const totalCount = activeCount + (hasCompletedSection ? completedCount : 0);

  return (
    <>
      {/* Virtualized active list */}
      <ActiveList columnKey={columnKey} onCountChange={handleActiveCount} />

      {/* Completed section: collapsible with infinite scroll */}
      {hasCompletedSection && completedCount > 0 && (
        <div
          className={`completed-accordion${completedOpen ? ' open' : ''}`}
          aria-expanded={completedOpen}
        >
          <div className="completed-accordion-header">
            <button
              type="button"
              className="completed-accordion-toggle"
              onClick={() => setCompletedOpen((v) => !v)}
              aria-expanded={completedOpen}
              aria-controls={`completed-body-${columnKey}`}
            >
              <span>
                <i className="fas fa-check-circle" aria-hidden="true" /> Completadas ({completedCount})
              </span>
              <i
                className="fas fa-chevron-down completed-accordion-chevron"
                aria-hidden="true"
              />
            </button>
          </div>

          {completedOpen && (
            <div
              id={`completed-body-${columnKey}`}
              className="completed-accordion-body completed-accordion-body--open"
            >
              <InfiniteList
                queryKey={completedQueryKey}
                fetcher={completedFetcher}
                renderItem={renderCompletedItem}
              />
            </div>
          )}
        </div>
      )}

      {/* Empty state — only when the column has no tasks at all */}
      {totalCount === 0 && (
        <div className="column-empty">
          <i className="fas fa-inbox" aria-hidden="true" />
          <p>Drag tasks here</p>
        </div>
      )}
    </>
  );
}
