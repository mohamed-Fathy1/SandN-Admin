import { ApiError } from './axios';

export function isNotFoundError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.statusCode === 404;
}
