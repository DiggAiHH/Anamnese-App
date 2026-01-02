# 📋 Vollständige Liste aller Elemente - Anamnese Mobile App

**Generiert am:** 2025-12-28  
**Quelle:** `index_v8_complete.html` + `questionnaire_structure_summary.json`

---

## 1️⃣ **FELDTYPEN (Input Elements)**

### **1.1 Text Input Elements**
| Label ID | Type | Beschreibung | Beispiel |
|----------|------|--------------|----------|
| `text` | Textfeld | Einzeiliger Texteintrag | Nachname, Vorname |
| `textarea` | Mehrzeiliger Text | Längere Beschreibungen | Freitextbeschreibung von Symptomen |
| `number` | Zahlenfeld | Numerische Eingabe | Gewicht, Größe, Anzahl Zigaretten/Tag |
| `date` | Datumsfeld | Datum (TT.MM.JJJJ) | Geburtsdatum, Datum der letzten Impfung |
| `email` | E-Mail | E-Mail-Adresse | Kontaktdaten |
| `tel` | Telefon | Telefonnummer | Handynummer, Festnetz |

### **1.2 Selection Elements**
| Label ID | Type | Beschreibung | Optionen-Beispiel |
|----------|------|--------------|-------------------|
| `select` | Dropdown | Einzelauswahl aus Liste | Geschlecht: männlich, weiblich, divers |
| `radio` | Radio Buttons | Exklusive Auswahl | Ja/Nein, Immer/Manchmal/Nie |
| `checkbox` | Checkboxen | Mehrfachauswahl | Symptome: Husten, Fieber, Müdigkeit |

### **1.3 Spezial-Elemente**
| Label ID | Type | Beschreibung | Features |
|----------|------|--------------|----------|
| `voice` | Spracheingabe | Vosk-basierte Transkription | Offline, lokal, 10+ Sprachen |
| `document_upload` | Datei-Upload | OCR-fähiger Upload | PDF, PNG, JPG → Tesseract OCR |
| `encrypted_export` | Export Button | AES-256 verschlüsselter Export | JSON, GDT, E-Mail |

---

## 2️⃣ **FRAGEN-KATALOG (Alle Sektionen)**

### **2.1 Basisdaten (q0000)**
| Frage-ID | Frage | Type | Required | Options |
|----------|-------|------|----------|---------|
| `0000` | Nachname | text | ✅ | - |
| `0001` | Vorname | text | ✅ | - |
| `0002` | Geschlecht | select | ✅ | männlich, weiblich, divers/weiß nicht |
| `0003_tag` | Tag (Geburtsdatum) | select | ✅ | 1-31 |
| `0003_monat` | Monat (Geburtsdatum) | select | ✅ | 1-12 |
| `0003_jahr` | Jahr (Geburtsdatum) | select | ✅ | 1925-2025 |

### **2.2 Organsystem-Beschwerden (q1A00 - q1C15)**

#### **2.2.1 Augenbeschwerden (q1A00)**
| Frage-ID | Frage | Type | Options |
|----------|-------|------|---------|
| `1A00` | Welche Augenbeschwerden haben Sie? | checkbox | Aderhautrötung, Blendempfindlichkeit, Doppelbilder, Gesichtsfeldausfälle, Lichtblitze, Rotes schmerzhaftes Auge, plötzlicher Sehverlust, verschwommenes Sehen, **16 Optionen** |

#### **2.2.2 HNO-Beschwerden (q1B00-q1B15)**
| Frage-ID | Frage | Type | Options |
|----------|-------|------|---------|
| `1B00` | Welche HNO-Beschwerden haben Sie? | checkbox | Hörstörung, Nase, Ohren, Rachen, Schlucken, Schwindel, Stimmstörung |
| `1B01` | Art der Hörstörung | checkbox | Hörsturz, Überempfindlichkeit, vermindertes Hörvermögen, Tinnitus |
| `1B02` | Art der Nasenstörung | checkbox | Geruchsstörung, Nasenbluten, Verstopfte Nase |

#### **2.2.3 Kardiologische Beschwerden (q1C00-q1C15)**
| Frage-ID | Frage | Type | Options |
|----------|-------|------|---------|
| `1C00` | Welche Herz-Kreislauf-Beschwerden haben Sie? | checkbox | Brustschmerz, Herzstolpern, Atemnot, Ohnmacht |

### **2.3 Allgemeine Symptome (q1000-q1835)**

