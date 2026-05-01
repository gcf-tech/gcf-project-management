import type { Task, ColumnKey, PaginatedResponse } from './types.js';
import { STATE } from './stateBridge.js';
// @ts-ignore – vanilla JS module; types declared in column-sort.d.ts
import { sortItems } from './column-sort.js';

const VALID_COLUMNS = new Set<string>(['actively-working', 'working-now', 'activities']);
const ACCORDION_COLUMNS = new Set<string>(['actively-working', 'activities']);

function resolveColumn(task: Task): ColumnKey {
  return (VALID_COLUMNS.has(task.column) ? task.column : 'actively-working') as ColumnKey;
}

function isCompletedTask(task: Task): boolean {
  return task.type === 'activity' ? task.progress === 100 : task.column === 'completed';
}

/** Active (non-completed) tasks for a column, sorted per user preference. */
export function getActiveTasks(columnKey: ColumnKey): Task[] {
  const tasks = STATE.tasks;

  const active = tasks.filter((task) => {
    const col = resolveColumn(task);
    if (col !== columnKey) return false;
    if (ACCORDION_COLUMNS.has(col) && isCompletedTask(task)) return false;
    return true;
  });

  return sortItems(active, columnKey) as Task[];
}

/**
 * Completed tasks for a column with client-side cursor pagination.
 * Cursor format: base-10 offset string. Interface is forward-compatible
 * with server-side cursor pagination once the backend adds it.
 */
export function getCompletedPage(
  columnKey: ColumnKey,
  cursor: string | null,
  limit: number,
): PaginatedResponse<Task> {
  const tasks = STATE.tasks;

  const all = tasks
    .filter((task) => {
      if (!ACCORDION_COLUMNS.has(columnKey)) return false;
      const col = resolveColumn(task);
      return col === columnKey && isCompletedTask(task);
    });

  const completedKey = `${columnKey}-completed`;
  const sorted = sortItems(all, completedKey) as Task[];

  const offset = cursor !== null ? parseInt(cursor, 10) : 0;
  const items = sorted.slice(offset, offset + limit);
  const newOffset = offset + items.length;

  return {
    items,
    next_cursor: newOffset < sorted.length ? String(newOffset) : null,
    has_more: newOffset < sorted.length,
    total: sorted.length,
  };
}

/** Total task count (active + completed) for a column — used for empty-state detection. */
export function getColumnTaskCount(columnKey: ColumnKey): number {
  return STATE.tasks.filter((task) => resolveColumn(task) === columnKey).length;
}

/** Count completed tasks for a column (used for accordion header label). */
export function getCompletedCount(columnKey: ColumnKey): number {
  const tasks = STATE.tasks;
  return tasks.filter((task) => {
    const col = resolveColumn(task);
    return col === columnKey && isCompletedTask(task);
  }).length;
}

/** Synchronously compute active counts for all three columns (for KPI updates). */
export function computeActiveCounts(): Record<ColumnKey, number> {
  const counts: Record<ColumnKey, number> = {
    'actively-working': 0,
    'working-now': 0,
    activities: 0,
  };

  for (const task of STATE.tasks) {
    const col = resolveColumn(task);
    if (!ACCORDION_COLUMNS.has(col) || !isCompletedTask(task)) {
      counts[col]++;
    }
  }

  return counts;
}
