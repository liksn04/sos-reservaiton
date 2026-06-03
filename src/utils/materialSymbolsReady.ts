export const MATERIAL_SYMBOLS_LOADING_CLASS = 'roomin-material-symbols-loading';
export const MATERIAL_SYMBOLS_READY_CLASS = 'roomin-material-symbols-ready';
export const MATERIAL_SYMBOLS_FAILED_CLASS = 'roomin-material-symbols-failed';

const MATERIAL_SYMBOLS_FONT_SPEC = '24px "Material Symbols Outlined"';
const DEFAULT_TIMEOUT_MS = 12_000;

export type MaterialSymbolsReadyStatus = 'ready' | 'failed';

export interface MaterialSymbolsReadyDocument {
  documentElement: {
    classList: Pick<DOMTokenList, 'add' | 'remove' | 'contains'>;
  };
  fonts?: {
    load: (font: string) => Promise<unknown>;
  };
}

interface MaterialSymbolsReadyOptions {
  documentRef?: MaterialSymbolsReadyDocument;
  timeoutMs?: number;
}

function getDefaultDocument() {
  return typeof document === 'undefined' ? undefined : document;
}

export function initMaterialSymbolsReady({
  documentRef = getDefaultDocument(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: MaterialSymbolsReadyOptions = {}): Promise<MaterialSymbolsReadyStatus> {
  const classList = documentRef?.documentElement.classList;

  if (!classList) {
    return Promise.resolve('failed');
  }

  classList.remove(MATERIAL_SYMBOLS_READY_CLASS, MATERIAL_SYMBOLS_FAILED_CLASS);
  classList.add(MATERIAL_SYMBOLS_LOADING_CLASS);

  if (!documentRef.fonts) {
    classList.remove(MATERIAL_SYMBOLS_LOADING_CLASS);
    classList.add(MATERIAL_SYMBOLS_FAILED_CLASS);
    return Promise.resolve('failed');
  }
  const fonts = documentRef.fonts;

  return new Promise((resolve) => {
    let settled = false;

    const timeoutId = globalThis.setTimeout(() => {
      finish('failed');
    }, timeoutMs);

    const finish = (status: MaterialSymbolsReadyStatus) => {
      if (settled) return;

      settled = true;
      globalThis.clearTimeout(timeoutId);
      classList.remove(MATERIAL_SYMBOLS_LOADING_CLASS);
      classList.add(status === 'ready' ? MATERIAL_SYMBOLS_READY_CLASS : MATERIAL_SYMBOLS_FAILED_CLASS);
      resolve(status);
    };

    fonts.load(MATERIAL_SYMBOLS_FONT_SPEC).then(
      () => finish('ready'),
      () => finish('failed'),
    );
  });
}
