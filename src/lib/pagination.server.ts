/**
 * Pagination utilities for API endpoints
 */

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface PaginatedResponse<T> {
  data: Array<T>
  pagination: PaginationMeta
}

/**
 * Parse pagination parameters from URL search params
 * @param url - URL object with search params
 * @param defaultLimit - Default items per page (default: 20)
 * @param maxLimit - Maximum items per page (default: 100)
 * @returns PaginationParams with validated page and limit
 */
export function parsePaginationParams(
  url: URL,
  defaultLimit = 20,
  maxLimit = 100,
): PaginationParams {
  const pageParam = url.searchParams.get('page')
  const limitParam = url.searchParams.get('limit')

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1
  const limit = limitParam
    ? Math.min(maxLimit, Math.max(1, parseInt(limitParam, 10)))
    : defaultLimit

  return { page, limit }
}

/**
 * Calculate pagination metadata
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns PaginationMeta object
 */
function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore,
  }
}

/**
 * Create a paginated response
 * @param data - Array of items for current page
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns PaginatedResponse object
 */
export function createPaginatedResponse<T>(
  data: Array<T>,
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    pagination: calculatePaginationMeta(total, page, limit),
  }
}
