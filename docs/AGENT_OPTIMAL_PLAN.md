# Agent Optimal Plan (Cross-Platform)

Absolute Root: c:\\Users\\tubbeTEC\\Desktop\\Projects\\Anamnese-App\\Anamnese-App

Purpose
- Provide a deterministic, evidence-based workflow for cross-platform readiness.
- Ensure every agent run is reproducible, documented, and test-verified.

Mode Rules
- Planning Mode: Plan only. No code changes, no commands, no files modified.
- Execution Mode: Execute the approved plan step-by-step with tests and evidence.

Mandatory 5-Point Schema (must be answered every run)
1) Goal (clear, measurable)
   - Outcome:
   - Definition of Done (DoD):
   - Non-goals:
2) Method (evidence-based)
   - Repro steps:
   - Root cause hypotheses:
   - Fix strategy:
   - Verification plan:
3) Languages / Tech Stack
   - Platforms: Windows, macOS, iOS, Android, Web
   - Languages: TypeScript/TSX, Node.js
   - Tests: Jest
4) Structure
   - Files/Modules touched:
   - Evidence artifacts (buildLogs/*):
5) Quality & Patterns
   - Security/Compliance: GDPR/CRA, no PII in logs
   - Testing: Unit tests for each new/changed behavior
   - Maintainability: minimal change set, no unnecessary refactors

Cross-Platform Capability Matrix (must be explicit)
- Storage: SQLite (mobile), mock/fallback (desktop/web), or web storage plan
- Crypto: quick-crypto when available; WebCrypto fallback
- TTS/STT/OCR: native-only on mobile, explicit fallback UI on others
- Filesystem/Share/DocumentPicker: guarded by capability checks

Workflow (Plan -> Execute -> Verify)
1) Intake
   - Read LAUFBAHN.md and open tasks.
   - If previous agent stopped: record why + mitigation.
2) Plan
   - Create task list with file paths and verification per task.
   - Include tests and evidence path for each task.
3) Execute
   - Implement task-by-task in declared order.
   - After each task: add unit test + run it immediately.
4) Verify
   - Run targeted tests first, then optional full suite.
   - Save logs under buildLogs/ with clear names.
5) Document
   - Update LAUFBAHN.md (timestamp, files, verification, evidence).
   - Add or update TODO list if tasks remain.

Stop-and-Fix Rule (strict)
- If any command/test fails: STOP, fix root cause, add prevention, re-run.
- A failure must be prevented from recurring (guard, test, or script fix).

Stability / Code Space Diagnostics
- Check for leaked Node/Metro/PowerShell processes.
- Capture logs in buildLogs/ (stdout + stderr).
- Prefer deterministic scripts with exit codes.
- If repeated failures: reduce scope, isolate minimal repro, then fix.

Documentation Standard (Fool-Proof Guides)
- Every guide uses step-by-step instructions for non-technical users.
- Mandatory screenshot placeholders:
  > **[TODO: INSERT SCREENSHOT HERE - SHOWING: <Specific Element/Menu>]**

User Action Required Format (exact)
USER ACTION REQUIRED
<exact command only>

Agent Self-Prompt (for planning)
<thinking>
  <analysis>Break the request into atomic tasks. Identify repo dependencies.</analysis>
  <context_check>List required files/interfaces; confirm they are read.</context_check>
  <compliance_scan>GDPR Art. 25/17/9, CRA secure defaults, ISO 27001 logging/secrets.</compliance_scan>
  <architecture>Choose pattern and explain briefly (UseCase/Service/Script).</architecture>
  <strategy>Define steps and verification evidence.</strategy>
</thinking>
<plan>
  1. [path]: change (function/module granularity)
  2. [path]: next step
  3. Verification: test/build + evidence path
</plan>

Notes
- Use Python for automation when it speeds up accurate edits or checks.
- Avoid assumptions. If a file is not read, read it before making changes.
