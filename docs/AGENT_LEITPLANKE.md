# AGENT LEITPLANKE - Anamnese-App
> **Version:** 1.0.0 | **Erstellt:** 2026-01-07 | **Status:** AKTIV

---

## 1. KLARES ZIEL (Mission Statement)

### 1.1 Primärziel
Eine **DSGVO-konforme, offline-first medizinische Anamnese-App** für Windows (React Native Windows) mit:
- **19 Sprachen** inkl. RTL-Unterstützung (Arabisch, Kurmandschi, Türkisch, Farsi, etc.)
- **Vollständiger Fragenkatalog** (11 Sektionen, 100+ Fragen)
- **Datenschutz-Link** in Consent-Screen (alle Sprachen)
- **AES-256 Verschlüsselung** aller Patientendaten
- **GDT-Export** für Praxissysteme

### 1.2 Aktueller Sprint-Fokus
| Priorität | Task | Status |
|-----------|------|--------|
| P0 | Fragebogen-Loading Fix ("wird geladen" Dauerzustand) | 🔄 IN PROGRESS |
| P1 | i18n: 19 Sprachen vollständig + RTL | ⏳ PENDING |
| P2 | Datenschutz-Link im Consent-Screen | ⏳ PENDING |
| P3 | Web-Deployment (Netlify) | ⏳ PENDING |

### 1.3 Erfolgskriterien (Definition of Done)
- [ ] Fragebogen lädt innerhalb 3s, zeigt erste Sektion
- [ ] Alle 19 Sprachen verfügbar, RTL-Layout korrekt
- [ ] Datenschutz-Link öffnet vollständigen Text in gewählter Sprache
- [ ] E2E-Tests grün (Smoke, i18n, Consent)
- [ ] Keine console.error im Production-Build

---

## 2. METHODIK (Evidence-Based Approach)

### 2.1 Diagnose-First Protocol
```
1. REPRO → Problem reproduzieren, Screenshots/Logs sammeln
2. TRACE → Stack-Trace analysieren, Root-Cause identifizieren
3. ISOLATE → Minimales Repro-Szenario erstellen
4. FIX → Gezielte Änderung, keine Shotgun-Debugging
5. VERIFY → Test schreiben, der Fehler abfängt
6. DOCUMENT → Laufbahn-Datei updaten
```

### 2.2 Code-Änderungen
```
REGEL 1: Immer Context lesen bevor Änderung
REGEL 2: Kleinste mögliche Änderung
REGEL 3: Kein Code ohne Test-Plan
REGEL 4: try/catch + finally für async Flows
REGEL 5: Keine PII in Logs
```

### 2.3 Tool-Nutzung
| Tool | Wann nutzen |
|------|-------------|
| `read_file` | Vor jeder Änderung, um Kontext zu verstehen |
| `grep_search` | Wenn exakter String/Pattern bekannt |
| `semantic_search` | Wenn Konzept gesucht, aber Dateiname unbekannt |
| `file_search` | Wenn Dateiname/Pattern bekannt |
| `run_in_terminal` | Build, Test, Server starten |
| `get_errors` | Nach jeder Änderung prüfen |

---

## 3. SPRACHEN (i18n Scope)

### 3.1 Ziel-Sprachen (19 Stück)
| Code | Sprache | Richtung | Status |
|------|---------|----------|--------|
| `de` | Deutsch | LTR | ✅ Vorhanden |
| `en` | English | LTR | ✅ Vorhanden |
| `tr` | Türkisch | LTR | ⏳ Hinzufügen |
| `ar` | Arabisch | **RTL** | ⏳ Hinzufügen |
| `ku` | Kurmandschi | LTR/RTL | ⏳ Hinzufügen |
| `fa` | Farsi/Persisch | **RTL** | ⏳ Hinzufügen |
| `ru` | Russisch | LTR | ⏳ Prüfen |
| `pl` | Polnisch | LTR | ⏳ Prüfen |
| `uk` | Ukrainisch | LTR | ⏳ Prüfen |
| `ro` | Rumänisch | LTR | ⏳ Prüfen |
| `bg` | Bulgarisch | LTR | ⏳ Prüfen |
| `sr` | Serbisch | LTR | ⏳ Prüfen |
| `hr` | Kroatisch | LTR | ⏳ Prüfen |
| `sq` | Albanisch | LTR | ⏳ Prüfen |
| `el` | Griechisch | LTR | ⏳ Prüfen |
| `it` | Italienisch | LTR | ⏳ Prüfen |
| `fr` | Französisch | LTR | ⏳ Prüfen |
| `es` | Spanisch | LTR | ⏳ Prüfen |
| `pt` | Portugiesisch | LTR | ⏳ Prüfen |

### 3.2 i18n-Dateistruktur
```
src/presentation/i18n/
├── locales/
│   ├── de.json          # Deutsch (Referenz)
│   ├── en.json          # English
│   ├── tr.json          # Türkisch
│   ├── ar.json          # Arabisch (RTL)
│   ├── ku.json          # Kurmandschi
│   └── ...
├── i18n.ts              # Konfiguration
└── rtlLanguages.ts      # RTL-Detection
```

### 3.3 Pflicht-Keys pro Sprache
```json
{
  "sections": { ... },      // Alle 11 Sektionen
  "questions": { ... },     // Alle ~100 Fragen
  "options": { ... },       // Ja/Nein/etc.
  "placeholders": { ... },  // Input-Hints
  "common": { ... },        // OK/Fehler/etc.
  "gdpr": {
    "privacyPolicyLink": "...",
    "privacyPolicyTitle": "...",
    "privacyPolicyFullText": "..."
  }
}
```

