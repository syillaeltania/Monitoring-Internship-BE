import assert from 'node:assert/strict';
import test from 'node:test';
import { getCorsOrigins } from '../src/nest-app.ts';

test('uses localhost origins when CORS_ORIGINS is not configured', () => {
  const previous = process.env.CORS_ORIGINS;
  delete process.env.CORS_ORIGINS;

  assert.deepEqual(getCorsOrigins(), ['http://localhost:5173', 'http://127.0.0.1:5173']);

  if (previous === undefined) delete process.env.CORS_ORIGINS;
  else process.env.CORS_ORIGINS = previous;
});

test('parses comma separated CORS origins for deployment', () => {
  const previous = process.env.CORS_ORIGINS;
  process.env.CORS_ORIGINS = 'https://monitoring.example.com, https://admin.example.com ';

  assert.deepEqual(getCorsOrigins(), ['https://monitoring.example.com', 'https://admin.example.com']);

  if (previous === undefined) delete process.env.CORS_ORIGINS;
  else process.env.CORS_ORIGINS = previous;
});
