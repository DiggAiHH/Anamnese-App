# Compliance Checklist – Anamnese-App
## Zusammenfassung aller regulatorischen Anforderungen

**Stand:** 2026-02-06 | **Version:** 1.0.0

---

## 1. DSGVO / GDPR Compliance

| # | Anforderung | Artikel | Status | Implementierung |
|---|---|---|---|---|
| 1.1 | Privacy by Design & Default | Art. 25 | ✅ | PII in `encryptedData` Feld, Surrogate Keys (UUID), Datenminimierung |
| 1.2 | Einwilligungsmanagement | Art. 6/7 | ✅ | `GDPRConsentEntity` mit grant/revoke/audit, `GDPRConsentScreen` |
| 1.3 | Recht auf Löschung | Art. 17 | ✅ | `DeleteAllDataUseCase` (SQLite + AsyncStorage), Crypto-Shredding |
| 1.4 | Pseudonymisierung | Art. 25/32 | ✅ | Surrogate Key (UUID), PII nur in verschlüsseltem Blob |
| 1.5 | DPA-konformes Logging | Art. 9/32 | ✅ | PII-Pattern-Filter, sanitizeError, Dev-only Debug |
| 1.6 | Verarbeitungsverzeichnis | Art. 30 | ✅ | `docs/compliance/Verarbeitungsverzeichnis_Art30.md` |
| 1.7 | DPIA | Art. 35 | ✅ | `docs/compliance/DPIA_Datenschutzfolgenabschaetzung.md` |
| 1.8 | Aufbewahrungsfristen | Art. 5(1)(e) | ⚠️ | Consent speichert `retentionPeriod`, aber keine Auto-Löschung |
| 1.9 | Datenportabilität | Art. 20 | ⚠️ | GDT-Export vorhanden, kein maschinenlesbarer Vollexport |
| 1.10 | Consent-Widerruf → Datenlöschung | Art. 7(3) | ⚠️ | Revoke-Methode vorhanden, keine automatische Datenlöschung |
| 1.11 | Granulare Einzellöschung | Art. 17 | ⚠️ | Nur Gesamtlöschung, keine Einzel-Patienten-Löschung |

## 2. BSI IT-Grundschutz

| # | Anforderung | BSI Baustein | Status | Implementierung |
|---|---|---|---|---|
| 2.1 | Starke Authentifizierung | ORP.4 | ✅ | PBKDF2 (600k iter), Passwort-Policy |
| 2.2 | Brute-Force-Schutz | ORP.4 | ✅ | Exponentieller Backoff + Hard-Lockout |
| 2.3 | Session-Timeout (15 Min) | APP.3.1 | ✅ | `sessionTimeout.ts` + `SessionGuard.tsx` |
| 2.4 | Eingabevalidierung | APP.3.1 | ✅ | Zod-Schemas für alle Entities |
| 2.5 | Verschlüsselung | CON.1 | ✅ | AES-256-GCM, AEAD |
| 2.6 | Audit-Logging | DER.1 | ✅ | Strukturierte LogEvents, CRITICAL für Lockout |
| 2.7 | Sichere Konfiguration | APP.3.1 | ✅ | Keine Hardcoded Secrets, Env-Vars |
| 2.8 | Secure Memory Wipe | CON.1 | ⚠️ | JS-Limitation, Key auf null gesetzt |
| 2.9 | DB-Level Encryption | APP.3.1 | ⚠️ | Row-Level verschlüsselt, kein SQLCipher |
| 2.10 | Backup-Integrität | OPS.1.2.2 | ⚠️ | Struktur-Validierung, kein HMAC |

## 3. BITV 2.0 / WCAG 2.1 AA (Barrierefreiheit)

