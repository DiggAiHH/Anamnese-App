# GitHub CLI Login für OpenClaw Copilot Bridge
# ==============================================

Write-Host "`n=== GitHub CLI Login (für Copilot Bridge) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "WICHTIG:" -ForegroundColor Yellow
Write-Host "  GitHub Copilot Bridge braucht einen authentifizierten GitHub Token." -ForegroundColor Gray
Write-Host "  Dieser Token kommt von deiner GitHub Copilot Lizenz." -ForegroundColor Gray
Write-Host ""
Write-Host "Schritt 1: Login durchführen" -ForegroundColor Yellow
Write-Host "  Führe folgenden Befehl aus:" -ForegroundColor Gray
Write-Host ""
Write-Host "    gh auth login --scopes copilot" -ForegroundColor Green
Write-Host ""
Write-Host "  Wähle:" -ForegroundColor Gray
Write-Host "    - GitHub.com" -ForegroundColor Gray
Write-Host "    - HTTPS" -ForegroundColor Gray
Write-Host "    - Login with a web browser" -ForegroundColor Gray
Write-Host ""
Write-Host "Schritt 2: Token verifizieren" -ForegroundColor Yellow
Write-Host "  Nach erfolgreichem Login:" -ForegroundColor Gray
Write-Host ""
Write-Host "    gh auth token" -ForegroundColor Green
Write-Host ""
Write-Host "  → Sollte einen Token ausgeben (beginnt mit 'gho_' oder 'ghp_')" -ForegroundColor Gray
Write-Host ""
Write-Host "Schritt 3: Services neu starten" -ForegroundColor Yellow
Write-Host "  Sobald Token verfügbar ist:" -ForegroundColor Gray
Write-Host ""
Write-Host "    node scripts/copilot-bridge.cjs" -ForegroundColor Green
Write-Host "    node scripts/anthropic-to-openai-proxy.cjs" -ForegroundColor Green
Write-Host "    openclaw gateway --port 18789 --bind loopback run" -ForegroundColor Green
Write-Host ""
Write-Host "Alternative: GitHub Personal Access Token (PAT)" -ForegroundColor Yellow
Write-Host "  Falls 'gh auth login' nicht funktioniert:" -ForegroundColor Gray
Write-Host "    1. Gehe zu: https://github.com/settings/tokens/new" -ForegroundColor Gray
Write-Host "    2. Scopes: copilot, read:user" -ForegroundColor Gray
Write-Host "    3. Token kopieren und setzen:" -ForegroundColor Gray
Write-Host ""
Write-Host "       `$env:GITHUB_TOKEN = 'dein_token_hier'" -ForegroundColor Green
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Optional: Starte Login direkt
$response = Read-Host "Soll ich 'gh auth login' jetzt starten? (y/N)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "`nStarte GitHub Login..." -ForegroundColor Cyan
    gh auth login --scopes copilot --web
} else {
    Write-Host "`nBitte führe manuell aus: gh auth login --scopes copilot" -ForegroundColor Yellow
}
