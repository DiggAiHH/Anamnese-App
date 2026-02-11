declare module 'react-native-sqlite-storage' {
  export type SQLiteTransaction = {
    executeSql: (statement: string, params?: unknown[]) => Promise<SQLiteExecuteResult[]>;
  };

  export type SQLiteRows = {
    length: number;
    item: (index: number) => Record<string, unknown>;
  };

  export type SQLiteExecuteResult = {
    rows: SQLiteRows;
    insertId?: number;
    rowsAffected?: number;
    [Symbol.iterator](): Iterator<SQLiteExecuteResult>;
  };

  export type SQLiteDatabase = {
    executeSql: (statement: string, params?: unknown[]) => Promise<SQLiteExecuteResult[]>;
    transaction: (fn: (tx: SQLiteTransaction) => Promise<void> | void) => Promise<void>;
    close: () => Promise<void>;
  };

  export type OpenDatabaseParams = {
    name: string;
    location?: string;
  };

  type DebugFn = (enable: boolean) => void;
  type EnablePromiseFn = (enable: boolean) => void;
  type OpenDatabaseFn = (
    params: OpenDatabaseParams | string,
    version?: string,
    displayName?: string,
    size?: number,
  ) => Promise<SQLiteDatabase>;

  const SQLite: {
    DEBUG: DebugFn;
    enablePromise: EnablePromiseFn;
    openDatabase: OpenDatabaseFn;
  };

  export { SQLiteDatabase };
  export default SQLite;
}

declare module 'react-native-quick-crypto' {
  export * from 'crypto';
  export const webcrypto: Crypto | undefined;
}

declare module 'react-native-tesseract-ocr';
declare module '@react-native-voice/voice' {
  export type SpeechResultsEvent = { value?: string[] };
  export type SpeechError = { message?: string };
  export type SpeechErrorEvent = { error?: SpeechError };
  export type SpeechStartEvent = Record<string, unknown>;
  export type SpeechEndEvent = Record<string, unknown>;

  type SpeechCallback = (event: unknown) => void;

  const Voice: {
    onSpeechStart?: SpeechCallback;
    onSpeechEnd?: SpeechCallback;
    onSpeechResults?: SpeechCallback;
    onSpeechPartialResults?: SpeechCallback;
    onSpeechError?: SpeechCallback;
    isAvailable: () => Promise<boolean>;
    getSupportedLanguages?: () => Promise<string[] | undefined>;
    start: (language?: string, options?: Record<string, unknown>) => Promise<void>;
    stop: () => Promise<void>;
    cancel: () => Promise<void>;
    destroy: () => Promise<void>;
    removeAllListeners: () => void;
  };

  export default Voice;
}
declare module 'react-native-document-picker';
declare module 'react-native-fs';
declare module 'react-native-share';
declare module 'react-native-date-picker';
declare module 'react-native-vector-icons/*';

declare module 'react-native-localize' {
  export const getLocales: () => Array<{ languageTag: string; countryCode?: string }>;
}
