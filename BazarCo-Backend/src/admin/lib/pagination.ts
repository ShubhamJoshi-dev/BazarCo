export type PaginationParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
};

export function parsePagination(query: Record<string, unknown>, defaults?: { limit?: number }) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || defaults?.limit || 20));
  const sort = typeof query.sort === "string" && query.sort.trim() ? query.sort.trim() : "createdAt";
  const order: 1 | -1 = query.order === "asc" ? 1 : -1;
  const skip = (page - 1) * limit;
  return { page, limit, sort, order, skip };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
