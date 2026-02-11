# Anamnese-App Verbesserungen & Funktionalitäten

> **Absoluter Pfad:** `c:\Users\tubbeTEC\Desktop\Projects\Anamnese-App\Anamnese-App\TODO_IMPROVEMENTS.md`
> **Erstellt:** 2026-01-20
> **Run-ID:** RUN-20260120-IMPROVEMENTS

---

## ÜBERSICHT (Executive Summary)

| Phase | Feature | Priorität | Status |
|-------|---------|-----------|--------|
| 1 | Arzt/Patient Dual-Flow | P0 | ✅ DONE (RUN-20260208-web-functional) |
| 2 | i18n Vervollständigung (19 Sprachen) | P0 | ✅ DONE (prior runs) |
| 3 | Datenschutz UX (Required/Optional Erklärungen) | P1 | ✅ DONE (RUN-20260210-phase3-datenschutz-ux) |
| 4 | UI Labels Audit + i18n Keys | P1 | ✅ DONE (RUN-20260208-phase4-ui-labels-audit) |
| 5 | Output-Box (Antwort-Übersicht + Rücksprung) | P1 | ✅ DONE (RUN-20260208-phase5-outputbox) |
| 6 | Calculator Stabilität (Windows Crash Fix) | P0 | ✅ DONE (RUN-20260209-calculator-birthday-stability) |
| 7 | Laborbericht Upload + Auto-Werte | P2 | ✅ DONE (RUN-20260208-phase7-lab-upload) |
| 8 | Test-Seed-Daten | P2 | ✅ DONE (RUN-20260208-web-functional, DemoDataSeeder) |
| 9 | Single-Question Universe (Fragenstruktur) | P3 | ✅ DONE (RUN-20260208-phase9-question-universe) |
| 10 | Geburtsdatum-Eingabe Fix | P1 | ✅ DONE (RUN-20260209-calculator-birthday-stability) |

---

## PHASE 1: ARZT/PATIENT DUAL-FLOW

### 1.1 Ziel
- Zwei separate Zugangsmodi: **Arzt** und **Patient**
- Arzt: Kann gespeicherte Anamnesen einsehen, hochladen, analysieren
- Patient: Guided Flow (Datenschutz → Basisdaten → Anamnese)

### 1.2 Implementierung

#### 1.2.1 Neue Dateien
- [ ] `src/domain/entities/UserRole.ts` - Rolle (Arzt/Patient) als Enum
- [ ] `src/presentation/screens/RoleSelectionScreen.tsx` - Einstiegsbildschirm zur Rollenwahl
- [ ] `src/presentation/context/RoleContext.tsx` - React Context für aktuelle Rolle

#### 1.2.2 Änderungen
- [ ] `src/presentation/navigation/RootNavigator.tsx` - RoleSelection als Start, bedingte Navigation
- [ ] `src/presentation/screens/HomeScreen.tsx` - UI angepasst je nach Rolle
- [ ] `src/presentation/screens/SavedAnamnesesScreen.tsx` - Arzt-only Zugriff oder eingeschränkte Patient-Ansicht

#### 1.2.3 Arzt-spezifische Features
- [ ] Upload-Button für externe Anamnesen (DocumentPicker)
- [ ] Analyse-Ansicht für hochgeladene Daten
- [ ] Erweiterte Filter/Sortierung

#### 1.2.4 Patient-spezifische Features
- [ ] Vereinfachter Flow ohne Upload
- [ ] Nur eigene Daten sichtbar
- [ ] GDPR-fokussierte Hinweise

### 1.3 Tests
- [ ] `__tests__/domain/entities/UserRole.test.ts`
- [ ] `__tests__/presentation/screens/RoleSelectionScreen.test.tsx`

### 1.4 Verification
- `npm run type-check` ✅
- `npm test` ✅
- Manueller Test: Beide Flows durchspielen

---

## PHASE 2: I18N VERVOLLSTÄNDIGUNG (19 SPRACHEN)