#### **2.3.1 Hauptbeschwerde (q1000)**
| Frage-ID | Frage | Type | Required | Options |
|----------|-------|------|----------|---------|
| `1000` | Haben Sie aktuell Beschwerden? | radio | ✅ | Ja, Nein |

#### **2.3.2 Beschwerdekategorie (q1006)**
| Frage-ID | Frage | Type | Conditional | Options |
|----------|-------|------|-------------|---------|
| `1006` | Welche Art von Beschwerden? | checkbox | if `1000` = "Ja" | Atemprobleme, Magen-Darm-Beschwerden, Hautveränderungen, Herz-Kreislauf, Schmerzen, **20+ Kategorien** |

#### **2.3.3 Atemprobleme (q1020)**
| Frage-ID | Frage | Type | Conditional | Options |
|----------|-------|------|-------------|---------|
| `1020` | Welche Atemprobleme haben Sie? | checkbox | if `1006` includes "Atemprobleme" | Atemnot, Erkältung, Husten, Infektion mit Fieber, Nächtliche Atemaussetzer, Schnarchen |

#### **2.3.4 Magen-Darm-Beschwerden (q1030)**
| Frage-ID | Frage | Type | Conditional | Options |
|----------|-------|------|-------------|---------|
| `1030` | Welche Verdauungs-/Bauchbeschwerden? | checkbox | if `1006` includes "Magen-Darm" | Erbrechen, Bauchschmerz, Blähungen, Durchfall, Reflux, Verstopfung |

#### **2.3.5 Brustschmerz-Detailfragen (q1150-q1153)**
| Frage-ID | Frage | Type | Conditional |
|----------|-------|------|-------------|
| `1150` | Lokalisation des Brustschmerzes | checkbox | if `1050` includes "Brustschmerz" |
| `1151` | Auslöser des Brustschmerzes | checkbox | if `1150` beantwortet |
| `1152` | Zeitprofil (Dauer, Verlauf) | text/select | if `1151` beantwortet |
| `1153` | Begleitsymptome | checkbox | if `1152` beantwortet |

### **2.4 Terminfragen (q2000-q2100)**
| Frage-ID | Frage | Type | Required | Options |
|----------|-------|------|----------|---------|
| `2000` | Termingrund | select | ✅ | Vorsorge, Check-Up, Untersuchung, Notfall |
| `2005` | Sind Sie bereits unser Patient? | radio | ✅ | Ja, Nein |
| `2010` | Gewünschter Arzt | select | ❌ | Dr. Müller, Dr. Schmidt, Dr. Wagner |

### **2.5 Kontaktdaten (q3000-q3005)**
| Frage-ID | Frage | Type | Required |
|----------|-------|------|----------|
| `3000` | Straße & Hausnummer | text | ✅ |
| `3001` | PLZ | text | ✅ |
| `3002` | Ort | text | ✅ |
| `3003` | Handynummer | tel | ✅ |
| `3004` | E-Mail | email | ❌ |
| `3005` | Notfallkontakt | text | ❌ |

### **2.6 Anamnese (q4000-q4140)**

#### **2.6.1 Medikamente (q4000)**
| Frage-ID | Frage | Type | Required |
|----------|-------|------|----------|
| `4000` | Nehmen Sie regelmäßig Medikamente? | radio | ✅ | Ja, Nein |
| `4001` | Welche Medikamente? (Freitext) | textarea | if `4000`="Ja" |

#### **2.6.2 Allergien (q4010)**
| Frage-ID | Frage | Type | Options |
|----------|-------|------|---------|
| `4010` | Bekannte Allergien? | radio | Ja, Nein |
| `4011` | Welche Allergien? | checkbox | Pollen, Hausstaub, Medikamente, Nahrungsmittel, Insektenstiche |
| `4012` | Allergien Freitext | textarea | - |

#### **2.6.3 Vorerkrankungen (q4020-q4030)**
| Frage-ID | Frage | Type | Options |
|----------|-------|------|---------|
| `4020` | Chronische Erkrankungen? | radio | Ja, Nein |
| `4021` | Welche? | checkbox | Diabetes, Bluthochdruck, Asthma, Herzerkrankungen, **50+ Optionen** |

#### **2.6.4 Operationen (q4040)**
| Frage-ID | Frage | Type |
|----------|-------|------|
| `4040` | Frühere Operationen? | radio | Ja, Nein |
| `4041` | Welche Operationen? (Freitext) | textarea |

