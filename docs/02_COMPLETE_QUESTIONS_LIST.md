# 📋 Vollständige Fragenliste - Alle Sektionen

**Generiert am:** 2025-12-28  
**Quelle:** `questionnaire_structure_summary.json`

---

## Sektion q0000: Basisdaten

| ID | Frage | Type | Required | Optionen |
|----|-------|------|----------|----------|
| 0000 | Nachname | text | ✅ | - |
| 0001 | Vorname | text | ✅ | - |
| 0002 | Geschlecht | select | ✅ | männlich, weiblich, divers/weiß nicht |
| 0003_tag | Tag (Geburtsdatum) | select | ✅ | 1-31 |
| 0003_monat | Monat (Geburtsdatum) | select | ✅ | 1-12 |
| 0003_jahr | Jahr (Geburtsdatum) | select | ✅ | 1925-2025 |

---

## Sektion q1A00: Augenbeschwerden

| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1A00 | Welche Augenbeschwerden haben Sie? | checkbox | Aderhautrötung, Blendempfindlichkeit, Doppelbilder, eingeschränkte Beweglichkeit, Gesichtsfeldausfälle, Lichtblitze, Lidschluss nicht möglich, Rotes schmerzhaftes Auge, Rußregen, plötzlicher Sehverlust, Schmerz hinter dem Auge, Schwellung und Rötung, vermehrter Tränenfluss, verminderte Augenbeweglichkeit, verschwommenes/unscharfes Sehen, Schleiersehen |

---

## Sektion q1B00-q1B15: HNO-Beschwerden

### q1B00: HNO-Hauptkategorien
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1B00 | Welche HNO-Beschwerden haben Sie? | checkbox | Hörstörung, Nase, Ohren, Rachen, Schlucken, Schwindel, Stimmstörung |

### q1B01: Hörstörung
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1B01 | Art der Hörstörung | checkbox | Hörsturz, Überempfindlichkeit, vermindertes Hörvermögen, Ohrgeräusche/Tinnitus, Tonhöhenverzerrung |

### q1B02: Nasenstörung
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1B02 | Art der Nasenstörung | checkbox | Geruchsstörung, Borkenbildung, Eiterabsonderung, Formveränderung, Laufende Nase, Nasenbluten, Verstopfte Nase |

### q1B03: Ohrenbeschwerden
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1B03 | Ohrenbeschwerden | checkbox | Absonderung, Juckreiz, Ohrenschmerzen, Schmerz hinter dem Ohr, Schwellung/Rötung |

### q1B04: Rachenbeschwerden
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1B04 | Rachenbeschwerden | checkbox | Auswurf, Bläschen/Geschwüre, Halsschmerzen, Schluckstörung, trockener Hals |

### q1B05: Stimmstörung
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1B05 | Art der Stimmstörung | checkbox | Heiserkeit, raue Stimme, Überbeanspruchung, veränderter Stimmklang |

---

## Sektion q1C00-q1C15: Kardiologische Beschwerden

### q1C00: Kardiologie Hauptkategorien
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1C00 | Herz-Kreislauf-Beschwerden | checkbox | Brustschmerz, Herzstolpern, Atemnot, Ohnmacht, Beinschmerzen beim Gehen |

---

## Sektion q1000: Hauptbeschwerde

| ID | Frage | Type | Required | Optionen |
|----|-------|------|----------|----------|
| 1000 | Haben Sie aktuell Beschwerden? | radio | ✅ | Ja, Nein |

**WICHTIG:** Diese Frage steuert die gesamte Conditional Logic! Wenn "Nein", werden q1006-q1835 übersprungen.

---

## Sektion q1006: Beschwerdekategorien
*(nur sichtbar wenn q1000 = "Ja")*

| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1006 | Welche Art von Beschwerden haben Sie? | checkbox | Atemprobleme, Magen-Darm-Beschwerden, Hautveränderungen, Herz-Kreislauf, Hormone, Kopfschmerz/Migräne, Schwindel, Fieber, Neurologische Symptome, Psychische Beschwerden, Halsbeschwerden, Gelenkbeschwerden, Muskuläre Beschwerden, Brustschmerz |

