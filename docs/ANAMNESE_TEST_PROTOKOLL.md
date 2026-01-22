# ANAMNESE TEST-PROTOKOLL

> **Datum:** 2026-01-09
> **Tester:** Agent (Copilot)
> **Version:** 2.0.0
> **Status:** 🔄 IN PROGRESS (Build läuft)

---

## FRAGEBOGEN-STRUKTUR (questionnaire-template.json)

Der Fragebogen besteht aus **11 Sektionen** mit insgesamt ~70+ Fragen:

### Sektion 1: Basisdaten (q0000) - Order 1
| ID | Typ | Frage | Pflicht |
|----|-----|-------|---------|
| 0000 | text | Nachname | ✅ |
| 0001 | text | Vorname | ✅ |
| 0002 | select | Geschlecht (m/w/d) | ✅ |
| 0003 | date | Geburtsdatum | ✅ |
| 0003_tag | number | Tag (1-31) | ❌ |
| 0003_monat | number | Monat (1-12) | ❌ |
| 0003_jahr | number | Jahr (1900-2100) | ❌ |

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: Basisdaten-Sektion ausgefüllt]**

### Sektion 2: Beschwerden (q1000) - Order 2
| ID | Typ | Frage | Condition |
|----|-----|-------|-----------|
| 1000 | select | Haben Sie aktuell Beschwerden? | - |
| 1001 | textarea | Beschwerden Freitext | 1000=Ja |
| 1002 | select | Fieber? | 1000=Ja |
| 1003 | select | Schmerzen? | 1000=Ja |
| 1004 | select | Übelkeit? | 1000=Ja |
| 1005 | select | Atemnot? | 1000=Ja |
| 1006 | multiselect | Bildgebung (CT/MRT/Röntgen/Sono...) | 1000=Ja |
| 1007 | select | Kreatinin bekannt? | 1006 contains Angio |
| 1007_text | text | Kreatinin-Wert | 1007=Ja |

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: Beschwerden-Sektion mit Conditional Logic]**

### Sektion 3: Terminvereinbarung (q2000) - Order 3
| ID | Typ | Frage |
|----|-----|-------|
| 2000 | select | Ambulant/Stationär | ✅ |
| 2001 | text | Station |
| 2002 | date | Termin-Datum |
| 2003 | text | Uhrzeit |
| 2004 | select | Untersuchungsart |
| 2005 | text | Untersuchung Freitext |

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: Terminvereinbarung-Sektion]**

### Sektion 4: Adressdaten (q3000) - Order 4
| ID | Typ | Frage | Condition |
|----|-----|-------|-----------|
| 3000 | text | Straße | - |
| 3001 | text | PLZ | - |
| 3002 | text | Wohnort | - |
| 3003 | text | Telefon privat | - |
| 3004 | text | Telefon mobil | - |
| 3005 | text | E-Mail | - |
| 3006 | select | Hausarzt vorhanden? | - |
| 3007-3012 | text | Hausarzt-Daten | 3006=Ja |
| 3013 | select | Überweiser vorhanden? | - |
| 3014-3019 | text | Überweiser-Daten | 3013=Ja |

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: Adressdaten mit Hausarzt-Conditional]**

### Sektion 5: Körpermaße (q4000) - Order 5
| ID | Typ | Frage | Validation |
|----|-----|-------|------------|
| 4000 | number | Größe (cm) | 30-300 |
| 4001 | number | Gewicht (kg) | 1-500 |
| 4002 | select | Raucher-Status | - |

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: Körpermaße-Eingabe]**

### Weitere Sektionen (q5000-q10000):
- **q5000**: Schwangerschaft/Stillzeit
- **q6000**: Allergien
- **q7000**: Medikamente
- **q8000**: Vorerkrankungen
- **q9000**: Implantate/Prothesen
- **q10000**: Kontrastmittel

---

## TEST-ABLAUF

### Phase 1: App-Start
- [ ] `npm run windows` erfolgreich
- [ ] App öffnet sich
- [ ] HomeScreen wird angezeigt

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: HomeScreen nach App-Start]**

### Phase 2: Neuer Patient
- [ ] "Neuer Patient" Button klicken
- [ ] GDPR Consent Screen erscheint
- [ ] Consent bestätigt
- [ ] PatientInfoScreen erscheint

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: PatientInfoScreen]**

### Phase 3: Fragebogen durchlaufen
- [ ] Sektion 1 (Basisdaten) ausfüllen
- [ ] Sektion 2 (Beschwerden) → Conditional Logic testen
- [ ] Sektion 3 (Terminvereinbarung) ausfüllen
- [ ] Sektion 4 (Adressdaten) → Hausarzt Conditional testen
- [ ] Sektion 5-10 durchlaufen
- [ ] Progress-Bar zeigt korrekten Fortschritt

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: Fortschrittsanzeige bei 50%]**

### Phase 4: Zusammenfassung
- [ ] SummaryScreen wird angezeigt
- [ ] Alle Antworten sind korrekt dargestellt
- [ ] Export-Funktion funktioniert

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: SummaryScreen mit Antworten]**

### Phase 5: Voice Integration
- [ ] VoiceScreen öffnen
- [ ] Sprache auswählen (DE/EN/etc.)
- [ ] Mikrofon aktivieren
- [ ] Spracheingabe wird erkannt

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: VoiceScreen mit Spracheingabe]**

### Phase 6: Feedback Loop
- [ ] FeedbackScreen öffnen
- [ ] Feedback eingeben
- [ ] mailto: Link funktioniert ODER Clipboard Copy

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: FeedbackScreen ausgefüllt]**

---

## BUILD-LOG

```
Build gestartet: 2026-01-09 19:41:42
Status: Building Solution (C++ Kompilierung)
Warnings: 3 (non-blocking)
Errors: 0
```

---

## ERGEBNISSE

| Test | Status | Notizen |
|------|--------|---------|
| App-Start | 🔄 | Build läuft |
| Neuer Patient | ⏳ | Ausstehend |
| Fragebogen | ⏳ | Ausstehend |
| Conditional Logic | ⏳ | Ausstehend |
| Voice Integration | ⏳ | Ausstehend |
| Feedback Loop | ⏳ | Ausstehend |
| Export | ⏳ | Ausstehend |

---

## NEXT STEPS

1. Warten auf Build-Abschluss
2. App manuell durchklicken
3. Screenshots erstellen
4. Dieses Dokument mit Ergebnissen aktualisieren
