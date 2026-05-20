import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { categoryHandlers } from './handlers/categories';
import { s3Handlers } from './handlers/s3';

export const server = setupServer(...authHandlers, ...categoryHandlers, ...s3Handlers);
