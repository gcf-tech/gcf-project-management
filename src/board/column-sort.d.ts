export interface SortState {
  criterion: string;
  direction: 'asc' | 'desc';
}

export const CRITERIA_ACTIVE: string[];
export const CRITERIA_COMPLETED: string[];

export function sortItems(items: unknown[], colKey: string): unknown[];
export function getSort(colKey: string): SortState;
export function setSort(colKey: string, sort: SortState): void;
export function resetSort(colKey: string): void;
export function isDefaultSort(colKey: string, sort: SortState): boolean;