#### **2.6.5 Familienanamnese (q4050-q4060)**
| Frage-ID | Frage | Type | Options |
|----------|-------|------|---------|
| `4050` | Familienerkrankungen bekannt? | radio | Ja, Nein |
| `4051` | Welche? | checkbox | Herzinfarkt, Schlaganfall, Krebs, Diabetes in der Familie |

### **2.7 Lebensstil (q5000-q5100)**

#### **2.7.1 Rauchen (q5000)**
| Frage-ID | Frage | Type | Options |
|----------|-------|------|---------|
| `5000` | Rauchen Sie? | radio | Ja, Nein, Ex-Raucher |
| `5001` | Zigaretten pro Tag | number | (falls Ja) |
| `5002` | Pack Years (Packungsjahre) | number | (berechnet) |

#### **2.7.2 Alkohol (q5010)**
| Frage-ID | Frage | Type | Options |
|----------|-------|------|---------|
| `5010` | Alkoholkonsum? | radio | Nie, Gelegentlich, Regelmäßig, Täglich |
| `5011` | Gläser pro Woche | number | (falls regelmäßig) |

#### **2.7.3 Bewegung (q5020)**
| Frage-ID | Frage | Type | Options |
|----------|-------|------|---------|
| `5020` | Körperliche Aktivität? | radio | Keine, 1-2x/Woche, 3-5x/Woche, Täglich |

### **2.8 Frauengesundheit (q6000-q6100)**
*(nur sichtbar wenn `0002` = "weiblich")*

| Frage-ID | Frage | Type | Conditional |
|----------|-------|------|-------------|
| `6000` | Sind Sie schwanger? | radio | if Geschlecht=weiblich |
| `6010` | Letzte Menstruation | date | if Geschlecht=weiblich |
| `6020` | Verhütungsmethode | select | if Geschlecht=weiblich |
| `6030` | Anzahl Schwangerschaften | number | if Geschlecht=weiblich |
| `6040` | Anzahl Geburten | number | if Geschlecht=weiblich |
| `6050` | Fehlgeburten/Abbrüche | number | if Geschlecht=weiblich |

### **2.9 Pädiatrie (q1P00-q1P54)**
*(nur sichtbar bei Kindern/Jugendlichen)*

| Frage-ID | Frage | Type |
|----------|-------|------|
| `1P00` | Geburtskomplikationen? | radio |
| `1P10` | Entwicklungsverzögerungen? | checkbox |
| `1P20` | Impfstatus vollständig? | radio |
| `1P30` | Kindergarten/Schule | text |

### **2.10 Diabetes-Screening (q8000-q8100)**
| Frage-ID | Frage | Type |
|----------|-------|------|
| `8000` | Diabetes bekannt? | radio |
| `8010` | Typ 1 oder Typ 2? | radio |
| `8020` | Blutzucker nüchtern | number |
| `8030` | HbA1c-Wert | number |
| `8040` | Insulintherapie? | radio |

### **2.11 Abschluss & Feedback (q9000-q9900)**
| Frage-ID | Frage | Type |
|----------|-------|------|
| `9000` | Weitere Anmerkungen? | textarea |
| `9100` | Wie haben Sie von uns erfahren? | select |
| `9200` | Feedback zur App? | textarea |
| `9900` | DSGVO-Einwilligung | checkbox (required) |

---

## 3️⃣ **STRUKTUR-HIERARCHIE**

