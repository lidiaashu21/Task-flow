export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OffsetPagination {
  page: number;
  limit: number;
  offset: number;
}

export function getPagination({ page, limit }: PaginationParams): OffsetPagination {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
