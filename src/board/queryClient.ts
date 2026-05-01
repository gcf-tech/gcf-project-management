import { QueryClient } from '@tanstack/react-query';
import { computeActiveCounts } from './boardApi.js';
// @ts-ignore – vanilla JS module
import { updateKPIs } from '../kpi/kpi.js';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Invalidate all active board queries and refresh DOM counters + KPIs. */
export function refetchBoard(): void {
  _updateDOMCounts();
  updateKPIs();
  queryClient.invalidateQueries({ queryKey: ['board'], refetchType: 'active' });
}

/**
 * Invalidate only the source and destination column queries after a drag-drop.
 * Also updates DOM counters and KPIs synchronously.
 */
export function refetchColumns(sourceKey: string, targetKey: string): void {
  _updateDOMCounts();
  updateKPIs();

  for (const colKey of [sourceKey, targetKey]) {
    queryClient.invalidateQueries({
      queryKey: ['board', 'active', colKey],
      refetchType: 'active',
    });
    queryClient.invalidateQueries({
      queryKey: ['board', 'completed', colKey],
      refetchType: 'active',
    });
  }
}

function _updateDOMCounts(): void {
  const counts = computeActiveCounts();
  const map: Record<string, string> = {
    'actively-working': 'countActivelyWorking',
    'working-now': 'countWorkingNow',
    activities: 'countActivities',
  };
  for (const [col, elId] of Object.entries(map)) {
    const el = document.getElementById(elId);
    if (el) el.textContent = String(counts[col as keyof typeof counts] ?? 0);
  }
}
