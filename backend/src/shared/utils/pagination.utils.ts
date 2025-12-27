/**
 * Pagination utilities for consistent cursor-based pagination across services
 */

export interface PaginationQueryDto {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
  total: number;
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

/**
 * Build cursor-based pagination query for Prisma
 */
export function buildCursorQuery(cursor?: string) {
  return cursor ? { cursor: { id: cursor }, skip: 1 } : {};
}

/**
 * Process paginated results and extract pagination metadata
 */
export function processPaginatedResults<T extends { id: string }>(
  items: T[],
  limit: number,
): {
  items: T[];
  hasNextPage: boolean;
  nextCursor: string | null;
} {
  const hasNextPage = items.length > limit;
  const resultItems = hasNextPage ? items.slice(0, limit) : items;
  const nextCursor = hasNextPage ? resultItems[resultItems.length - 1].id : null;

  return {
    items: resultItems,
    hasNextPage,
    nextCursor,
  };
}

/**
 * Get validated limit with defaults and max constraints
 */
export function getValidatedLimit(
  requestedLimit?: number,
  defaultLimit = 20,
  maxLimit = 100,
): number {
  if (!requestedLimit) return defaultLimit;
  return Math.min(requestedLimit, maxLimit);
}

/**
 * Complete pagination helper that combines all utilities
 */
export async function paginate<T extends { id: string }>(
  query: PaginationQueryDto,
  fetchFn: (take: number, cursor: any) => Promise<T[]>,
  countFn: () => Promise<number>,
  options?: PaginationOptions,
): Promise<PaginatedResponse<T>> {
  const limit = getValidatedLimit(
    query.limit,
    options?.defaultLimit,
    options?.maxLimit,
  );
  const cursorQuery = buildCursorQuery(query.cursor);

  // Fetch one extra item to check if there's a next page
  const items = await fetchFn(limit + 1, cursorQuery);
  const { items: resultItems, hasNextPage, nextCursor } = processPaginatedResults(items, limit);
  const total = await countFn();

  return {
    items: resultItems,
    nextCursor,
    hasNextPage,
    total,
  };
}
