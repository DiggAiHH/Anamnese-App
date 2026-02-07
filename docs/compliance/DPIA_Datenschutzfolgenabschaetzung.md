# Datenschutz-Folgenabschätzung (DPIA)
## gemäß Art. 35 DSGVO

**Verantwortlicher:** [Name der Arztpraxis / Organisation]
**Datenschutzbeauftragter:** [Name, Kontakt]
**Stand:** 2026-02-06
**Version:** 1.0.0
**Anwendung:** Anamnese-App (anamnese-mobile v1.0.0)

---

## 1. Systematische Beschreibung der Verarbeitungsvorgänge

### 1.1 Zweck der Verarbeitung
Die Anamnese-App dient der digitalen Erfassung medizinischer Anamnese-Daten von Patienten
in Arztpraxen. Sie ersetzt den papierbasierten Anamnesebogen und ermöglicht:
- Strukturierte Erfassung von Patientenstammdaten und Gesundheitsinformationen
- Mehrsprachige Fragebogenausfüllung (19 Sprachen)
- Export in Praxisverwaltungssysteme via GDT-Schnittstelle
- Dokumenten-OCR zur automatisierten Datenextraktion
- Spracherkennung für barrierefreie Eingabe

### 1.2 Rechtsgrundlage (Art. 6, 9 DSGVO)
| Verarbeitung | Rechtsgrundlage | Paragraf |
|---|---|---|
| Stammdatenerfassung | Einwilligung | Art. 6(1)(a) |
| Gesundheitsdaten | Ausdrückliche Einwilligung | Art. 9(2)(a) |
| Behandlungsvertrag | Vertragserfüllung | Art. 6(1)(b) |
| Dokumentationspflicht | Gesetzliche Pflicht | Art. 6(1)(c), § 630f BGB |
| GDT-Export | Einwilligung | Art. 6(1)(a) |

### 1.3 Kategorien betroffener Personen
- Patienten (einschließlich Minderjährige mit Einwilligung der Sorgeberechtigten)

### 1.4 Kategorien personenbezogener Daten
| Kategorie | Datenfelder | Art. 9 DSGVO |
|---|---|---|
| Identifikation | Vorname, Nachname, Geburtsdatum | Nein |
| Kontaktdaten | E-Mail, Telefon, Adresse | Nein |
| Versicherung | Kasse, Versichertennummer | Nein |
| **Gesundheitsdaten** | **Anamnese-Antworten, Vorerkrankungen, Medikation** | **Ja** |
| Biometrisch (optional) | Sprachaufnahmen (temporär, nicht persistiert) | Ja |
| Dokumenten-Scans | Versichertenkarten-OCR (temporär) | Nein |

### 1.5 Empfänger
| Empfänger | Zweck | Übermittlungsweg |
|---|---|---|
| Praxisverwaltungssystem | GDT-Import | Lokale Dateiübertragung (verschlüsselt) |
| Arztpraxis-Personal | Behandlung | Lokaler Bildschirmzugriff |
| **Keine Cloud-Dienste** | — | — |

### 1.6 Datenfluss-Diagramm
```
Patient → [Eingabe auf Tablet]
  → App (lokale Verarbeitung, AES-256-GCM verschlüsselt)
    → SQLite (verschlüsselte Felder)
    → GDT-Export (verschlüsselt → Praxis-PVS)
    → AsyncStorage (Session, verschlüsselt)
    → Keychain (Schlüssel, hardwaregeschützt)

Keine Datenübertragung an externe Server.
```

---

## 2. Bewertung der Notwendigkeit und Verhältnismäßigkeit

### 2.1 Notwendigkeit
- **Datenminimierung (Art. 5(1)(c)):** Nur medizinisch erforderliche Felder werden erhoben. Anonymisierte Export-Funktion entfernt PII und behält nur Geburtsjahr + Geschlecht.
- **Speicherbegrenzung (Art. 5(1)(e)):** Aufbewahrungsfrist: 3 Jahre (§ 630f BGB). Consent-Entity speichert `retentionPeriod`.
- **Zweckbindung (Art. 5(1)(b)):** Daten werden ausschließlich für die medizinische Anamnese verwendet.

### 2.2 Verhältnismäßigkeit
- Alle Daten werden **lokal auf dem Gerät** verarbeitet – keine Cloud, kein Backend-Server.
- Verschlüsselung mit AES-256-GCM (PBKDF2 SHA-256, 600.000 Iterationen).
- Separate Speicherung: PII in `encryptedData` Feld, Metadaten separat (Surrogate Key UUID).

---

## 3. Risikobewertung

### 3.1 Identifizierte Risiken

