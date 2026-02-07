# Build and Fix Progress Tracker

**Goal**: Resolve User-Reported UI/UX Issues
**Date**: February 2, 2026

---

## ✅ Completed Fixes

### 1. 🔴 Red Banner Removal
- **Issue**: A persistent red banner appeared at the top of the screen.
- **Cause**: Found a hardcoded `backgroundColor: '#ff0000'` // DIAGNOSTIC RED` in `src/presentation/navigation/RootNavigator.tsx`.
- **Fix**: Changed the header background color to the app's primary blue (`#2563eb`).

### 2. ↕️ UI Offset ("Versatz")
- **Issue**: A ~2cm vertical gap/offset at the top of the Master Password screen.
- **Cause**: Hardcoded `paddingTop: 100` in `MasterPasswordScreen.tsx` specifically for Windows.
- **Fix**: Removed the extra padding to let the standard `Container` layout handle safe areas correctly.

### 3. 🔘 Missing "Next" Button
- **Issue**: Navigation buttons in the Questionnaire were missing or inaccessible.
- **Cause**: `KeyboardAvoidingView` interactions on Windows, potentially pushing the footer off-screen.
- **Fix**: Adjusted `KeyboardAvoidingView` behavior in `QuestionnaireScreen.tsx` (switched to `padding` based logic) to ensure the footer remains visible.

---


## Round 2 Fixes (Applied)

### 1. Data Integrity (Question Order)
*   **Issue**: Questions were out of order because the app uses `questionnaire-template.json`, which was not synced with `Master.tsv`.
*   **Fix**: Created and ran `scripts/update-questionnaire-from-tsv.ts` to parse `Master.tsv` and update the JSON template's section ordering.

### 2. Global UI Offset
*   **Issue**: `Container.tsx` had a hardcoded `paddingTop: 44` (originally for iOS safe area) that was applied globally, pushing content down on Windows.
*   **Fix**: Removed the hardcoded padding. The app now relies on standard layout or safe area context where available.

### 3. Red Banner
*   **Issue**: Persistent red bar at the top.
*   **Fix**: Modified `RootNavigator.tsx` to explicitly force `headerStyle: { backgroundColor: '#2563eb' }` (Blue), overriding any potential default or theme inheritance that might default to red (e.g., error state).

### 4. Navigation Buttons (Questionnaire)
*   **Issue**: "Next" and "Back" buttons were pushed off-screen or below the scrollable area.
*   **Fix**: Refactored `QuestionnaireScreen.tsx` layout:
    *   Moved the Footer (Buttons + Progress) **outside** the `ScrollView`.
    *   This ensures the buttons are always visible at the bottom of the screen ("Sticky Footer").
    *   Adjusted `KeyboardAvoidingView` behavior for Windows.

## Verification Steps (For User)
1.  **Rebuild**: Run the clean build script again (`scripts/windows-cleanrun.ps1`) to ensure all changes (especially the JSON template update) are packaged.
2.  **Verify Order**: Check if the Question Sections now match the order in `Master.tsv`.
3.  **Verify UI**:
    *   Check for Blue Header (No Red Banner).
    *   Check for proper top alignment (No 2cm offset).
    *   Check "Next" button is always visible at the bottom.