```
📦 Anamnese-Fragebogen
├── 📁 1. BASISDATEN (q0000)
│   ├── Name, Vorname
│   ├── Geschlecht
│   └── Geburtsdatum
│
├── 📁 2. TERMINFRAGEN (q2000-q2100)
│   ├── Termingrund
│   ├── Neuer/Bestandspatient
│   └── Arztwunsch
│
├── 📁 3. HAUPTBESCHWERDE (q1000)
│   └── Haben Sie aktuell Beschwerden? (Ja/Nein)
│       ↓ [CONDITIONAL BRANCHING]
│
├── 📁 4. BESCHWERDE-KATEGORIEN (q1006) [nur wenn q1000=Ja]
│   ├── Atemprobleme → q1020
│   ├── Magen-Darm → q1030
│   ├── Hautveränderungen → q1040
│   ├── Herz-Kreislauf → q1050
│   ├── Hormone → q1060
│   ├── Kopfschmerz/Migräne → q1070
│   ├── Schwindel → q1080
│   ├── Fieber → q1090
│   ├── Neurologie → q1100
│   ├── Psyche → q1110
│   ├── Hals → q1120
│   ├── Brustschmerz → q1150-q1153 (detailliert)
│   ├── Gelenke → q1171-q1172
│   └── Muskulatur → q1173
│
├── 📁 5. ORGANSYSTEME (q1A00-q1C15) [immer sichtbar]
│   ├── Augen (q1A00)
│   ├── HNO (q1B00-q1B15)
│   └── Kardiologie (q1C00-q1C15)
│
├── 📁 6. KONTAKTDATEN (q3000-q3005)
│   ├── Adresse
│   ├── Telefon
│   └── E-Mail
│
├── 📁 7. ANAMNESE (q4000-q4140)
│   ├── Medikamente (q4000-q4001)
│   ├── Allergien (q4010-q4012)
│   ├── Vorerkrankungen (q4020-q4030)
│   ├── Operationen (q4040-q4041)
│   └── Familienanamnese (q4050-q4060)
│
├── 📁 8. LEBENSSTIL (q5000-q5100)
│   ├── Rauchen (q5000-q5002)
│   ├── Alkohol (q5010-q5011)
│   └── Bewegung (q5020)
│
├── 📁 9. GESCHLECHTSSPEZIFISCH
│   ├── Frauengesundheit (q6000-q6100) [nur Frauen]
│   └── Pädiatrie (q1P00-q1P54) [nur Kinder]
│
├── 📁 10. SPEZIALTHEMEN (q8000-q8900)
│   ├── Diabetes-Screening (q8000-q8100)
│   ├── Beeinträchtigungen (q8200-q8300)
│   └── Vorsorge (q8500-q8600)
│
└── 📁 11. ABSCHLUSS (q9000-q9900)
    ├── Weitere Anmerkungen
    ├── Feedback
    └── DSGVO-Einwilligung (REQUIRED!)
```

---

## 4️⃣ **FUNKTIONALITÄTEN**

### **4.1 Conditional Logic (Bedingte Anzeige)**
| Regel | Bedingung | Aktion |
|-------|-----------|--------|
| **Beschwerden-Branching** | `q1000` = "Nein" | Überspringe q1006-q1835 |
| **Frauen-Fragen** | `0002` = "weiblich" | Zeige q6000-q6100 |
| **Männer-Fragen** | `0002` = "männlich" | Zeige q7000-q7100 (Urologie) |
| **Neuer Patient** | `q2005` = "Nein" | Zeige Kontaktdaten-Sektion |
| **Brustschmerz Detail** | `1050` includes "Brustschmerz" | Zeige q1150-q1153 (kardiovaskuläres Risiko-Assessment) |
| **Kinder-Modul** | `0003_jahr` > 2005 (Alter < 20) | Zeige Pädiatrie-Sektion q1P00-q1P54 |

### **4.2 Validierung**

#### **4.2.1 Required Fields**
- Alle Basisdaten (Name, Geschlecht, Geburtsdatum)
- DSGVO-Einwilligung (q9900)
- Mindestens eine Beschwerden-Kategorie wenn q1000="Ja"

#### **4.2.2 Format-Validierung**
| Feld | Regel | Fehlermeldung |
|------|-------|---------------|
| E-Mail | RFC 5322 Regex | "Bitte gültige E-Mail eingeben" |
| Telefon | Min 6 Ziffern | "Mindestens 6 Ziffern erforderlich" |
| PLZ | 5 Ziffern (DE) | "Deutsche PLZ: 5 Ziffern" |
| Geburtsdatum | Alter 0-125 Jahre | "Ungültiges Alter" |

#### **4.2.3 Plausibilitätsprüfung (AI-basiert, lokal)**
```javascript
// Rule-based AI (kein externes API)
const plausibilityRules = {
  'red_flag_brustschmerz': {
    condition: ['1050'].includes('Brustschmerz') && ['1153'].includes('Atemnot'),
    severity: 'CRITICAL',
    message: '⚠️ NOTFALL: Brustschmerz + Atemnot → sofort 112!'
  },
  'diabetes_screening': {
    condition: BMI > 30 && age > 45,
    severity: 'WARNING',
    message: 'Diabetes-Screening empfohlen (BMI + Alter)'
  }
};
```

