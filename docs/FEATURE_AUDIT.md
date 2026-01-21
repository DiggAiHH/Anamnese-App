# Feature Audit (Reachability)

Ziel: Transparenz, welche Repo-Funktionalität in der UI erreichbar ist (und welche Bausteine existieren, aber noch nicht end-to-end verdrahtet sind).

## Erreichbar (UI)

- **Sprachwahl (19 Sprachen)**
  - Persistiert lokal (AsyncStorage).
  - Jest-Test erzwingt Key-Parität über alle Locales.

- **Neue Anamnese starten**
  - Master-Passwort → Patientendaten → Einwilligungen → Fragebogen → Summary.

- **Gespeicherte Anamnesen (Resume)**
  - Home → "Gespeicherte Anamnesen" → Patient auswählen → (falls nötig) Master-Passwort entsperren → Fragebogen fortsetzen.

- **GDT Export**
  - In Summary → Export.
  - Consent-gated ("GDT Export" Einwilligung).

## Teilweise vorhanden / noch nicht end-to-end verdrahtet

- **OCR (Tesseract)**
  - Service-Implementierungen existieren in `src/infrastructure/ocr` / `src/infrastructure/services`.
  - Aktuell fehlt ein UI-Flow (Dokument erfassen/auswählen, Consent-Handling, Speichern als Document + OCR-Ergebnis) und ein Use-Case.

- **Spracherkennung (Vosk)**
  - Service-Implementierung vorhanden (`VoskSpeechService`).
  - Aktuell fehlt ein UI-Flow (Aufnahme/Transkription), Consent-Handling und Use-Case-Integration.

- **Dokumente (Domain + Repos)**
  - `DocumentEntity` + Repos existieren.
  - Aktuell fehlt eine UI zum Import/Verwalten (und ggf. OCR-Anstoß).

## Hinweise zur Datenmodell-Konsistenz

- **Antworten**
  - Single-Choice: Integer-Option-Values.
  - Multi-Choice: Integer-Bitset (persistiert als Zahl).
  - Legacy-Arrays werden beim Speichern normalisiert.

- **Compartment IDs**
  - Jede generierte Frage enthält stabile `metadata.compartmentId` und `metadata.compartmentOrder`.
