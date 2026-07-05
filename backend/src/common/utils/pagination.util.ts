export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  total: number;
  page: number;
  pageSize: number;
}

export function parsePagination(query: PaginationQuery, defaultPageSize = 10) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || defaultPageSize));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    hasMore: page * pageSize < total,
    total,
    page,
    pageSize,
  };
}