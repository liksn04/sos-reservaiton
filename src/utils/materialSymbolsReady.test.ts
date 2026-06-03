import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  initMaterialSymbolsReady,
  MATERIAL_SYMBOLS_FAILED_CLASS,
  MATERIAL_SYMBOLS_LOADING_CLASS,
  MATERIAL_SYMBOLS_READY_CLASS,
} from './materialSymbolsReady';
import type { MaterialSymbolsReadyDocument } from './materialSymbolsReady';

class TestClassList {
  private readonly tokens = new Set<string>();

  add(...tokens: string[]) {
    tokens.forEach((token) => this.tokens.add(token));
  }

  remove(...tokens: string[]) {
    tokens.forEach((token) => this.tokens.delete(token));
  }

  contains(token: string) {
    return this.tokens.has(token);
  }
}

function createDocument(load?: () => Promise<unknown>): MaterialSymbolsReadyDocument {
  const classList = new TestClassList();

  return {
    documentElement: { classList },
    fonts: load ? { load } : undefined,
  };
}

describe('initMaterialSymbolsReady', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks loading immediately and ready after Material Symbols font loads', async () => {
    let resolveLoad: () => void = () => {};
    const documentRef = createDocument(() => new Promise((resolve) => {
      resolveLoad = () => resolve([]);
    }));

    const ready = initMaterialSymbolsReady({ documentRef, timeoutMs: 1_000 });

    expect(documentRef.documentElement.classList.contains(MATERIAL_SYMBOLS_LOADING_CLASS)).toBe(true);
    expect(documentRef.documentElement.classList.contains(MATERIAL_SYMBOLS_READY_CLASS)).toBe(false);

    resolveLoad();

    await expect(ready).resolves.toBe('ready');
    expect(documentRef.documentElement.classList.contains(MATERIAL_SYMBOLS_LOADING_CLASS)).toBe(false);
    expect(documentRef.documentElement.classList.contains(MATERIAL_SYMBOLS_READY_CLASS)).toBe(true);
    expect(documentRef.documentElement.classList.contains(MATERIAL_SYMBOLS_FAILED_CLASS)).toBe(false);
  });

  it('marks failed after timeout when Material Symbols font never resolves', async () => {
    vi.useFakeTimers();
    const documentRef = createDocument(() => new Promise(() => {}));

    const ready = initMaterialSymbolsReady({ documentRef, timeoutMs: 50 });

    vi.advanceTimersByTime(50);

    await expect(ready).resolves.toBe('failed');
    expect(documentRef.documentElement.classList.contains(MATERIAL_SYMBOLS_LOADING_CLASS)).toBe(false);
    expect(documentRef.documentElement.classList.contains(MATERIAL_SYMBOLS_READY_CLASS)).toBe(false);
    expect(documentRef.documentElement.classList.contains(MATERIAL_SYMBOLS_FAILED_CLASS)).toBe(true);
  });

  it('marks failed without throwing when document fonts are unavailable', async () => {
    const documentRef = createDocument();

    await expect(initMaterialSymbolsReady({ documentRef })).resolves.toBe('failed');
    expect(documentRef.documentElement.classList.contains(MATERIAL_SYMBOLS_LOADING_CLASS)).toBe(false);
    expect(documentRef.documentElement.classList.contains(MATERIAL_SYMBOLS_READY_CLASS)).toBe(false);
    expect(documentRef.documentElement.classList.contains(MATERIAL_SYMBOLS_FAILED_CLASS)).toBe(true);
  });
});