### 2.1 Aktueller Stand
**Vorhandene Sprachen (19):** de, en, fr, es, it, pt, nl, pl, tr, ru, ar, fa, zh, ja, ko, vi, uk, ro, el

### 2.2 Fehlende Übersetzungen prüfen
- [ ] Audit: Alle UI-Strings in `src/presentation/i18n/locales/*.json`
- [ ] Fehlende Keys identifizieren (Script: `scripts/audit-i18n-keys.js`)
- [ ] RTL-Sprachen (ar, fa) auf korrekte Darstellung prüfen

### 2.3 Neue Keys hinzufügen
- [ ] `roleSelection.*` - Rollenwahl-Texte
- [ ] `consent.explanation.*` - Required/Optional Erklärungen
- [ ] `outputBox.*` - Output-Box Texte
- [ ] `calculator.errors.*` - Fehler-Meldungen
- [ ] `labUpload.*` - Laborbericht-Texte

### 2.4 Tests
- [ ] `src/presentation/i18n/__tests__/locales.test.ts` erweitern

---

## PHASE 3: DATENSCHUTZ UX VERBESSERUNGEN

### 3.1 Ziel
- Klare Erklärungen **warum** ein Feld required/optional ist
- Popup/Tooltip bei jedem consent-relevanten Feld
- Transparenz: Was passiert wenn nicht angehakt?

### 3.2 Implementierung

#### 3.2.1 Neue Komponenten
- [ ] `src/presentation/components/ConsentTooltip.tsx` - Info-Icon mit Popup
- [ ] `src/presentation/components/FieldExplanation.tsx` - Inline-Erklärung unter Feldern

#### 3.2.2 Änderungen
- [ ] `src/presentation/screens/GDPRConsentScreen.tsx`:
  - Required-Felder: Erklärung warum required
  - Optional-Felder: Was passiert ohne Consent?
- [ ] `src/presentation/screens/PatientInfoScreen.tsx`:
  - E-Mail/Handy: Erklärung warum optional (Kommunikation)
  - Hinweis: "Ohne Angabe keine Benachrichtigung möglich"

### 3.3 i18n Keys
```json
{
  "consent": {
    "dataProcessingWhy": "Erforderlich für die medizinische Auswertung Ihrer Anamnese.",
    "dataStorageWhy": "Erforderlich um Ihre Daten lokal zu speichern.",
    "gdtExportWhy": "Optional: Ermöglicht Export an Praxissoftware.",
    "gdtExportWithout": "Ohne: Kein automatischer Export möglich.",
    "ocrWhy": "Optional: Ermöglicht Analyse von Laborberichten.",
    "ocrWithout": "Ohne: Manuelle Eingabe der Laborwerte.",
    "voiceWhy": "Optional: Ermöglicht Spracheingabe.",
    "voiceWithout": "Ohne: Nur Texteingabe möglich."
  },
  "patientInfo": {
    "emailWhy": "Optional: Für Rückfragen oder Benachrichtigungen.",
    "emailWithout": "Ohne: Keine E-Mail-Kommunikation möglich.",
    "phoneWhy": "Optional: Für dringende Rückfragen.",
    "phoneWithout": "Ohne: Keine telefonische Kontaktaufnahme."
  }
}
```

### 3.4 Tests
- [ ] `__tests__/presentation/components/ConsentTooltip.test.tsx`

---

## PHASE 4: UI LABELS AUDIT

### 4.1 Ziel
- Alle Placeholders durch echte Labels ersetzen
- Alle Labels als i18n Keys definieren
- Kein hardcoded Text in UI

### 4.2 Audit-Liste
| Screen | Element | Aktuell | Ziel |
|--------|---------|---------|------|
| SavedAnamnesesScreen | Search Input | placeholder only | + label |
| CalculatorScreen | Numeric Inputs | placeholder "z.B. 120" | i18n key |
| ExportScreen | Sender ID | placeholder "PRAXIS01" | i18n key |
| PatientInfoScreen | All Fields | ✅ labels vorhanden | verify i18n |
| QuestionCard | Question Text | template text | verify i18n mapping |