**Conditional Branching:**
- "Atemprobleme" → q1020
- "Magen-Darm-Beschwerden" → q1030
- "Hautveränderungen" → q1040
- "Herz-Kreislauf" → q1050
- "Brustschmerz" → q1150-q1153 (detailliert!)

---

## Sektion q1020: Atemprobleme
*(nur sichtbar wenn q1006 includes "Atemprobleme")*

| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1020 | Welche Atemprobleme haben Sie? | checkbox | Atemnot, Erkältung, Husten, Infektion mit Fieber (Bronchitis/Lungenentzündung), Nächtliche Atemaussetzer, Schnarchen, Beklemmung im Brustkorb |

---

## Sektion q1030: Magen-Darm-Beschwerden
*(nur sichtbar wenn q1006 includes "Magen-Darm-Beschwerden")*

| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1030 | Welche Verdauungs-/Bauchbeschwerden? | checkbox | Erbrechen, Bauchschmerz, Blähungen, Durchfall, Koliken, Reflux, Verstopfung |
| 1030_freitext | Weitere Details | textarea | - |

---

## Sektion q1040: Hautveränderungen

| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1040 | Welche Hautveränderungen haben Sie? | checkbox | Ausschlag, Ekzem, Juckreiz, Wunden/Geschwüre |
| 1040_freitext | Weitere Details | textarea | - |

---

## Sektion q1050: Herz-Kreislauf-Beschwerden

| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1050 | Welche Herz-Kreislauf-Beschwerden? | checkbox | Bluthochdruck, Brustschmerz/Angina Pectoris, Herzstolpern, Hypotonie/niedriger Blutdruck, Ohnmachtsanfälle/Schwindel |

**WICHTIG:** Wenn "Brustschmerz/Angina Pectoris" ausgewählt → q1150-q1153 aktivieren (Red Flag Assessment!)

---

## Sektion q1060: Hormonelle Beschwerden

| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1060 | Hormonell bedingte Beschwerden | checkbox | Gewichtsschwankungen, Appetitstörungen, Hitzewallungen, Nachtschweiß, Haarausfall, Libidoverlust |

---

## Sektion q1070: Kopfschmerz/Migräne

| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1070 | Kopfschmerzart | checkbox | Spannungskopfschmerz, Migräne, Cluster-Kopfschmerz, Druckgefühl, plötzlicher stärkster Kopfschmerz |

---

## Sektion q1150-q1153: Brustschmerz-Detail (Red Flag Assessment)
*(nur wenn q1050 includes "Brustschmerz")*

### q1150: Lokalisation
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1150 | Wo genau ist der Brustschmerz? | checkbox | retrosternal (hinter Brustbein), links, rechts, diffus |

### q1151: Auslöser
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1151_trigger | Auslöser des Brustschmerzes | checkbox | körperliche Anstrengung, psychische Belastung, Kälte, Wind, schwere Mahlzeiten, Ruheangina vorhanden, morgens in Ruhe, nachts in Ruhe |
| 1151_ruhebesserung | Besserung in Ruhe? | radio | Ja, Nein |
| 1151_ntg | Wirkung von Nitroglyzerin? | radio | Ja, Nein |
| 1151_ntg_min | Wirkung nach wie vielen Minuten? | text | - |

### q1152: Zeitprofil
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1152_dauer_min | Dauer einer Episode (Minuten) | number | - |
| 1152_verlauf_select | Verlauf | select | neu, progredient, gleichbleibend |
| 1152_erstauftreten_select | Erstauftreten seit wann | select | akut, wenige Tage, länger als 1 Woche |

### q1153: Begleitsymptome (NOTFALL-Indikatoren!)
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1153_begleit | Begleitsymptome | checkbox | Dyspnoe (Atemnot), Schwitzen, Übelkeit/Erbrechen, Schwindel/Präsynkope/Synkope, Palpitationen |
| 1153_nicht_isch | Nicht-ischämische Hinweise | checkbox | atemabhängig, lageabhängig, Palpationsschmerz, Hustenassoziation, Schluckassoziation, Sodbrennen |

**⚠️ RED FLAG RULE:**  
Wenn `1153_begleit` includes "Dyspnoe" UND `1152_verlauf_select` = "neu" → **NOTFALL-Warnung anzeigen: "Sofort 112 anrufen!"**

---

