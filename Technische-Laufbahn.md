# Technische Laufbahn & Stack

## Technologie-Stack
*   **Core**: React Native (Latest Stable).
    *   **Targets**:
        *   **Web**: React Native Web (Primary Dev Target & Browser Deployment).
        *   **Native**: iOS, Android, macOS, Windows (via React Native implementations).
*   **Language**: TypeScript 5.x+
*   **State Management**: Zustand / React Context (für lokale Sessions).
*   **Encryption**: AES-256 (via `react-native-aes-crypto` oder Web Crypto API fallback).
*   **Storage**:
    *   Web: IndexedDB / LocalStorage (Encrypted).
    *   Native: Async Storage / SecureStore (Encrypted).

## Architektur (DDD)
*   **Domain**: Reine Business Logic, keine UI-Abhängigkeiten.
*   **Validators**: Zod Schemas für Runtime-Validation.
*   **Entities**: Immutable Data Structures.

## Deployment Pipeline
1.  **Dev**: Lokal (`npm run web` / `npm run windows`).
2.  **Staging**: Netlify (Web Deployment für Tests).
3.  **Production**:
    *   Web: Hosting in EU (IONOS/Telekom).
    *   Native: App Stores (Apple/Play Store) & Direct builds (Windows/Linux).

## Security Concept
*   **Zero Knowledge**: Server kennt keine Klarnamen ohne explizite Freigabe.
*   **Local First**: Daten werden primär auf dem Gerät verarbeitet.
*   **Nuclear Deletion**: Vollständige Löschung aller temporären Daten auf Knopfdruck.
