# Verzeichnis der Verarbeitungstätigkeiten
## gemäß Art. 30 DSGVO

**Verantwortlicher:** [Name der Arztpraxis / Organisation]
**Anschrift:** [Adresse]
**Datenschutzbeauftragter:** [Name, Kontakt]
**Stand:** 2026-02-06
**Anwendung:** Anamnese-App (anamnese-mobile v1.0.0)

---

## Verarbeitungstätigkeit 1: Patientenregistrierung

| Feld | Inhalt |
|---|---|
| **Bezeichnung** | Erfassung und Speicherung von Patientenstammdaten |
| **Zweck** | Identifikation des Patienten für die medizinische Anamnese |
| **Rechtsgrundlage** | Art. 6(1)(a) DSGVO – Einwilligung; Art. 9(2)(a) DSGVO |
| **Kategorien betroffener Personen** | Patienten |
| **Kategorien personenbez. Daten** | Vorname, Nachname, Geburtsdatum, Geschlecht, E-Mail, Telefon, Adresse, Versicherung, Versichertennummer |
| **Art. 9 Daten** | Nein (Stammdaten) |
| **Empfänger** | Arztpraxis-Personal (lokaler Zugriff) |
| **Übermittlung Drittland** | Nein |
| **Aufbewahrungsfrist** | 3 Jahre (§ 630f BGB) |
| **Löschung** | Manuell durch Arzt (Art. 17) oder automatisch nach Fristablauf |
| **TOM** | AES-256-GCM Verschlüsselung, PII-Trennung (encryptedData), Surrogate Key (UUID) |
| **Code-Referenz** | `src/domain/entities/Patient.ts`, `src/infrastructure/persistence/SQLitePatientRepository.ts` |

---

## Verarbeitungstätigkeit 2: Medizinische Anamnese-Erfassung

| Feld | Inhalt |
|---|---|
| **Bezeichnung** | Erfassung von Antworten auf medizinische Fragebögen |
| **Zweck** | Dokumentation der Krankengeschichte und aktueller Beschwerden |
| **Rechtsgrundlage** | Art. 6(1)(a), Art. 9(2)(a) DSGVO; § 630f BGB |
| **Kategorien betroffener Personen** | Patienten |
| **Kategorien personenbez. Daten** | Anamnese-Antworten, Vorerkrankungen, Medikation, Allergien |
| **Art. 9 Daten** | **Ja** – Gesundheitsdaten |
| **Empfänger** | Arztpraxis-Personal |
| **Übermittlung Drittland** | Nein |
| **Aufbewahrungsfrist** | 3 Jahre (§ 630f BGB) |
| **Löschung** | Über DeleteAllDataUseCase (Art. 17) |
| **TOM** | AES-256-GCM Verschlüsselung der Antworten, lokale Verarbeitung |
| **Code-Referenz** | `src/domain/entities/Answer.ts`, `src/infrastructure/persistence/SQLiteAnswerRepository.ts` |

---

## Verarbeitungstätigkeit 3: GDT-Export

| Feld | Inhalt |
|---|---|
| **Bezeichnung** | Export von Anamnese-Daten im GDT-Format an Praxisverwaltungssysteme |
| **Zweck** | Übernahme der Anamnese in die elektronische Patientenakte |
| **Rechtsgrundlage** | Art. 6(1)(a) DSGVO – Einwilligung (gdt_export Consent) |
| **Kategorien betroffener Personen** | Patienten |
| **Kategorien personenbez. Daten** | Patientenname, Geburtsdatum, Anamnese-Antworten |
| **Art. 9 Daten** | **Ja** |
| **Empfänger** | Praxisverwaltungssystem (lokal) |
| **Übermittlung Drittland** | Nein |
| **Aufbewahrungsfrist** | Temporär (Exportdatei wird nach Import gelöscht) |
| **Löschung** | Automatisch nach Export oder manuell |
| **TOM** | Verschlüsselte GDT-Datei (.gdt.enc), anonymer Dateiname, Temp-Verzeichnis |
| **Code-Referenz** | `src/application/use-cases/ExportGDTUseCase.ts` |

---

## Verarbeitungstätigkeit 4: Einwilligungsverwaltung (Consent Management)