## Sektion q1171-q1173: Gelenkbeschwerden

### q1171: Art der Gelenkbeschwerden
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1171 | Art der Gelenkbeschwerden | checkbox | Berührungsschmerz, Bewegungsschmerz, Formabweichung/Auftreibung, Überwärmung, Rötung, Schwellung, Steifigkeit |

### q1172: Betroffene Gelenke
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1172 | Welche Gelenke? | checkbox | Hand, Finger, Ellenbogen, Schulter, Hüfte, Knie, Fußgelenk, Wirbelsäule |

### q1173: Muskuläre Beschwerden
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 1173 | Muskelbeschwerden | checkbox | Schwäche, Krämpfe, Verspannungen, Zuckungen, Lähmungen |

---

## Sektion q2000-q2100: Terminfragen

### q2000: Termingrund
| ID | Frage | Type | Required | Optionen |
|----|-------|------|----------|----------|
| 2000 | Grund Ihres Termins | select | ✅ | Vorsorgeuntersuchung, Check-Up, Akute Beschwerden, Notfall, Rezept abholen, Befundbesprechung, Nachsorge, Impfung |

### q2005: Neuer Patient
| ID | Frage | Type | Required | Optionen |
|----|-------|------|----------|----------|
| 2005 | Sind Sie bereits unser Patient? | radio | ✅ | Ja, Nein |

**Conditional:** Wenn "Nein" → Kontaktdaten-Sektion q3000-q3005 wird Pflicht!

### q2010: Arztwunsch
| ID | Frage | Type | Optionen |
|----|-------|------|----------|
| 2010 | Arztwunsch (optional) | select | Dr. Müller, Dr. Schmidt, Dr. Wagner, Kein Wunsch |

---

## Sektion q3000-q3005: Kontaktdaten
*(Pflicht wenn q2005 = "Nein")*

| ID | Frage | Type | Required | Validation |
|----|-------|------|----------|------------|
| 3000 | Straße & Hausnummer | text | ✅ (wenn Neupatient) | Min 5 Zeichen |
| 3001 | PLZ | text | ✅ (wenn Neupatient) | 5 Ziffern |
| 3002 | Ort | text | ✅ (wenn Neupatient) | Min 2 Zeichen |
| 3003 | Handynummer | tel | ✅ (wenn Neupatient) | Min 6 Ziffern |
| 3004 | E-Mail | email | ❌ | RFC 5322 |
| 3005 | Notfallkontakt (Name, Telefon) | text | ❌ | - |

---

## Sektion q4000-q4140: Anamnese

### q4000-q4001: Medikamente
| ID | Frage | Type | Required | Conditional |
|----|-------|------|----------|-------------|
| 4000 | Nehmen Sie regelmäßig Medikamente? | radio | ✅ | - |
| 4001 | Welche Medikamente? (Name, Dosis, Häufigkeit) | textarea | ❌ | if q4000 = "Ja" |

**Beispiel:**  
```
Ibuprofen 400mg - 2x täglich bei Bedarf
Metformin 1000mg - 1-0-1
L-Thyroxin 75µg - 1x morgens nüchtern
```

### q4010-q4012: Allergien
| ID | Frage | Type | Required | Conditional |
|----|-------|------|----------|-------------|
| 4010 | Bekannte Allergien? | radio | ✅ | - |
| 4011 | Welche Allergien? | checkbox | ❌ | if q4010 = "Ja" |
| 4012 | Allergien Details (Freitext) | textarea | ❌ | if q4010 = "Ja" |

**q4011 Optionen:**
- Pollen (Heuschnupfen)
- Hausstaub/Milben
- Tierhaare
- Medikamente (z.B. Penizillin, Antibiotika)
- Nahrungsmittel (z.B. Nüsse, Laktose)
- Insektenstiche
- Kontaktallergien (Nickel, Latex)

### q4020-q4030: Vorerkrankungen
| ID | Frage | Type | Required | Conditional |
|----|-------|------|----------|-------------|
| 4020 | Chronische Erkrankungen bekannt? | radio | ✅ | - |
| 4021 | Welche Erkrankungen? | checkbox | ❌ | if q4020 = "Ja" |

