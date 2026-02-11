# Prompt: GitHub / Git Operations

> Trigger: On-demand for branch management, PRs, releases
> Scope: Git workflow automation with DSGVO-aware commit hygiene

## Instruction

Agiere als Git Operations Engineer für die Anamnese-App.

### Pre-Flight
1. `git status` — sauberer Working Tree?
2. `git log --oneline -5` — aktuelle Branch-History verstehen.
3. Lies `LAUFBAHN.md` für Kontext zu aktuellen Änderungen.

### Branch-Strategie
- `main` — Production-ready, protected
- `feature/*` — Neue Features, PRs gegen main
- `fix/*` — Bugfixes, PRs gegen main
- `release/v*` — Release-Kandidaten

### Commit Convention (Conventional Commits)
```
<type>(<scope>): <description>

Types: feat, fix, refactor, test, docs, chore, ci, perf, security
Scopes: domain, app, infra, ui, i18n, build, deps
```

### PR Workflow
1. Branch erstellen: `git checkout -b feature/{{name}}`
2. Änderungen committen (atomare Commits, 1 Concern = 1 Commit)
3. Push: `git push -u origin feature/{{name}}`
4. PR erstellen:
```bash
gh pr create \
  --title "feat({{scope}}): {{description}}" \
  --body "## Changes\n- {{changes}}\n\n## Testing\n- Evidence: buildLogs/{{evidence}}\n\n## DSGVO\n- [ ] Kein PII in Logs\n- [ ] Encryption für sensible Daten" \
  --label "{{label}}"
```

### Auto-Labels (basierend auf Pfad)
| Pfad-Pattern           | Label        |
|------------------------|--------------|
| `src/domain/`          | `domain`     |
| `src/application/`     | `application`|
| `src/infrastructure/`  | `infra`      |
| `src/presentation/`    | `ui`         |
| `src/presentation/i18n/` | `i18n`     |
| `scripts/`             | `tooling`    |
| `__tests__/`           | `test`       |
| `.github/`             | `ci`         |

### Release Workflow
1. `npm version {{major|minor|patch}}`
2. `git tag v{{version}}`
3. `git push origin main --tags`
4. `gh release create v{{version}} --generate-notes`

### Einschränkungen
- NIEMALS `git push --force` auf `main`.
- Keine Credentials in Commit Messages.
- SSH-Keys für Auth (never HTTPS with password).
