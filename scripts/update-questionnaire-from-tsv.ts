import fs from 'fs';
import path from 'path';

const TSV_PATH = path.join(__dirname, '../src/Inahlt/Master.tsv');
const JSON_PATH = path.join(__dirname, '../src/infrastructure/data/questionnaire-template.json');

interface Section {
    id: string;
    order: number;
    // other fields...
}

interface Template {
    sections: Section[];
    [key: string]: any;
}

function parseTSV(content: string): Map<string, number> {
    // Remove BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '');
    const lines = cleanContent.split(/\r?\n/);

    if (lines.length === 0) return new Map();

    const headers = lines[0].split('\t').map(h => h.trim());
    console.log('Headers found:', headers);

    const orderMap = new Map<string, number>();
    const encounteredSections = new Set<string>();
    let implicitOrderCounter = 1;

    // Find indices
    const idIndex = headers.indexOf('section_id');
    const orderIndex = headers.indexOf('section_order_hint');

    if (idIndex === -1) {
        console.error('Could not find required column section_id in TSV');
        return orderMap;
    }

    // Iterate lines (skip header)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const columns = line.split('\t');
        const id = columns[idIndex]?.trim();
        if (!id) continue;

        // implicit order based on file occurrence
        if (!encounteredSections.has(id)) {
            encounteredSections.add(id);

            let order = implicitOrderCounter++;

            // Try explicit order if available and valid
            if (orderIndex !== -1) {
                const orderStr = columns[orderIndex]?.trim();
                if (orderStr && orderStr !== '') {
                    const parsed = parseInt(orderStr, 10);
                    if (!isNaN(parsed)) {
                        order = parsed;
                    }
                }
            }

            // If we found an explicit order later for the same ID, we might want to update it?
            // But for now, let's assume the first occurrence defines the section or implicit order is fine.
            // Actually, if explicit order is provided on ANY line for this section, we should probably prefer it.
            // But the safest bet for "align with file" is implicit order if explicit is missing.

            orderMap.set(id, order);
            console.log(`Section ${id} assigned order ${order}`);
        } else {
            // If we haven't set an explicit order yet but find one now?
            if (orderIndex !== -1) {
                const orderStr = columns[orderIndex]?.trim();
                if (orderStr && orderStr !== '') {
                    const parsed = parseInt(orderStr, 10);
                    if (!isNaN(parsed)) {
                        // Overwrite with explicit order
                        orderMap.set(id, parsed);
                    }
                }
            }
        }
    }

    return orderMap;
}

function updateJSON() {
    if (!fs.existsSync(TSV_PATH)) {
        console.error(`TSV file not found at ${TSV_PATH}`);
        process.exit(1);
    }

    if (!fs.existsSync(JSON_PATH)) {
        console.error(`JSON file not found at ${JSON_PATH}`);
        process.exit(1);
    }

    const tsvContent = fs.readFileSync(TSV_PATH, 'utf-8');
    const orderMap = parseTSV(tsvContent);

    console.log(`Found ${orderMap.size} section orders in TSV.`);

    const jsonContent = fs.readFileSync(JSON_PATH, 'utf-8');
    const template: Template = JSON.parse(jsonContent);

    let updatedCount = 0;
    template.sections.forEach(section => {
        if (orderMap.has(section.id)) {
            const newOrder = orderMap.get(section.id)!;
            if (section.order !== newOrder) {
                console.log(`Updating section ${section.id}: order ${section.order} -> ${newOrder}`);
                section.order = newOrder;
                updatedCount++;
            }
        }
    });

    // Sort sections by order
    template.sections.sort((a, b) => a.order - b.order);

    fs.writeFileSync(JSON_PATH, JSON.stringify(template, null, 2), 'utf-8');
    console.log(`Updated ${updatedCount} sections and sorted template.`);
}

updateJSON();