**q4021 Optionen (Top 50):**
1. Diabetes mellitus Typ 1
2. Diabetes mellitus Typ 2
3. Bluthochdruck (Hypertonie)
4. Koronare Herzkrankheit (KHK)
5. Herzinsuffizienz
6. Vorhofflimmern
7. Herzinfarkt (Myokardinfarkt)
8. Schlaganfall (Apoplex)
9. Asthma bronchiale
10. COPD (Chronisch obstruktive Lungenerkrankung)
11. Rheuma (Rheumatoide Arthritis)
12. Osteoporose
13. Schilddrüsenüberfunktion (Hyperthyreose)
14. Schilddrüsenunterfunktion (Hypothyreose)
15. Epilepsie
16. Multiple Sklerose (MS)
17. Parkinson
18. Demenz/Alzheimer
19. Depression
20. Angststörung
21. Chronische Nierenerkrankung
22. Leberzirrhose
23. Hepatitis B/C
24. HIV/AIDS
25. Krebs (bitte Organangabe in Freitext)
26. Leukämie
27. Lymphom
28. Magen-/Zwölffingerdarmgeschwür
29. Chronische Darmentzündung (Morbus Crohn, Colitis ulcerosa)
30. Gallensteine
31. Nierensteine
32. Prostatavergrößerung (BPH)
33. Endometriose
34. Polyzystisches Ovarsyndrom (PCOS)
35. Migräne
36. Tinnitus
37. Glaukom (Grüner Star)
38. Makuladegeneration
39. Gicht (Hyperurikämie)
40. Psoriasis (Schuppenflechte)
41. Neurodermitis (Atopisches Ekzem)
42. Zöliakie (Glutenunverträglichkeit)
43. Laktoseintoleranz
44. Schlafapnoe
45. Restless-Legs-Syndrom
46. Osteoarthrose (Gelenkverschleiß)
47. Bandscheibenvorfall
48. Thrombose
49. Lungenembolie
50. Andere (Freitext)

### q4040-q4041: Operationen
| ID | Frage | Type | Required | Conditional |
|----|-------|------|----------|-------------|
| 4040 | Frühere Operationen? | radio | ✅ | - |
| 4041 | Welche Operationen? (Art, Jahr) | textarea | ❌ | if q4040 = "Ja" |

**Beispiel:**
```
Blinddarmoperation 2015
Knie-Arthroskopie links 2020
Kaiserschnitt 2018
```

### q4050-q4060: Familienanamnese
| ID | Frage | Type | Required | Conditional |
|----|-------|------|----------|-------------|
| 4050 | Erkrankungen in der Familie bekannt? | radio | ✅ | - |
| 4051 | Welche Familienerkrankungen? | checkbox | ❌ | if q4050 = "Ja" |

**q4051 Optionen:**
- Herzinfarkt (Vater/Mutter vor 60. Lebensjahr)
- Schlaganfall
- Bluthochdruck
- Diabetes
- Krebs (Organangabe wichtig!)
- Darmkrebs
- Brustkrebs
- Eierstockkrebs
- Prostatakrebs
- Lungenkrebs
- Psychische Erkrankungen
- Suchterkrankungen
- Erbkrankheiten (z.B. Mukoviszidose, Hämophilie)

---

## Sektion q5000-q5100: Lebensstil

### q5000-q5002: Rauchen
| ID | Frage | Type | Required | Conditional |
|----|-------|------|----------|-------------|
| 5000 | Rauchen Sie? | radio | ✅ | - |
| 5001 | Zigaretten pro Tag | number | ❌ | if q5000 = "Ja" |
| 5002 | Pack Years (berechnet) | number (readonly) | ❌ | Auto-berechnet aus q5001 |

**Pack Years Formel:**  
```
Pack Years = (Zigaretten/Tag × Jahre geraucht) / 20
```

**Optionen q5000:**
- Ja, aktuell
- Nein, nie geraucht
- Ex-Raucher (seit wann?)

### q5010-q5011: Alkohol
| ID | Frage | Type | Required | Conditional |
|----|-------|------|----------|-------------|
| 5010 | Alkoholkonsum? | radio | ✅ | - |
| 5011 | Gläser pro Woche | number | ❌ | if q5010 != "Nie" |

**Optionen q5010:**
- Nie
- Gelegentlich (< 1x/Woche)
- Regelmäßig (1-3x/Woche)
- Häufig (4-6x/Woche)
- Täglich

