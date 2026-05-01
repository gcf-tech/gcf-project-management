export function formatTime(seconds: number): string;
export function formatTimeCompact(seconds: number): string;
export function formatDate(date: string): string;
export function formatLogDate(date: string): string;
export function formatRelativeTime(date: string): string;
export function formatTimeOfDay(date: string): string;
export function isOverdue(deadline?: string | null): boolean;
export function getActivityTypeLabel(type?: string | null): string;
export function generateId(prefix: string): string;
