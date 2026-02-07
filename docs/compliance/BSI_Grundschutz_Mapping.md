# BSI IT-Grundschutz Compliance Matrix
## Anamnese-App – Mapping zu BSI Bausteinen

**Stand:** 2026-02-06
**Anwendung:** anamnese-mobile v1.0.0
**Klassifikation:** VS-NfD (Verschlusssache – Nur für den Dienstgebrauch)

---

## Legende
- ✅ Implementiert und getestet
- ⚠️ Teilweise implementiert / Empfehlung
- ❌ Nicht implementiert / Handlungsbedarf
- N/A Nicht anwendbar

---

## APP.3.1 – Webanwendungen und mobile Apps

| Anforderung | BSI ID | Status | Implementierung | Code-Referenz |
|---|---|---|---|---|
| Authentisierung | APP.3.1.A1 | ✅ | Master-Passwort mit PBKDF2 (600k iter) | `MasterPasswordScreen.tsx` |
| Sitzungsverwaltung | APP.3.1.A3 | ✅ | 15-Min Session-Timeout, Auto-Lock | `sessionTimeout.ts` |
| Kontrolliertes Einbinden von Daten | APP.3.1.A4 | ✅ | Zod-Schema-Validierung aller Eingaben | `src/domain/validation/` |
| Fehlerbehandlung | APP.3.1.A7 | ✅ | Sanitized Errors, kein Stack-Trace für User | `sanitizeError.ts`, `userFacingError.ts` |
| Sitzungs-Timeout | APP.3.1.A8 | ✅ | 15 Min Inaktivität → Schlüssel gelöscht | `sessionTimeout.ts`, `SessionGuard.tsx` |
| Schutz vertraulicher Daten | APP.3.1.A9 | ✅ | AES-256-GCM, PII-Trennung, Keychain | `NativeEncryptionService.ts` |
| Protokollierung | APP.3.1.A14 | ✅ | Strukturierte Events, PII-Filter | `logger.ts`, `LogEvents.ts` |
| Verschlüsselung | APP.3.1.A17 | ✅ | AES-256-GCM (AEAD) | `encryptionService.ts` |
| Content Security Policy | APP.3.2 | ⚠️ | Nur für Web-Build relevant, nicht gesetzt | `webpack.config.js` |
| Certificate Pinning | APP.3.1 | N/A | Keine Server-Kommunikation | — |

## ORP.4 – Identitäts- und Berechtigungsmanagement

| Anforderung | BSI ID | Status | Implementierung | Code-Referenz |
|---|---|---|---|---|
| Passwort-Richtlinie | ORP.4.A1 | ✅ | Mindestlänge, Komplexität via SharedEncryptionBridge | `SharedEncryptionBridge.ts` |
| Brute-Force-Schutz | ORP.4.A5 | ✅ | Exponentieller Backoff + Hard-Lockout (10 Versuche) | `bruteForceProtection.ts` |
| Sperrung bei Fehlversuchen | ORP.4.A8 | ✅ | Hard-Lock nach maxAttempts, App-Neustart nötig | `bruteForceProtection.ts` |
| Protokollierung Anmeldeversuche | ORP.4.A9 | ✅ | AUTH_LOGIN_FAIL/SUCCESS LogEvents | `LogEvents.ts` |

## CON.1 – Kryptokonzept

| Anforderung | BSI ID | Status | Implementierung | Code-Referenz |
|---|---|---|---|---|
| Schlüssellänge | CON.1.A2 | ✅ | 256-bit AES, 128-bit Salt, 96-bit IV | `NativeEncryptionService.ts` |
| Schlüsselableitung | CON.1.A3 | ✅ | PBKDF2-SHA256, 600.000 Iterationen | `NativeEncryptionService.ts` |
| Zufallszahlengenerator | CON.1.A4 | ✅ | crypto.getRandomValues / quick-crypto.randomBytes | `WebCryptoEncryptionService.ts` |
| Authentifizierte Verschlüsselung | CON.1.A6 | ✅ | GCM (AEAD) mit AuthTag | `EncryptedData.ts` |
| Schlüsselspeicherung | CON.1.A7 | ✅ | Keychain (AccessibleWhenUnlockedThisDeviceOnly) | `keyManager.ts` |
| Sichere Löschung | CON.1.A10 | ⚠️ | Key wird auf null gesetzt, kein secure memory wipe | `useQuestionnaireStore.ts` |

## CON.7 – Informationssicherheit auf Reisen

| Anforderung | BSI ID | Status | Implementierung | Code-Referenz |
|---|---|---|---|---|
| Bildschirmsperre | CON.7.A2 | ✅ | FLAG_SECURE (Android), Session-Timeout | `MainActivity.kt`, `sessionTimeout.ts` |
| Verschlüsselung mobiler Daten | CON.7.A7 | ✅ | AES-256-GCM at-rest | `encryptionService.ts` |
| Keine Cloud-Synchronisation | CON.7.A9 | ✅ | Rein lokale Verarbeitung | Architektur |

## OPS.1.1.3 – Patch- und Änderungsmanagement

| Anforderung | BSI ID | Status | Implementierung | Code-Referenz |
|---|---|---|---|---|
| Abhängigkeiten-Versionen | OPS.1.1.3.A1 | ✅ | Exakte Versionen in package.json, patch-package | `package.json` |
| Automatisierte Tests | OPS.1.1.3.A5 | ✅ | Jest Unit/Integration-Tests | `__tests__/` |
| CI/CD Pipeline | OPS.1.1.3.A6 | ⚠️ | GitHub Actions definiert, kein BSI-konformes Review-Gate | `.github/workflows/` |

## DER.1 – Detektion von sicherheitsrelevanten Ereignissen

| Anforderung | BSI ID | Status | Implementierung | Code-Referenz |
|---|---|---|---|---|
| Audit-Logging | DER.1.A1 | ✅ | Strukturierte LogEvents mit Severity | `LogEvents.ts` |
| Brute-Force-Detektion | DER.1.A5 | ✅ | AUTH_BRUTE_FORCE_LOCKOUT Event (CRITICAL) | `bruteForceProtection.ts` |
| PII-Schutz in Logs | DER.1.A8 | ✅ | PII-Pattern-Filter, sanitizeError | `sanitizeError.ts` |

---

## Handlungsbedarf (priorisiert)

| Priorität | Maßnahme | BSI Baustein | Status |
|---|---|---|---|
| HOCH | Secure Memory Wipe für Encryption Key | CON.1.A10 | ⚠️ JavaScript kann keinen garantierten Memory-Wipe durchführen. Mitigation: Session-Timeout + Key-Null-Setzung. |
| MITTEL | CSP Headers für Web-Build | APP.3.2 | ⚠️ Nur relevant wenn Web-Deployment aktiv |
| MITTEL | SQLCipher für DB-Level Encryption | APP.3.1.A17 | ⚠️ Empfohlen als Defense-in-Depth |
| NIEDRIG | HMAC auf Backup-Dateien | OPS.1.2.2 | ⚠️ Integritätsprüfung bei Backup-Restore |

---

## ⚠️ Disclaimer

Diese Compliance-Matrix ist eine Selbsteinschätzung und ersetzt NICHT:
1. Eine BSI C5-Zertifizierung durch einen zugelassenen Auditor
2. Einen Penetrationstest durch ein zertifiziertes Unternehmen (TÜV, DEKRA)
3. Ein formales ISMS nach ISO 27001
