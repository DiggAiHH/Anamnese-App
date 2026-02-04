const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join('src', 'Inahlt', 'Master');
const OUTPUT_FILE = path.join('src', 'infrastructure', 'data', 'questionnaire-template.json');

// Helper to generate IDs
const getSafeId = (id) => id.trim().replace(/[^a-zA-Z0-9_]/g, '_');

// Read raw file
try {
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    const lines = rawData.split('\n');

    const sectionsMap = new Map(); // id -> section object
    const allQuestions = []; // Array of { sectionId, questionObject }
    const questionIdMap = new Map(); // id -> questionObject

    let rowCount = 0;

    // PASS 1: Build Structure
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split('\t');
        if (cols.length < 3) continue;

        const sectionId = cols[0].trim();
        const sectionTitle = cols[1].trim();

        if (!sectionsMap.has(sectionId)) {
            sectionsMap.set(sectionId, {
                id: sectionId,
                title: sectionTitle,
                order: sectionsMap.size + 1,
                questions: []
            });
        }

        const section = sectionsMap.get(sectionId);

        const fieldName = cols[2].trim(); // This is the ID
        const fieldType = cols[3].trim().toLowerCase();
        // tag (4) ignored
        const required = cols[5].trim().toLowerCase() === 'yes';
        const label = cols[6].trim();
        const placeholder = cols[7]?.trim();
        const min = cols[8]?.trim();
        const max = cols[9]?.trim();
        // step (10)
        // options_count (11)
        const optionValues = cols[12]?.trim();
        const optionLabels = cols[13]?.trim();
        const toggleMapStr = cols[14]?.trim();
        const nextMapStr = cols[15]?.trim();

        // Construct Question Object
        const question = {
            id: fieldName,
            type: mapType(fieldType),
            text: label,
            required: required,
            placeholder: placeholder,
            conditions: []
        };

        // Add validation
        if (min || max) {
            question.validation = {};
            if (min) question.validation.min = parseFloat(min) || min;
            if (max) question.validation.max = parseFloat(max) || max;
        }

        // Add options
        if (['select', 'multiselect', 'radio'].includes(question.type)) {
            if (optionValues) {
                const vals = splitOptions(optionValues);
                const lbls = optionLabels ? splitOptions(optionLabels) : vals;
                question.options = vals.map((v, idx) => ({
                    value: v,
                    label: lbls[idx] || v
                }));
            }
        }

        // Store maps for Pass 2 (Logic)
        if (nextMapStr) {
            question.nextMap = parseMap(nextMapStr);
        }

        // Toggle Map Logic (Temporary storage)
        if (toggleMapStr) {
            question._toggleMap = parseMap(toggleMapStr);
        }

        section.questions.push(question);
        allQuestions.push({ sectionId, question });
        questionIdMap.set(fieldName, question);
    }

    // PASS 2: Apply Logic (Toggle Map -> Conditions)
    // iterate over all questions, if they have a toggleMap, find target and add condition

    for (const { sectionId, question } of allQuestions) {
        if (!question._toggleMap) continue;

        const operator = question.type === 'multiselect' || question.type === 'checkbox' ? 'contains' : 'equals';

        Object.entries(question._toggleMap).forEach(([triggerValue, targets]) => {
            const targetList = Array.isArray(targets) ? targets : [targets];

            targetList.forEach(targetId => {
                // Check if target is a Section
                if (sectionsMap.has(targetId)) {
                    // Propagate to ALL questions in that section
                    const targetSection = sectionsMap.get(targetId);
                    targetSection.questions.forEach(q => {
                        addCondition(q, question.id, operator, triggerValue);
                    });
                } else if (questionIdMap.has(targetId)) {
                    // Target is a Question
                    const targetQ = questionIdMap.get(targetId);
                    addCondition(targetQ, question.id, operator, triggerValue);
                } else {
                    // console.warn(`Target ${targetId} not found (triggered by ${question.id})`);
                }
            });
        });

        // Cleanup temp property
        delete question._toggleMap;
    }

    const output = {
        version: "3.0.0",
        sections: Array.from(sectionsMap.values())
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`Successfully generated ${OUTPUT_FILE} with ${output.sections.length} sections.`);

} catch (err) {
    console.error("Error parsing Master file:", err);
}

function addCondition(question, sourceId, operator, value) {
    if (!question.conditions) question.conditions = [];
    // Avoid duplicates
    const exists = question.conditions.some(c => c.questionId === sourceId && c.value === value);
    if (!exists) {
        question.conditions.push({
            questionId: sourceId,
            operator: operator,
            value: value
        });
    }
}

function mapType(tsvType) {
    switch (tsvType) {
        case 'text': return 'text';
        case 'number': return 'number';
        case 'date': return 'date';
        case 'time': return 'text';
        case 'email': return 'email';
        case 'tel': return 'phone';
        case 'textarea': return 'textarea';
        case 'select': return 'select';
        case 'radio': return 'select'; // Use select for radio to match app
        case 'checkbox': return 'multiselect';
        case 'hidden': return 'hidden';
        default: return 'text';
    }
}

function splitOptions(str) {
    // Basic comma split
    return str.split(/,\s*/).map(s => s.trim());
}

function parseMap(str) {
    // "Value=>#Target; Value2=>#Target2" OR "#Target" (unconditional)
    if (!str) return undefined;
    const map = {};
    const parts = str.split(';');
    parts.forEach(p => {
        if (p.includes('=>')) {
            const [val, target] = p.split('=>');
            if (val && target) {
                const cleanTarget = target.trim().replace(/^#/, '');
                const targets = cleanTarget.split(',').map(t => t.trim().replace(/^#/, ''));
                map[val.trim()] = targets.length > 1 ? targets : targets[0];
            }
        } else {
            // Unconditional
            const cleanTarget = p.trim().replace(/^#/, '');
            const targets = cleanTarget.split(',').map(t => t.trim().replace(/^#/, ''));
            map['default'] = targets.length > 1 ? targets : targets[0];
        }
    });
    return map;
}
