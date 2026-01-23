# Question Order and Definitions - Source Map

This doc points to the authoritative sources for question order, dependencies,
and question definitions (including the compartment concept).

## Canonical data sources (runtime)
- `src/infrastructure/data/questionnaire-template.json`
  - Sections are ordered by the `order` field.
  - Questions are listed in array order inside each section.
  - Dependencies/visibility are defined by `conditions` (questionId + operator + value).
  - Compartment metadata is stored in `metadata` (e.g., `compartmentCode`, `fieldName`).
- `src/infrastructure/data/questionnaire-template.generated.json`
  - Generated variant of the template (same structure, used by the app as needed).

## Question definition classes (code)
- `src/domain/entities/Questionnaire.ts`
  - `Question` and `Section` schemas define the question model.
  - `QuestionnaireEntity.create()` sorts sections by `order`.
  - `QuestionnaireEntity.evaluateConditions()` evaluates `conditions`.
  - `QuestionnaireEntity.toCompartmentQuestions()` maps template questions into
    compartment questions using `metadata.compartmentId` / `metadata.compartmentOrder`,
    with a deterministic fallback order when missing.
- `src/domain/entities/CompartmentQuestion.ts`
  - Defines the "CompartmentQuestion" class used to model each question as a
    compartment with stable numeric IDs, order, and optional options list.

## Human-readable question listings (documentation)
- `docs/01_COMPLETE_ELEMENTS_LIST.md`
  - High-level catalog of sections, questions, and conditional logic.
  - Includes a section hierarchy and a summary of dependencies.
- `docs/02_COMPLETE_QUESTIONS_LIST.md`
  - Detailed question list per section, including required flags and options.

## CSV/XLSX sources
- No CSV/XLSX files were found under the repo root. If they exist, please share
  the path or filename so I can link them here.

## Practical "order of questions" summary
- UI order = section order (`sections[].order`) + question array order in the template.
- Visibility is filtered at runtime by `QuestionnaireEntity.evaluateConditions()`.
- Compartment order uses `metadata.compartmentOrder` when provided; otherwise a
  deterministic fallback order is assigned in template iteration order.
