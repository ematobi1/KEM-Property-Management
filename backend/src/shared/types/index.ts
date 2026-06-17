import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthPayload {
  userId: string;
  propertyId: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthPayload;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  data: T;
}
