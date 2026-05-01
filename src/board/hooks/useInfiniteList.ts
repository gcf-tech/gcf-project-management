import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { PaginatedResponse } from '../types.js';

export interface UseInfiniteListOptions<T> {
  queryKey: readonly unknown[];
  fetcher: (cursor: string | null) => PaginatedResponse<T> | Promise<PaginatedResponse<T>>;
}

export interface UseInfiniteListResult<T> {
  items: T[];
  pagesLoaded: number;
  totalItems: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useInfiniteList<T>(
  options: UseInfiniteListOptions<T>,
): UseInfiniteListResult<T> {
  const { queryKey, fetcher } = options;

  const query = useInfiniteQuery<PaginatedResponse<T>, Error>({
    queryKey,
    queryFn: ({ pageParam }) => fetcher(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  const totalItems = query.data?.pages[0]?.total ?? 0;
  const pagesLoaded = query.data?.pages.length ?? 0;

  return {
    items,
    pagesLoaded,
    totalItems,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
