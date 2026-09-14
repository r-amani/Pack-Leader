import { Response } from 'express';
import { IApiResponse } from '@packleader/shared';

/**
 * Send a standardized success response.
 */
export function sendSuccess<T>(res: Response, data?: T, message?: string, statusCode = 200): void {
  const response: IApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
}

/**
 * Send a standardized error response.
 */
export function sendError(res: Response, error: string, statusCode = 500): void {
  const response: IApiResponse = {
    success: false,
    error,
  };
  res.status(statusCode).json(response);
}

/**
 * Send a standardized paginated response.
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): void {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
