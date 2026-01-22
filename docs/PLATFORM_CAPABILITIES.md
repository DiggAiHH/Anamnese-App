# Platform Capability Matrix

This document tracks feature availability and required fallbacks for each platform.
Use this as the source of truth for capability guards and UI behavior.

Legend:
- Yes: feature supported as implemented
- No: feature unavailable; fallback UX required
- Guarded: runtime guarded; module loads only when supported

## Core Features

| Feature | iOS | Android | Windows | macOS | Web | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| SQLite persistence | Yes | Yes | No | No | No | Guarded by platformCapabilities; web/macos/windows need storage implementation. |
| Secure keychain | Yes | Yes | No | No | No | Guarded by platformCapabilities. |
| TTS (react-native-tts) | Yes | Yes | No | No | No | Guarded; fallback messaging on unsupported platforms. |
| Speech-to-text (react-native-voice) | Yes | Yes | No | No | No | Guarded; fallback messaging on unsupported platforms. |
| OCR (tesseract.js) | Yes | Yes | No | No | No | Guarded with dynamic import. |
| Document picker | Yes | Yes | No | No | No | Guarded; dynamic import on supported platforms. |
| Share API | Yes | Yes | No | No | No | Guarded; dynamic import on supported platforms. |
| RNFS (react-native-fs) | Yes | Yes | No | No | No | Guarded; used only when available. |
| WebCrypto | Yes | Yes | Yes | Yes | Yes | Runtime check uses global crypto presence. |
| QuickCrypto | Yes | Yes | No | No | No | Used when available; fallback to WebCrypto. |

## Current Guarding Strategy

- Capability gates are centralized in `src/shared/platformCapabilities.ts`.
- Native-only modules are imported dynamically (require/import) inside guards.
- UI uses explicit "feature unavailable" states to avoid crashes and clarify behavior.

## Open Work

- Implement storage for Windows/macOS/Web (IndexedDB or filesystem abstraction).
- Add CI build matrix and smoke tests for all platforms.
- Run and capture platform smoke builds for Android, iOS, macOS, Web.