---

## 4. STRUKTUR (Architektur-Referenz)

### 4.1 Ordnerstruktur (Clean Architecture)
```
src/
├── domain/               # Entities, Interfaces (rein)
│   ├── entities/
│   └── repositories/
├── application/          # Use Cases, Business Logic
│   └── use-cases/
├── infrastructure/       # DB, APIs, externe Services
│   ├── persistence/
│   │   ├── SQLiteQuestionnaireRepository.ts
│   │   └── DatabaseConnection.ts
│   ├── data/
│   │   └── questionnaire-template.json  ← AKTIV
│   └── encryption/
└── presentation/         # UI, State, i18n
    ├── screens/
    │   └── QuestionnaireScreen.tsx
    ├── components/
    ├── state/
    │   └── useQuestionnaireStore.ts
    └── i18n/
        └── locales/
```

### 4.2 Datenfluss
```
[User] → [Screen] → [Zustand Store] → [Use Case] → [Repository] → [SQLite]
                                                              ↓
                                              [questionnaire-template.json]
```

### 4.3 Kritische Dateien
| Datei | Verantwortung |
|-------|---------------|
| `QuestionnaireScreen.tsx` | UI + Load-Logic |
| `useQuestionnaireStore.ts` | Zustand State |
| `LoadQuestionnaireUseCase.ts` | Template laden |
| `SQLiteQuestionnaireRepository.ts` | Template-Import |
| `questionnaire-template.json` | Fragen-Definitionen |
| `de.json` | Deutsche Übersetzungen |

---

## 5. QUALITÄT & MUSTER (Standards)

### 5.1 Code-Standards
```typescript
// ✅ RICHTIG: Reaktive Zustand-Selektoren
const currentSection = useQuestionnaireStore(selectCurrentSection);

// ❌ FALSCH: Nicht-reaktiver Snapshot
const currentSection = selectCurrentSection(useQuestionnaireStore.getState());
```

### 5.2 Error-Handling Pattern
```typescript
const loadData = async () => {
  setLoading(true);
  try {
    const result = await useCase.execute(input);
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setLoading(false);  // IMMER ausführen
  }
};
```

### 5.3 i18n Pattern
```typescript
// ✅ RICHTIG: Mit Fallback
{t('sections.basisdaten', { defaultValue: 'Basisdaten' })}

// ❌ FALSCH: Ohne Fallback
{t('sections.basisdaten')}
```

### 5.4 DSGVO-Compliance
```typescript
// ✅ RICHTIG: Maskierte Logs
console.log('[Load] Patient:', mask(patient.id));

// ❌ FALSCH: PII in Logs
console.log('[Load] Patient:', patient.lastName, patient.email);
```

### 5.5 Test-Anforderungen
```
PFLICHT:
- Unit-Test für jeden Use Case
- E2E-Smoke: App startet ohne Crash
- E2E-i18n: Sprache wechseln funktioniert
- E2E-Consent: Link klickbar, öffnet Datenschutz
```

---

## 6. BEFEHLE & WORKFLOWS

### 6.1 Development
```powershell
# Metro starten (separates Fenster)
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PWD'; yarn start --reset-cache`""

# App starten
explorer.exe "shell:AppsFolder\cc3a5ac8-ac09-4f03-b6c9-0cfd812841a0_4dnmwfyw5v01r!App"

# TypeScript prüfen
npx tsc --noEmit

# Tests
yarn test
yarn test:e2e
```

### 6.2 Build & Deploy
```powershell
# Windows Build
npx react-native run-windows --arch x64

# App registrieren (nach Build)
Add-AppxPackage -Register ".\windows\x64\Debug\anamnese-mobile\AppxManifest.xml"
```

---

## 7. ANTI-HALLUZINATIONS-REGELN

```
REGEL 1: Wenn Datei nicht im Kontext → read_file ZUERST
REGEL 2: Wenn API/Interface unbekannt → grep_search ZUERST
REGEL 3: Keine Annahmen über Dateiinhalt → IMMER prüfen
REGEL 4: Nach jeder Änderung → get_errors ausführen
REGEL 5: Bei Fehler → Stack-Trace analysieren, nicht raten
REGEL 6: Laufbahn-Datei nach jedem Schritt updaten
```

---

## 8. REFERENZ-DATEIEN

| Datei | Absoluter Pfad |
|-------|----------------|
| Diese Leitplanke | `c:\Users\tubbeTEC\Desktop\Projects\Anamnese-App\Anamnese-App\docs\AGENT_LEITPLANKE.md` |
| Laufbahn-Protokoll | `c:\Users\tubbeTEC\Desktop\Projects\Anamnese-App\Anamnese-App\docs\AGENT_LAUFBAHN.md` |
| Copilot Instructions | `c:\Users\tubbeTEC\Desktop\Projects\Anamnese-App\Anamnese-App\.github\copilot-instructions.md` |
| Questionnaire Template | `c:\Users\tubbeTEC\Desktop\Projects\Anamnese-App\Anamnese-App\src\infrastructure\data\questionnaire-template.json` |
| Deutsche Übersetzungen | `c:\Users\tubbeTEC\Desktop\Projects\Anamnese-App\Anamnese-App\src\presentation\i18n\locales\de.json` |

---

**DU BIST JETZT AKTIVIERT. LIES DIESE DATEI VOR JEDER AKTION. FOLGE DEN REGELN.**