| # | Risiko | Eintritts-WK | Schwere | Risiko-Level | Maßnahme |
|---|---|---|---|---|---|
| R1 | Unbefugter Zugriff auf Gerät | Mittel | Hoch | HOCH | AES-256-GCM Verschlüsselung, Master-Password, Session-Timeout (15 min), FLAG_SECURE (Android) |
| R2 | Brute-Force auf Master-Passwort | Mittel | Hoch | HOCH | Exponentieller Backoff (2^n Sekunden), Hard-Lockout nach 10 Versuchen, PBKDF2 600k Iterationen |
| R3 | Datenverlust bei Geräteverlust | Mittel | Hoch | HOCH | Verschlüsselung at-rest, kein Klartext auf Gerät, Backup-Funktionalität |
| R4 | PII-Leak in Logs | Niedrig | Hoch | MITTEL | PII-Pattern-Filter in Logger, Dev-only Debug-Logs, Sanitized Error Messages |
| R5 | Unberechtigter GDT-Export | Niedrig | Hoch | MITTEL | Consent-Prüfung vor Export, verschlüsselte GDT-Dateien, anonymer Dateiname |
| R6 | Clipboard-Leak von Passwort | Niedrig | Mittel | NIEDRIG | Clipboard in Prod deaktiviert, Dev mit 30s Auto-Clear |
| R7 | Screenshot/Screen Recording | Niedrig | Mittel | NIEDRIG | FLAG_SECURE (Android), kein Schutz auf iOS/Windows (OS-Level) |

### 3.2 Residualrisiken
- **R7 auf iOS/Windows:** FLAG_SECURE ist Android-spezifisch. Auf anderen Plattformen ist Screenshot-Schutz vom Betriebssystem abhängig.
- **Geräteverlust:** Bei starkem Master-Passwort ist das Risiko akzeptabel (AES-256-GCM, 600k PBKDF2-Iterationen).

---

## 4. Technische und Organisatorische Maßnahmen (TOM)

### 4.1 Technische Maßnahmen (implementiert)

| Maßnahme | Implementierung | Code-Referenz |
|---|---|---|
| Verschlüsselung at-rest | AES-256-GCM, PBKDF2-SHA256 | `src/infrastructure/encryption/` |
| Session-Timeout | 15 min Inaktivität → Auto-Lock | `src/shared/sessionTimeout.ts` |
| Brute-Force-Schutz | Exponentieller Backoff + Hard-Lockout | `src/shared/bruteForceProtection.ts` |
| PII-Trennung | `encryptedData` Feld mit Surrogate Key | `src/domain/entities/Patient.ts` |
| Consent-Management | DSGVO-konforme Einwilligungsverwaltung | `src/domain/entities/GDPRConsent.ts` |
| Löschfunktion (Art. 17) | Vollständige Löschung SQLite + AsyncStorage | `src/application/use-cases/DeleteAllDataUseCase.ts` |
| Log-Sanitierung | PII-Pattern-Filter | `src/shared/sanitizeError.ts`, `src/shared/logger.ts` |
| Keychain-Speicherung | Hardware-gesicherter Schlüsselspeicher | `src/shared/keyManager.ts` |
| High-Contrast-Modus | BITV 2.0 / WCAG AA konforme Farbpalette | `src/presentation/theme/tokens.ts` |

### 4.2 Organisatorische Maßnahmen (empfohlen)

| Maßnahme | Status |
|---|---|
| DPO-Review dieser DPIA | ⚠️ ERFORDERLICH |
| Penetrationstest (TÜV/DEKRA) | ⚠️ ERFORDERLICH |
| Schulung Praxis-Personal | ⚠️ EMPFOHLEN |
| Aufbewahrungsplan-Review | ⚠️ EMPFOHLEN |

---

## 5. Stellungnahme des Datenschutzbeauftragten

> ⚠️ **USER ACTION REQUIRED**
> Diese DPIA muss von einem benannten Datenschutzbeauftragten (DPO) geprüft und
> gegengezeichnet werden, bevor die App in den Produktivbetrieb geht.

**DPO-Stellungnahme:** [Hier eintragen]
**Datum:** [Hier eintragen]
**Unterschrift:** [Hier eintragen]

---

## 6. Ergebnis und Bewertung

Die Datenschutz-Folgenabschätzung zeigt, dass die Anamnese-App umfangreiche technische
Schutzmaßnahmen implementiert hat, die dem Stand der Technik entsprechen:

- **Verschlüsselung:** AES-256-GCM mit 600.000 PBKDF2-Iterationen
- **Datentrennung:** PII in verschlüsselten Feldern, Metadaten separat
- **Zugriffskontrolle:** Master-Passwort + Session-Timeout + Brute-Force-Schutz
- **Lokale Verarbeitung:** Keine Cloud-Anbindung, alle Daten auf dem Gerät
- **Transparenz:** Consent-Management mit Audit-Trail

**Restrisiko:** AKZEPTABEL unter der Voraussetzung, dass:
1. Ein DPO die DPIA gegenzeichnet
2. Ein Penetrationstest durchgeführt wird
3. Das Praxis-Personal geschult wird
