import "@testing-library/jest-dom/vitest";
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

Object.defineProperty(window, 'location', {
  value: {
    hash: {
      endsWith: vi.fn(),
      includes: vi.fn(),
    },
    assign: vi.fn(),
  },
  writable: true,
});
window.scrollTo = vi.fn();

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());