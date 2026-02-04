# Klaproth Anamnese - Copilot Instructions

## Core Principles
1.  **Privacy First**: All data handling must be GDPR (DSGVO) compliant. No PII should ever leave the device unencrypted.
2.  **Security**: Use AES-256 for all local storage and transmission encryption. Keys are managed by the user/practice.
3.  **Anonymity**: The backend only receives anonymized data (Integer-based answers, stripped PII) unless explicitly authorized for practice transfer between trusted endpoints.
4.  **Robustness**: The app must handle interruptions. State must be auto-saved locally (Encrypted Cache).
5.  **Documentation**: Every file must have a header explaining its purpose. Every major function must be commented.

## Coding Standards
-   **Framework**: React Native (Expo/CLI) with `react-native-web` compatibility.
-   **Language**: TypeScript (Strict Mode).
-   **Architecture**: Domain-Driven Design (DDD).
    -   `src/domain`: Entities, Value Objects, Repository Interfaces (Pure TS, no UI).
    -   `src/application`: Use Cases, Services (Business Logic).
    -   `src/infrastructure`: Repositories, API implementation, Device storage.
    -   `src/presentation`: React Components, Screens, Hooks.
-   **Styling**: styled-components or StyleSheet. No raw CSS files unless global.
-   **Testing**: Unit tests (Jest) for all Domain/Application logic. UI Tests (Maestro/Detox/Playwright) for critical flows.

## Behavior Guidelines
-   **Always** verify the "Happy Path" and "Edge Cases" (e.g., interrupted network, app crash).
-   **Never** use external analytics or tracking libraries (Google Analytics, Firebase) without strict review.
-   **Prompt Engineering**: When asking for changes, always provide the context of "Why" and "Where".

## Specific Flows
-   **Anamnese**: One question at a time. Validation immediate.
-   **Encryption**: Happened on the fly.
-   **Updates**: Check `task.md` before starting work.
