import { z } from 'zod';
import { PaginatedResult } from '../types';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export function paginate<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export function paginationArgs(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}