### q5020: Bewegung
| ID | Frage | Type | Required |
|----|-------|------|----------|
| 5020 | Körperliche Aktivität? | radio | ✅ |

**Optionen:**
- Keine regelmäßige Bewegung
- 1-2x pro Woche (< 30 Min)
- 3-5x pro Woche (30-60 Min)
- Täglich (> 60 Min)
- Leistungssport

---

## Sektion q6000-q6100: Frauengesundheit
*(nur sichtbar wenn q0002 = "weiblich")*

| ID | Frage | Type | Required | Conditional |
|----|-------|------|----------|-------------|
| 6000 | Sind Sie schwanger? | radio | ❌ | if Geschlecht=weiblich |
| 6005 | Schwangerschaftswoche (falls bekannt) | number | ❌ | if q6000 = "Ja" |
| 6010 | Datum letzte Menstruation | date | ❌ | if Geschlecht=weiblich |
| 6020 | Verhütungsmethode | select | ❌ | if Geschlecht=weiblich |
| 6030 | Anzahl Schwangerschaften | number | ❌ | if Geschlecht=weiblich |
| 6040 | Anzahl Geburten | number | ❌ | if Geschlecht=weiblich |
| 6050 | Fehlgeburten/Abbrüche | number | ❌ | if Geschlecht=weiblich |
| 6060 | Menopause erreicht? | radio | ❌ | if Alter > 40 & weiblich |
| 6070 | Hormonersatztherapie? | radio | ❌ | if q6060 = "Ja" |

**q6020 Optionen (Verhütung):**
- Keine
- Pille (orale Kontrazeptiva)
- Spirale (IUD)
- Hormonimplantat
- Kondom
- Natürliche Familienplanung
- Sterilisation
- Andere

---

## Sektion q7000-q7100: Männergesundheit
*(nur sichtbar wenn q0002 = "männlich")*

| ID | Frage | Type | Required | Conditional |
|----|-------|------|----------|-------------|
| 7000 | Prostatabeschwerden? | checkbox | ❌ | if Geschlecht=männlich & Alter>50 |
| 7010 | Erektile Dysfunktion? | radio | ❌ | if Geschlecht=männlich |

**q7000 Optionen:**
- Häufiger Harndrang
- Nächtliches Wasserlassen (Nykturie)
- Schwacher Harnstrahl
- Nachträufeln
- Schmerzen beim Wasserlassen

---

## Sektion q1P00-q1P54: Pädiatrie-Modul
*(nur sichtbar wenn Alter < 18 Jahre)*

### q1P00: Geburt & Entwicklung
| ID | Frage | Type | Conditional |
|----|-------|------|-------------|
| 1P00 | Geburtskomplikationen? | radio | if Alter < 18 |
| 1P01 | Geburtsgewicht (in Gramm) | number | if Alter < 18 |
| 1P02 | Frühgeburt? | radio | if Alter < 18 |

### q1P10: Entwicklung
| ID | Frage | Type | Conditional |
|----|-------|------|-------------|
| 1P10 | Entwicklungsverzögerungen? | checkbox | if Alter < 18 |

**Optionen:**
- Motorik (Sitzen, Laufen verzögert)
- Sprache (Sprachentwicklung verzögert)
- Sozialverhalten
- Kognitive Entwicklung

### q1P20: Impfungen
| ID | Frage | Type | Conditional |
|----|-------|------|-------------|
| 1P20 | Impfstatus vollständig? | radio | if Alter < 18 |
| 1P21 | Impfpass vorhanden? | radio | if Alter < 18 |

### q1P30: Schule/Kindergarten
| ID | Frage | Type | Conditional |
|----|-------|------|-------------|
| 1P30 | Kindergarten/Schule | text | if Alter < 18 |
| 1P31 | Schulprobleme? | checkbox | if Alter >= 6 |

**Optionen q1P31:**
- Konzentrationsschwierigkeiten
- Lernprobleme
- Verhaltensauffälligkeiten
- Mobbing

