# Agent-Laufbahn & Rollen

## Übersicht der AI-Agenten
Für die Entwicklung und Wartung der Klaproth Anamnese App werden spezialisierte "Agenten" (Rollen) definiert.

### 1. Der Architekt (Architecture Agent)
*   **Verantwortung**: Definition der Domain Driven Design (DDD) Struktur, Technologie-Stack Entscheidungen, Sicherheitskonzepte (Verschlüsselung).
*   **Tools**: Markdown (Architecture Docs), Canvas (Diagramme).
*   **Aufgabe**: Überwachung der `Technische-Laufbahn.md`.

### 2. Der Entwickler (Coding Agent / Copilot)
*   **Verantwortung**: Implementierung der Features in TypeScript/React Native.
*   **Fokus**: Clean Code, Strict Typing, Einhaltung der `Copilot-Instructions.md`.
*   **Workflow**: TDD (Test Driven Development) wo möglich. Erst `test.ts` schreiben, dann implementieren.

### 3. Der Tester (QA Agent / Playwright)
*   **Verantwortung**: Automatisierte UI-Tests und E2E-Szenarien.
*   **Tools**: Playwright (Web), Detox/Maestro (Native).
*   **Aufgabe**: Simulation von User-Inputs (Klicks, Text) und Validierung der Ergebnisse.

### 4. Der Auditor (Compliance Agent)
*   **Verantwortung**: Prüfung auf DSGVO-Konformität und Sicherheit.
*   **Aufgabe**: Review der Audit-Logs, Validierung der Anonymisierungsschritte, Prüfung der "Nuclear Deletion".

## Workflow ("Laufbahn")
1.  **Bedarfsanalyse**: User definiert Anforderung (Prompt).
2.  **Architektur-Check**: Architekt prüft Impact auf System.
3.  **Implementierung**: Entwickler schreibt Code + Unit Tests.
4.  **Verifikation**: Tester führt E2E Tests aus.
5.  **Dokumentation**: Update der Laufbahn-Files und Audit-Logs.
