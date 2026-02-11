/**
 * Minimal IndexedDB type declarations.
 *
 * Required because tsconfig.json uses lib: ["ES2021"] without "dom".
 * These types are only used at runtime on web (Platform.OS === 'web').
 *
 * @security No PII. Type declarations only.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface IDBFactory {
  open(name: string, version?: number): IDBOpenDBRequest;
  deleteDatabase(name: string): IDBOpenDBRequest;
}

interface IDBDatabase {
  readonly objectStoreNames: { contains(name: string): boolean };
  close(): void;
  createObjectStore(name: string): IDBObjectStore;
  transaction(storeNames: string | string[], mode?: 'readonly' | 'readwrite'): IDBTransaction;
}

interface IDBObjectStore {
  put(value: any, key?: IDBValidKey): IDBRequest;
  delete(key: IDBValidKey): IDBRequest;
  getAll(): IDBRequest;
  getAllKeys(): IDBRequest;
  clear(): IDBRequest;
}

interface IDBTransaction {
  objectStore(name: string): IDBObjectStore;
  oncomplete: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  readonly error: Error | null;
}

interface IDBRequest<T = any> {
  readonly result: T;
  readonly error: Error | null;
  onsuccess: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
}

interface IDBOpenDBRequest extends IDBRequest<IDBDatabase> {
  onupgradeneeded: ((ev: any) => void) | null;
}

type IDBValidKey = number | string | Date | ArrayBufferView | ArrayBuffer | IDBValidKey[];

declare const indexedDB: IDBFactory;