### 4.3 Implementierung
- [ ] Script erstellen: `scripts/audit-ui-labels.js`
- [ ] Alle hardcoded Strings identifizieren
- [ ] i18n Keys anlegen
- [ ] Komponenten aktualisieren

---

## PHASE 5: OUTPUT-BOX (ANTWORT-ÜBERSICHT)

### 5.1 Ziel
- Persistente Box zeigt alle bisherigen Antworten
- Klick auf Item → Rücksprung zur Frage
- Option: Weiter von dort oder zurück zur Box

### 5.2 Implementierung

#### 5.2.1 Neue Komponenten
- [ ] `src/presentation/components/OutputBox.tsx` - Collapsible Answer Summary
- [ ] `src/presentation/components/AnswerItem.tsx` - Einzelne Antwort mit Jump-Link

#### 5.2.2 State Management
- [ ] `src/presentation/state/useOutputBoxStore.ts` - Zustand der Box (collapsed/expanded)
- [ ] Integration mit `useQuestionnaireStore.ts` - Antworten lesen

#### 5.2.3 Navigation
- [ ] Jump-to-Question Logik in `QuestionnaireScreen.tsx`
- [ ] "Weiter von hier" vs "Zurück zur Box" Buttons

### 5.3 i18n Keys
```json
{
  "outputBox": {
    "title": "Ihre Antworten",
    "empty": "Noch keine Antworten",
    "jumpTo": "Zur Frage springen",
    "continueFrom": "Von hier fortfahren",
    "backToSummary": "Zurück zur Übersicht"
  }
}
```

### 5.4 Tests
- [ ] `__tests__/presentation/components/OutputBox.test.tsx`

---

## PHASE 6: CALCULATOR STABILITÄT

### 6.1 Problem
- Kardiovaskulärer Rechner crasht auf Windows bei Berechnung
- Vermutung: Division by zero oder NaN handling

### 6.2 Diagnose
- [ ] `src/domain/services/ClinicalCalculators.ts` prüfen
- [ ] `src/presentation/screens/CalculatorScreen.tsx` prüfen
- [ ] Windows-spezifische Logs sammeln

### 6.3 Fix-Strategie
- [ ] Input Validation vor Berechnung
- [ ] NaN/Infinity Guards
- [ ] Try-Catch um alle Berechnungen
- [ ] User-friendly Error Messages

### 6.4 Tests
- [ ] Edge Cases in `src/domain/services/__tests__/ClinicalCalculators.test.ts`
- [ ] NaN, Infinity, negative Werte, leere Strings

---

## PHASE 7: LABORBERICHT UPLOAD

### 7.1 Ziel
- Arzt kann Laborberichte hochladen (PDF/Bild)
- OCR extrahiert Werte automatisch
- Werte werden in Calculator übernommen

### 7.2 Abhängigkeiten
- Vorhandene Entities: `src/domain/entities/Document.ts`
- Vorhandenes Repository: `src/infrastructure/persistence/SQLiteDocumentRepository.ts`
- OCR Consent muss aktiv sein

### 7.3 Implementierung

#### 7.3.1 Neue Dateien
- [ ] `src/application/use-cases/UploadLabReportUseCase.ts`
- [ ] `src/infrastructure/ocr/LabValueParser.ts` - Extrahiert bekannte Laborwerte
- [ ] `src/presentation/screens/LabUploadScreen.tsx`

#### 7.3.2 Änderungen
- [ ] `src/presentation/screens/CalculatorScreen.tsx` - "Werte importieren" Button
- [ ] `src/presentation/navigation/RootNavigator.tsx` - LabUpload Route

### 7.4 i18n Keys
```json
{
  "labUpload": {
    "title": "Laborbericht hochladen",
    "selectFile": "Datei auswählen",
    "processing": "Wird analysiert...",
    "valuesFound": "{{count}} Werte erkannt",
    "importValues": "Werte übernehmen",
    "noValues": "Keine Werte erkannt",
    "ocrRequired": "OCR-Zustimmung erforderlich"
  }
}
```

