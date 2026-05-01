import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient.js';
import { BoardColumn } from './components/BoardColumn.js';
import type { ColumnKey } from './types.js';

const BOARD_COLUMNS = [
  { id: 'columnActivelyWorking', key: 'actively-working' as ColumnKey },
  { id: 'columnWorkingNow', key: 'working-now' as ColumnKey },
  { id: 'columnActivities', key: 'activities' as ColumnKey },
] as const;

/** Map from element id → React root; populated once on first call. */
const _roots = new Map<string, ReturnType<typeof createRoot>>();

/**
 * Mount a `<BoardColumn>` React tree inside each `.column-body` container.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function mountBoardColumns(): void {
  for (const { id, key } of BOARD_COLUMNS) {
    if (_roots.has(id)) continue;

    const el = document.getElementById(id);
    if (!el) continue;

    const root = createRoot(el);
    _roots.set(id, root);

    root.render(
      <QueryClientProvider client={queryClient}>
        <BoardColumn columnKey={key} />
      </QueryClientProvider>,
    );
  }
}