### q1P40: Ernährung (Säuglinge/Kleinkinder)
| ID | Frage | Type | Conditional |
|----|-------|------|-------------|
| 1P40 | Stillzeit (Monate) | number | if Alter < 2 |
| 1P41 | Beikost-Start (Monat) | number | if Alter < 2 |
| 1P42 | Nahrungsmittelunverträglichkeiten? | checkbox | if Alter < 18 |

---

## Sektion q8000-q8900: Spezialthemen

### q8000-q8100: Diabetes-Screening
| ID | Frage | Type | Conditional |
|----|-------|------|-------------|
| 8000 | Diabetes bekannt? | radio | - |
| 8010 | Typ 1 oder Typ 2? | radio | if q8000 = "Ja" |
| 8020 | Blutzucker nüchtern (mg/dl) | number | if q8000 = "Ja" |
| 8030 | HbA1c-Wert (%) | number | if q8000 = "Ja" |
| 8040 | Insulintherapie? | radio | if q8010 = "Typ 1" oder schwer |
| 8050 | Diabetische Folgeerkrankungen? | checkbox | if q8000 = "Ja" |

**q8050 Optionen:**
- Diabetische Retinopathie (Augenschäden)
- Diabetische Nephropathie (Nierenschäden)
- Diabetische Neuropathie (Nervenschäden)
- Diabetischer Fuß
- Keine Folgeerkrankungen bekannt

### q8200-q8300: Beeinträchtigungen
| ID | Frage | Type |
|----|-------|------|
| 8200 | Grad der Behinderung (GdB)? | number |
| 8210 | Pflegegrad vorhanden? | radio |
| 8220 | Welcher Pflegegrad? | select |

**q8220 Optionen:**
- Pflegegrad 1
- Pflegegrad 2
- Pflegegrad 3
- Pflegegrad 4
- Pflegegrad 5

---

## Sektion q9000-q9900: Abschluss

### q9000: Weitere Anmerkungen
| ID | Frage | Type | Required |
|----|-------|------|----------|
| 9000 | Weitere Anmerkungen/Wichtige Informationen? | textarea | ❌ |

**Platzhalter-Text:**
```
Bitte teilen Sie uns alles mit, was Ihnen wichtig erscheint:
- Besondere Umstände
- Soziale Situation
- Fragen an den Arzt
- Sonstige Hinweise
```

### q9100: Wie haben Sie von uns erfahren?
| ID | Frage | Type | Required |
|----|-------|------|----------|
| 9100 | Wie wurden Sie auf uns aufmerksam? | select | ❌ |

**Optionen:**
- Empfehlung von Freunden/Familie
- Online-Suche (Google)
- Ärzte-Bewertungsportal (Jameda, DocCheck)
- Social Media (Facebook, Instagram)
- Zeitungsanzeige
- Vorbeigelaufen
- Überweisung vom Arzt
- Andere

### q9200: Feedback zur App
| ID | Frage | Type | Required |
|----|-------|------|----------|
| 9200 | Feedback zur digitalen Anamnese | textarea | ❌ |

**Platzhalter-Text:**
```
Wie war Ihre Erfahrung mit der digitalen Anamnese?
- Was hat gut funktioniert?
- Was könnte verbessert werden?
- Technische Probleme?
```

### q9900: DSGVO-Einwilligung
| ID | Frage | Type | Required |
|----|-------|------|----------|
| 9900 | Datenschutz-Einwilligung | checkbox | ✅ PFLICHT! |

**Text:**
```
☑ Ich bestätige, dass ich die Datenschutzerklärung zur Kenntnis genommen habe und der
   Verarbeitung meiner Gesundheitsdaten gemäß Art. 9 Abs. 2 lit. a DSGVO zustimme.
   Die Daten werden verschlüsselt (AES-256) und nur lokal auf meinem Gerät gespeichert.
```

**WICHTIG:** Diese Checkbox MUSS aktiviert sein, um fortzufahren!

---

## Gesamtstatistik

| Kategorie | Anzahl |
|-----------|--------|
| **Gesamt-Sektionen** | ~200+ |
| **Gesamt-Fragen** | ~1.500+ |
| **Pflichtfelder** | 15 |
| **Conditional Fields** | ~50 |
| **Checkbox-Gruppen** | ~100 |
| **Select-Felder** | ~40 |
| **Text/Textarea** | ~30 |
| **Numerische Felder** | ~20 |

---

**Dokument-Ende**
