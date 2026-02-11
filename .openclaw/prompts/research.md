# Prompt: Deep Research & Dependency Management

> Trigger: Weekly or on-demand
> Scope: Dependency updates, CVE scanning, tech radar analysis

## Instruction

Agiere als Research Architect für die Anamnese-App.

### Dependency Security Audit

**Step 1: npm Audit**
```bash
npm audit --json > buildLogs/npm_audit_$(date +%Y%m%d_%H%M%S).json 2>&1
npm audit --audit-level=moderate 2>&1 | tee buildLogs/npm_audit_summary_$(date +%Y%m%d_%H%M%S).log
```

**Step 2: Outdated Check**
```bash
npm outdated --json > buildLogs/npm_outdated_$(date +%Y%m%d_%H%M%S).json 2>&1
```

**Step 3: Risk Assessment**
Für jede outdated/vulnerable Dependency:
- CVE-Nummer und Severity (CVSS Score)
- Breaking Changes im Changelog prüfen
- Transitive vs. direkte Abhängigkeit
- Impact auf 6 Plattformen bewerten

**Step 4: Update Plan**
Erstelle `buildLogs/dependency_update_plan_YYYYMMDD.md`:
```markdown
# Dependency Update Plan — {{date}}

## Critical (update ASAP)
| Package | Current | Latest | CVE | Action |
|---------|---------|--------|-----|--------|

## Minor/Patch (safe to update)
| Package | Current | Latest | Breaking? | Action |

## Deferred (needs testing)
| Package | Current | Latest | Reason |
```

### Tech Radar Research

**Scope**: Relevante Technologien für Medical-App / DSGVO / RN

**Research-Quellen**:
- GitHub Trending (weekly, language:TypeScript/JavaScript)
- npm download trends für Kategorie (encryption, i18n, medical)
- React Native Community Updates
- OWASP Mobile Security Project Updates

**Output**: `buildLogs/tech_radar_YYYYMMDD.md` mit:
- Top 5 relevante neue Libraries/Tools
- Pro/Contra vs. aktuelle Stack-Komponenten
- Migration-Aufwand (Stunden-Schätzung)
- DSGVO-Kompatibilität

### Supply Chain (CRA Compliance)
- Alle Versionen in `package.json` MÜSSEN exakt gepinnt sein (kein `^`)
- Patch-package Patches dokumentieren (warum, wann)
- Keine Dependency ohne Lizenzprüfung (MIT/Apache OK, GPL problematisch für Medical)

### Einschränkungen
- Keine automatischen `npm install` ohne explizite Freigabe im Plan
- Keine Breaking Major Updates ohne Test-Coverage-Nachweis
- Research-Output ist informativ, nicht destruktiv
