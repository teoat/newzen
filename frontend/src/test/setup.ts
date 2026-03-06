import { beforeAll, afterAll, vi } from 'vitest';

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

Object.defineProperty(globalThis, 'window', {
  value: {
    location: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
    },
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    matchMedia: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    crypto: {
      subtle: {
        importKey: vi.fn(),
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        deriveKey: vi.fn(),
        digest: vi.fn(),
        exportKey: vi.fn(),
        generateKey: vi.fn(),
        sign: vi.fn(),
        verify: vi.fn(),
      },
      getRandomValues: vi.fn((buffer) => buffer),
    },
    navigator: {
      clipboard: {
        writeText: vi.fn(),
        readText: vi.fn(),
      },
    },
  },
  writable: true,
});

Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      importKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      deriveKey: vi.fn(),
      digest: vi.fn(),
      exportKey: vi.fn(),
      generateKey: vi.fn(),
      sign: vi.fn(),
      verify: vi.fn(),
    },
    getRandomValues: vi.fn((buffer) => buffer),
  },
  writable: true,
});

Object.defineProperty(globalThis, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
  },
  writable: true,
});

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: vi.fn(),
}));