### **4.3 Sprachen (19 Sprachen)**
| Code | Sprache | RTL? | Status |
|------|---------|------|--------|
| `de` | Deutsch | ❌ | ✅ Vollständig |
| `en` | English | ❌ | ✅ Vollständig |
| `fr` | Français | ❌ | ✅ Vollständig |
| `es` | Español | ❌ | ✅ Vollständig |
| `it` | Italiano | ❌ | ✅ Vollständig |
| `tr` | Türkçe | ❌ | ✅ Vollständig |
| `pl` | Polski | ❌ | ✅ Vollständig |
| `ru` | Русский | ❌ | ✅ Vollständig |
| `ar` | العربية | ✅ | ✅ Vollständig |
| `zh` | 中文 | ❌ | ✅ Vollständig |
| `pt` | Português | ❌ | ✅ Vollständig |
| `nl` | Nederlands | ❌ | ✅ Vollständig |
| `uk` | Українська | ❌ | ✅ Vollständig |
| `fa` | فارسی | ✅ | ✅ Vollständig |
| `ur` | اردو | ✅ | ✅ Vollständig |
| `sq` | Shqip | ❌ | ✅ Vollständig |
| `ro` | Română | ❌ | ✅ Vollständig |
| `hi` | हिन्दी | ❌ | ✅ Vollständig |
| `ja` | 日本語 | ❌ | ✅ Vollständig |

#### **RTL-Sprachen benötigen:**
- Rechts-nach-Links Layout
- Gespiegelte Icons
- Umgekehrte Navigations-Richtung

### **4.4 Verschlüsselung (AES-256-GCM)**
```typescript
interface EncryptionConfig {
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2';
  iterations: 600000;
  saltLength: 16; // bytes
  ivLength: 12; // bytes (GCM standard)
  tagLength: 16; // bytes
}

// Verwendung:
// 1. Master-Passwort vom Benutzer → PBKDF2 (600k Iterationen) → 256-bit Key
// 2. Jede Antwort separat verschlüsseln mit uniquem IV
// 3. Export: {encrypted_data, iv, salt, tag}
```

### **4.5 Export-Formate**

#### **4.5.1 JSON Export**
```json
{
  "version": "1.0",
  "timestamp": "2025-12-28T10:30:00Z",
  "patient": {
    "id_encrypted": "...",
    "answers": {
      "0000": "Mustermann",
      "0001": "Max",
      "1000": "Ja"
    }
  },
  "documents": [
    {
      "filename": "befund.pdf",
      "ocr_text": "...",
      "encrypted_blob": "..."
    }
  ]
}
```

#### **4.5.2 GDT Export (Praxissysteme)**
```gdt
013810008000017
013910008001DiggAi GmbH
01413100810020250101
01483100830020251231
014930009206000000001
...
```
**GDT-Felder:**
- 8000: Software-ID
- 8001: Hersteller
- 8100: Datenerstellungsdatum
- 9206: Patientennummer

### **4.6 OCR (Tesseract.js lokal)**
**Unterstützte Formate:**
- PNG, JPG, TIFF (Bilder)
- PDF (via PDF.js → Bilder → OCR)

**Sprachen:**
- `deu` (Deutsch) - Default
- `eng` (English)
- Automatische Spracherkennung

**DSGVO-Garantie:**
- ❌ Keine Google Vision API
- ❌ Keine AWS Textract API
- ✅ 100% lokal im Browser/App

### **4.7 Spracherkennung (Vosk lokal)**
**Modelle:**
- `vosk-model-small-de-0.15` (45 MB) - Deutsch
- `vosk-model-small-en-us-0.15` (40 MB) - English

**Fallback:**
- Browser Speech Recognition API (falls Vosk nicht verfügbar)
- Aber: Sendet Audio an Google → DSGVO-Warnung zeigen!

---

## 5️⃣ **ERWARTUNGEN & TESTS**

### **5.1 Funktionale Tests**
| Test-ID | Feature | Erwartung | Status |
|---------|---------|-----------|--------|
| `T-001` | Basisdaten eingeben | Alle Pflichtfelder validiert | ✅ |
| `T-002` | Conditional Logic | q1000=Nein → q1006 versteckt | ✅ |
| `T-003` | Frauen-Fragen | Nur bei weiblich sichtbar | ✅ |
| `T-004` | Encryption | AES-256 funktioniert | ⏳ Zu testen |
| `T-005` | OCR | PDF → Text korrekt | ⏳ Zu testen |
| `T-006` | GDT Export | PVS-kompatibel | ⏳ Zu testen |
| `T-007` | Offline-Modus | App läuft ohne Internet | ⏳ Zu testen |
| `T-008` | Multi-Language | 19 Sprachen korrekt | ⏳ Zu testen |
| `T-009` | RTL-Layout | Arabisch, Farsi, Urdu | ⏳ Zu testen |