| Feld | Inhalt |
|---|---|
| **Bezeichnung** | Verwaltung und Protokollierung von DSGVO-Einwilligungen |
| **Zweck** | Nachweis der Einwilligung gemäß Art. 7 DSGVO |
| **Rechtsgrundlage** | Art. 6(1)(c) DSGVO – Gesetzliche Pflicht zur Dokumentation |
| **Kategorien betroffener Personen** | Patienten |
| **Kategorien personenbez. Daten** | Consent-Typ, Zeitstempel, Datenschutzerklärungsversion |
| **Art. 9 Daten** | Nein |
| **Empfänger** | Arztpraxis-Personal, Aufsichtsbehörde (auf Anforderung) |
| **Übermittlung Drittland** | Nein |
| **Aufbewahrungsfrist** | 3 Jahre nach Widerruf |
| **TOM** | Audit-Trail mit Zeitstempeln, Zod-Validierung |
| **Code-Referenz** | `src/domain/entities/GDPRConsent.ts`, `src/infrastructure/persistence/SQLiteGDPRConsentRepository.ts` |

---

## Verarbeitungstätigkeit 5: OCR-Dokumentenverarbeitung

| Feld | Inhalt |
|---|---|
| **Bezeichnung** | Automatische Texterkennung auf Versichertenkarten und Dokumenten |
| **Zweck** | Automatisierte Datenextraktion zur Fehlerreduktion |
| **Rechtsgrundlage** | Art. 6(1)(a) DSGVO – Einwilligung (ocr_processing Consent) |
| **Kategorien betroffener Personen** | Patienten |
| **Kategorien personenbez. Daten** | Versichertenkarten-Daten (Name, Nummer, Kasse) |
| **Art. 9 Daten** | Nein (Stammdaten) |
| **Empfänger** | Nur lokale Verarbeitung |
| **Übermittlung Drittland** | Nein |
| **Aufbewahrungsfrist** | Temporär (Scan wird nach Extraktion gelöscht) |
| **Löschung** | Automatisch nach Verarbeitung |
| **TOM** | Lokale OCR (Tesseract), keine Cloud-Übertragung, temporäre Speicherung |
| **Code-Referenz** | `src/infrastructure/ocr/` |

---

## Verarbeitungstätigkeit 6: Session- und Schlüsselverwaltung

| Feld | Inhalt |
|---|---|
| **Bezeichnung** | Verwaltung der Verschlüsselungssitzung und Schlüsselspeicherung |
| **Zweck** | Schutz der Datenintegrität und -vertraulichkeit |
| **Rechtsgrundlage** | Art. 32 DSGVO – Sicherheit der Verarbeitung |
| **Kategorien betroffener Personen** | Arztpraxis-Personal (Bediener) |
| **Kategorien personenbez. Daten** | Keine PII – nur kryptographische Schlüssel und Session-IDs |
| **Empfänger** | Keine |
| **Übermittlung Drittland** | Nein |
| **Aufbewahrungsfrist** | Sitzungsdauer (max. 15 Min. Inaktivität) |
| **Löschung** | Automatisch bei Session-Timeout oder App-Neustart |
| **TOM** | PBKDF2 Key Derivation, Keychain-Speicherung, Session-Timeout (15 min), Brute-Force-Schutz |
| **Code-Referenz** | `src/shared/keyManager.ts`, `src/shared/sessionTimeout.ts`, `src/shared/bruteForceProtection.ts` |

---

## Zusammenfassung der TOM (Art. 32 DSGVO)

| Schutzziel | Maßnahme | Status |
|---|---|---|
| Vertraulichkeit | AES-256-GCM Verschlüsselung aller PII | ✅ |
| Vertraulichkeit | PBKDF2 Key Derivation (600k Iterationen) | ✅ |
| Vertraulichkeit | Session-Timeout nach 15 Min. | ✅ |
| Vertraulichkeit | Brute-Force-Schutz mit Lockout | ✅ |
| Vertraulichkeit | Keine Cloud-Übertragung | ✅ |
| Integrität | GCM-Authentifizierungstag (AuthTag) | ✅ |
| Integrität | Zod-Schema-Validierung | ✅ |
| Verfügbarkeit | Backup/Restore-Funktionalität | ✅ |
| Belastbarkeit | Automatische Fehlerbehandlung | ✅ |
| Transparenz | Audit-Trail pro Entity | ✅ |
| Transparenz | Consent-Management mit Versionierung | ✅ |
| Datensparsamkeit | PII-Trennung in encryptedData | ✅ |
| Datensparsamkeit | Anonymisierte Export-Funktion | ✅ |
| Löschung | Art. 17 Löschfunktion | ✅ |
| Logging | PII-Filter in Produktions-Logs | ✅ |