| # | Anforderung | WCAG | Status | Implementierung |
|---|---|---|---|---|
| 3.1 | Farbkontrast (4.5:1) | 1.4.3 | ✅ | High-Contrast-Palette mit Contrast-Tests |
| 3.2 | Textvergrößerung | 1.4.4 | ✅ | `fontScale` in ThemeContext, Zoom-Toggle |
| 3.3 | ARIA/Accessibility Labels | 4.1.2 | ✅ | `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` |
| 3.4 | Keyboard Navigation | 2.1.1 | ⚠️ | Grundsätzlich funktionsfähig, nicht systematisch getestet |
| 3.5 | Screen Reader | 1.3.1 | ✅ | Semantische Komponenten, `nativeID` Labels |
| 3.6 | Mehrsprachigkeit | 3.1.1 | ✅ | 19 Sprachen inkl. RTL (Arabisch, Farsi) |
| 3.7 | Skip Navigation | 2.4.1 | ⚠️ | Nicht implementiert |
| 3.8 | Error Announcements | 4.1.3 | ⚠️ | Basis vorhanden, `accessibilityLiveRegion` fehlt |
| 3.9 | Reduced Motion | 2.3.3 | ⚠️ | Animationen ohne Motion-Check |
| 3.10 | Focus-Indikator | 2.4.7 | ✅ | `focus` Token in Theme |

## 4. Testing & Qualität

| # | Anforderung | Status | Evidence |
|---|---|---|---|
| 4.1 | Session-Timeout Tests | ✅ | `__tests__/shared/sessionTimeout.test.ts` |
| 4.2 | Brute-Force Tests | ✅ | `__tests__/shared/bruteForceProtection.test.ts` |
| 4.3 | Patient Entity Tests | ✅ | `__tests__/domain/entities/Patient.test.ts` |
| 4.4 | GDPRConsent Entity Tests | ✅ | `__tests__/domain/entities/GDPRConsent.test.ts` |
| 4.5 | Contrast Ratio Tests | ✅ | `__tests__/presentation/theme/tokens.test.ts` |
| 4.6 | Encryption Tests (Native) | ✅ | `__tests__/infrastructure/encryption/` |
| 4.7 | Encryption Tests (WebCrypto) | ❌ | Noch nicht vorhanden |
| 4.8 | E2E Tests | ❌ | Detox konfiguriert, keine Tests |
| 4.9 | Security/Fuzzing Tests | ❌ | Kein automatisiertes Fuzzing |
| 4.10 | Performance Tests | ❌ | Kein Lasttest |

## 5. Dokumentation

| # | Dokument | Status | Pfad |
|---|---|---|---|
| 5.1 | DPIA (Datenschutzfolgenabschätzung) | ✅ | `docs/compliance/DPIA_Datenschutzfolgenabschaetzung.md` |
| 5.2 | Verarbeitungsverzeichnis (Art. 30) | ✅ | `docs/compliance/Verarbeitungsverzeichnis_Art30.md` |
| 5.3 | BSI-Grundschutz-Mapping | ✅ | `docs/compliance/BSI_Grundschutz_Mapping.md` |
| 5.4 | Compliance-Checkliste | ✅ | `docs/compliance/COMPLIANCE_CHECKLIST.md` (dieses Dokument) |
| 5.5 | Architektur-Dokumentation | ✅ | `ARCHITECTURE_FLOW.md` |
| 5.6 | Incident Response Plan | ❌ | Nicht vorhanden |
| 5.7 | BITV-Konformitätserklärung | ❌ | Nicht vorhanden |

---

## ⚠️ Bereiche für manuelle juristische Prüfung

Die folgenden Bereiche können NICHT automatisiert geprüft werden und erfordern
die Begutachtung durch qualifizierte Fachpersonen:

1. **DPO-Review:** Die DPIA (Art. 35) muss vom Datenschutzbeauftragten geprüft und gegengezeichnet werden.
2. **Penetrationstest:** BSI-konforme Sicherheitsprüfung durch zertifiziertes Unternehmen (TÜV, DEKRA, BSI-zertifiziert).
3. **Rechtsgrundlagen:** Die Einordnung der Verarbeitungstätigkeiten unter die korrekten Rechtsgrundlagen (Art. 6/9) muss juristisch validiert werden.
4. **Einwilligungstexte:** Der Wortlaut der Datenschutzerklärung und Einwilligungstexte muss juristisch geprüft werden.
5. **Aufbewahrungsfristen:** Die 3-Jahres-Frist (§ 630f BGB) muss für den konkreten Anwendungsfall bestätigt werden.
6. **Barrierefreiheit:** Ein BITV-Audit durch zertifizierte Prüfstelle ist für öffentliche Stellen Pflicht.
7. **eIDAS-Integration:** Falls qualifizierte elektronische Signaturen benötigt werden, muss ein Trust Service Provider eingebunden werden.