### **5.2 Performance Tests**
| Metrik | Erwartung | Aktuell | Status |
|--------|-----------|---------|--------|
| App-Start | < 3 Sekunden | ? | ⏳ |
| Frage-Wechsel | < 100ms | ? | ⏳ |
| OCR-Verarbeitung | < 5 Sek/Seite | ? | ⏳ |
| Encryption | < 500ms | ? | ⏳ |
| Memory Usage | < 150 MB | ? | ⏳ |

### **5.3 DSGVO-Compliance Tests**
| Test | Prüfpunkt | Erwartung |
|------|-----------|-----------|
| **Art. 13** | Datenschutz-Hinweis vor Nutzung | ✅ Anzeigen |
| **Art. 17** | Recht auf Vergessenwerden | ✅ "Alle Daten löschen" Button |
| **Art. 20** | Datenportabilität | ✅ JSON-Export funktioniert |
| **Art. 30** | Verarbeitungsverzeichnis | ✅ Audit-Log vorhanden |
| **Art. 32** | Verschlüsselung | ✅ AES-256 aktiv |
| **Art. 35** | DSFA | ✅ Dokumentiert |
| **Keine externen APIs** | Tesseract, Vosk lokal | ⚠️ Zu verifizieren |

---

## 6️⃣ **TEXTFELD-BEISPIELE**

### **6.1 Freitext-Felder mit Beispiel-Content**
| Frage-ID | Label | Platzhalter-Text | Max Length |
|----------|-------|------------------|------------|
| `0000` | Nachname | "Mustermann" | 50 |
| `0001` | Vorname | "Max" | 50 |
| `3000` | Straße | "Musterstraße 123" | 100 |
| `3001` | PLZ | "12345" | 5 |
| `3002` | Ort | "Berlin" | 50 |
| `3003` | Handynummer | "+49 170 1234567" | 20 |
| `3004` | E-Mail | "max@beispiel.de" | 100 |
| `4001` | Medikamente | "z.B. Ibuprofen 400mg 2x täglich" | 500 |
| `4012` | Allergien | "z.B. Penizillin, Hausstaub" | 500 |
| `4041` | Operationen | "z.B. Blinddarm 2015, Knie-OP 2020" | 1000 |
| `9000` | Weitere Anmerkungen | "Bitte teilen Sie uns alles Wichtige mit..." | 2000 |
| `9200` | Feedback | "Wie war Ihre Erfahrung mit der App?" | 1000 |

### **6.2 Numerische Felder mit Beispiel-Werten**
| Frage-ID | Label | Beispiel | Min | Max | Einheit |
|----------|-------|----------|-----|-----|---------|
| `5001` | Zigaretten/Tag | 15 | 0 | 100 | Stück |
| `5002` | Pack Years | 10 | 0 | 150 | Jahre |
| `5011` | Alkohol (Gläser/Woche) | 5 | 0 | 70 | Gläser |
| `6030` | Schwangerschaften | 2 | 0 | 20 | Anzahl |
| `8020` | Nüchtern-Blutzucker | 95 | 50 | 400 | mg/dl |
| `8030` | HbA1c | 5.5 | 4.0 | 15.0 | % |

---

## 7️⃣ **ZUSAMMENFASSUNG**

### **Statistik:**
- **Gesamt-Sektionen:** ~200+
- **Gesamt-Fragen:** ~1.500+
- **Pflichtfelder:** ~15
- **Conditional Fields:** ~50
- **Freitext-Felder:** ~30
- **Checkbox-Gruppen:** ~100
- **Select-Felder:** ~40
- **Sprachen:** 19
- **Export-Formate:** 3 (JSON, GDT, E-Mail)
- **Sicherheit:** AES-256-GCM
- **Offline-Fähigkeit:** 100%

### **Nächste Schritte:**
1. ✅ Liste vollständig erstellt
2. ⏳ React Native Projekt aufsetzen
3. ⏳ Domain Models erstellen
4. ⏳ Infrastructure Layer implementieren
5. ⏳ UI Components bauen
6. ⏳ Tests schreiben

---

**Dokument-Ende**
