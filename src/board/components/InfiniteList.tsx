import React, { useEffect, useRef } from 'react';
import { useInfiniteList } from '../hooks/useInfiniteList.js';
import type { PaginatedResponse } from '../types.js';

/** Auto-load sentinel count before switching to explicit "load more" button. */
const AUTO_LOAD_PAGES = 3;

export interface InfiniteListProps<T> {
  queryKey: readonly unknown[];
  fetcher: (cursor: string | null) => PaginatedResponse<T> | Promise<PaginatedResponse<T>>;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
}

export function InfiniteList<T>({
  queryKey,
  fetcher,
  renderItem,
  emptyState,
}: InfiniteListProps<T>) {
  const {
    items,
    pagesLoaded,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteList<T>({ queryKey, fetcher });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const prevItemCount = useRef(0);

  const useAutoLoad = pagesLoaded < AUTO_LOAD_PAGES;

  // IntersectionObserver: auto-load while within first AUTO_LOAD_PAGES pages
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || !useAutoLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, useAutoLoad, isFetchingNextPage, fetchNextPage]);

  // Announce newly loaded items to screen readers
  useEffect(() => {
    if (!liveRef.current || items.length === prevItemCount.current) return;
    prevItemCount.current = items.length;
    liveRef.current.textContent = `${items.length} elementos cargados`;
  }, [items.length]);

  if (isLoading) {
    return (
      <div className="infinite-list-skeleton" aria-busy="true" aria-label="Cargando…">
        <div className="task-card-skeleton" />
        <div className="task-card-skeleton" />
        <div className="task-card-skeleton" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="infinite-list-error" role="alert">
        <span>Error al cargar: {error?.message ?? 'desconocido'}</span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => void refetch()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

  return (
    <div className="infinite-list">
      {/* Live region for screen-reader announcements */}
      <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      {items.map((item, i) => renderItem(item, i))}

      {/* Sentinel: triggers auto-load for pages 1-3 */}
      {hasNextPage && useAutoLoad && (
        <div
          ref={sentinelRef}
          className="infinite-list-sentinel"
          aria-hidden="true"
        />
      )}

      {/* After AUTO_LOAD_PAGES: explicit keyboard-focusable button */}
      {hasNextPage && !useAutoLoad && (
        <div className="infinite-list-load-more">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            aria-label="Cargar más actividades"
          >
            {isFetchingNextPage ? 'Cargando…' : 'Cargar más actividades'}
          </button>
        </div>
      )}

      {/* Next-page loading skeleton (no global spinner) */}
      {isFetchingNextPage && (
        <div className="infinite-list-skeleton" aria-busy="true" aria-label="Cargando más…">
          <div className="task-card-skeleton" />
          <div className="task-card-skeleton" />
        </div>
      )}
    </div>
  );
}
