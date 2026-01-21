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
    size?: number
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
declare module '@react-navigation/native' {
  export const NavigationContainer: React.ComponentType<{ children?: React.ReactNode }>;
  export interface NavigationContainerRef<T = unknown> {
    navigate: (...args: unknown[]) => void;
    goBack: () => void;
    getCurrentRoute?: () => T | undefined;
  }
}

declare module '@react-navigation/stack' {
  export type StackNavigator<
    ParamList extends Record<string, object | undefined> = Record<string, object | undefined>,
  > = {
    Navigator: React.ComponentType<Record<string, unknown>>;
    Screen: React.ComponentType<Record<string, unknown>>;
    Group?: React.ComponentType<Record<string, unknown>>;
    _ParamList?: ParamList;
  };

  export type StackScreenProps<
    ParamList extends Record<string, object | undefined> = Record<string, object | undefined>,
    RouteName extends keyof ParamList = keyof ParamList,
  > = {
    navigation: {
      navigate: (...args: unknown[]) => void;
      goBack: () => void;
      addListener: (event: string, callback: () => void) => () => void;
    } & Record<string, unknown>;
    route: { key: string; name: RouteName; params: ParamList[RouteName] };
  };

  export function createStackNavigator<
    ParamList extends Record<string, object | undefined> = Record<string, object | undefined>,
  >(): StackNavigator<ParamList>;
}

declare module '@react-navigation/native-stack' {
  export type NativeStackScreenProps<
    ParamList extends Record<string, object | undefined> = Record<string, object | undefined>,
    RouteName extends keyof ParamList = keyof ParamList
  > = {
    navigation: {
      navigate: (...args: unknown[]) => void;
      goBack: () => void;
      replace: (...args: unknown[]) => void;
      popToTop: () => void;
    } & Record<string, unknown>;
    route: { key: string; name: RouteName; params: ParamList[RouteName] };
  };

  export type NativeStackNavigator<
    ParamList extends Record<string, object | undefined> = Record<string, object | undefined>,
  > = {
    Navigator: React.ComponentType<Record<string, unknown>>;
    Screen: React.ComponentType<Record<string, unknown>>;
    Group?: React.ComponentType<Record<string, unknown>>;
    _ParamList?: ParamList;
  };

  export function createNativeStackNavigator<
    ParamList extends Record<string, object | undefined> = Record<string, object | undefined>,
  >(): NativeStackNavigator<ParamList>;
}

declare module 'react-native-localize' {
  export const getLocales: () => Array<{ languageTag: string; countryCode?: string }>;
}
