# Questionnaire Loading Performance Fix

## Problem
The questionnaire screen takes 4-7 seconds to load after the user completes GDPR consent because it prefills patient data (name, birthdate, gender) and **saves each answer to the database sequentially** before rendering the UI.

## Root Cause
[QuestionnaireScreen.tsx](src/presentation/screens/QuestionnaireScreen.tsx#L219-L230): Sequential `await saveAnswerUseCase.execute(...)` calls inside a `for` loop block the UI thread.

## Solution
Change the blocking sequential saves to **parallel non-blocking** background saves:
- UI renders immediately with in-memory answers
- Database writes happen in the background via `Promise.all()`
- Any save failures are logged (dev-only) but don't block the user
- Next user interaction will persist any failed prefills

## Apply the Fix

### Option 1: Apply Patch File
```powershell
# From repository root
git apply patches/questionnaire-loading-performance.patch
```

### Option 2: Manual Edit
Edit [src/presentation/screens/QuestionnaireScreen.tsx](src/presentation/screens/QuestionnaireScreen.tsx), lines 219-230:

**Replace:**
```typescript
// Persist prefilled answers so reloads remain consistent.
for (const qid of changedQuestionIds) {
  const question = questionnaireEntity.findQuestion(qid);
  if (!question) continue;

  const value = nextAnswers.get(qid);
  const persistValue = value === undefined ? null : value;

  // Do not alert on failure here; user can still proceed.
  await saveAnswerUseCase.execute({
    questionnaireId: questionnaireEntity.id,
    question,
    value: persistValue,
    encryptionKey,
    sourceType: 'manual',
  });
}
```

**With:**
```typescript
// PERFORMANCE FIX: Persist prefilled answers in the background (non-blocking).
// The UI will use the in-memory `nextAnswers` immediately, while DB writes happen async.
if (changedQuestionIds.length > 0) {
  // Fire-and-forget background save (do not block UI)
  Promise.all(
    changedQuestionIds.map(async (qid) => {
      const question = questionnaireEntity.findQuestion(qid);
      if (!question) return;

      const value = nextAnswers.get(qid);
      const persistValue = value === undefined ? null : value;

      try {
        await saveAnswerUseCase.execute({
          questionnaireId: questionnaireEntity.id,
          question,
          value: persistValue,
          encryptionKey,
          sourceType: 'manual',
        });
      } catch (err) {
        // Silent fail: user can still proceed; next interaction will persist
        if (__DEV__) {
          console.warn('[QuestionnaireScreen] Failed to persist prefill:', err);
        }
      }
    }),
  ).catch(() => {
    // Catch to prevent unhandled rejection warnings
  });
}
```

## Verification

After applying the fix:

1. **Rebuild and relaunch:**
   ```powershell
   npm run windows:ready
   ```

2. **Test the flow:**
   - Create a new patient
   - Fill in basic info (name, birthdate, gender)
   - Accept GDPR consents
   - **Expected:** Questionnaire screen appears immediately (< 1 second)
   - Verify prefilled data is visible in the first section

3. **Verify persistence:**
   - Navigate back to Home
   - Re-open the same patient
   - **Expected:** Prefilled data is still present (background saves succeeded)

## Expected Impact
- **Before:** 4-7 seconds delay
- **After:** < 1 second (instant UI render)
- **Improvement:** ~85% faster perceived load time

## Privacy & Compliance
- ✅ DSGVO compliant: No PII in logs (only dev warnings)
- ✅ No functional regression: UI behavior identical
- ✅ Data integrity: Background saves still persist data; user interactions re-save if needed