---

## PHASE 8: TEST-SEED-DATEN

### 8.1 Ziel
- Demo-Daten für Testing
- Vorgefüllte Anamnese zum Durchspielen
- Beispiel-Laborwerte

### 8.2 Implementierung
- [ ] `scripts/seed-test-data.ts` - Generiert Testdaten
- [ ] `src/infrastructure/data/test-fixtures/` - JSON Fixtures
  - [ ] `sample-patient.json`
  - [ ] `sample-anamnesis.json`
  - [ ] `sample-lab-values.json`
- [ ] Dev-only Button im DataManagementScreen

---

## PHASE 9: SINGLE-QUESTION UNIVERSE

### 9.1 Ziel
- Jede Frage als eigenständige Einheit für Statistik/Forschung
- Eindeutige IDs für Fragen
- Strukturierte Metadaten

### 9.2 Aktueller Stand
- Fragen sind im Template als Array
- Section-basierte Navigation
- Keine persistente Fragen-ID

### 9.3 Zukünftige Struktur
```typescript
interface QuestionUniverse {
  id: string;           // UUID, persistent
  templateId: string;   // Referenz zum Template
  order: number;        // Reihenfolge
  section: string;      // Zugehörige Section
  type: QuestionType;
  metadata: {
    statisticGroup?: string;
    researchTag?: string[];
    icd10Mapping?: string[];
  };
}
```

### 9.4 Migration
- [ ] Template-Struktur erweitern
- [ ] Bestehende Antworten migrieren
- [ ] Export-Format anpassen

---

## PHASE 10: GEBURTSDATUM-EINGABE FIX

### 10.1 Problem
- Jahr muss zuerst gewählt werden damit andere Felder funktionieren
- Keine klare Anweisung für User

### 10.2 Lösung
- [ ] Hinweistext: "Bitte zuerst das Jahr wählen"
- [ ] Oder: Felder freischalten nach Jahr-Auswahl
- [ ] Alternative: Einzelnes Datumfeld statt 3 Dropdowns

### 10.3 Betroffene Dateien
- [ ] `src/presentation/screens/PatientInfoScreen.tsx`
- [ ] `src/presentation/components/QuestionCard.tsx` (Datumsfragen)

---

## EXECUTION ORDER

1. **Phase 6** - Calculator Stabilität (Blocker für Testing)
2. **Phase 10** - Geburtsdatum Fix (Quick Win)
3. **Phase 3** - Datenschutz UX (Compliance)
4. **Phase 1** - Dual-Flow (Core Feature)
5. **Phase 5** - Output-Box (UX)
6. **Phase 4** - UI Labels Audit
7. **Phase 2** - i18n Vervollständigung
8. **Phase 8** - Test-Seed-Daten
9. **Phase 7** - Laborbericht Upload
10. **Phase 9** - Single-Question Universe (Future)

---

## VERIFICATION CHECKLIST

Nach jeder Phase:
- [ ] `npm run type-check` ✅
- [ ] `npm test` ✅
- [ ] Manueller Test auf Windows
- [ ] LAUFBAHN.md aktualisiert
- [ ] i18n Keys in allen 19 Sprachen

---

## AKTUELLER STATUS

| Phase | Status | Letzte Änderung |
|-------|--------|-----------------|
| 1 | ✅ DONE | RUN-20260208-web-functional |
| 2 | ✅ DONE | prior runs |
| 3 | ✅ DONE | RUN-20260210-phase3-datenschutz-ux |
| 4 | ✅ DONE | RUN-20260208-phase4-ui-labels-audit |
| 5 | ✅ DONE | RUN-20260208-phase5-outputbox |
| 6 | ✅ DONE | RUN-20260209-calculator-birthday-stability |
| 7 | ✅ DONE | RUN-20260208-phase7-lab-upload |
| 8 | ✅ DONE | RUN-20260208-web-functional |
| 9 | ✅ DONE | RUN-20260208-phase9-question-universe |
| 10 | ✅ DONE | RUN-20260209-calculator-birthday-stability |
