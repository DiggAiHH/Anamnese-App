import de from '../locales/de.json';
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import el from '../locales/el.json';
import es from '../locales/es.json';
import fa from '../locales/fa.json';
import fr from '../locales/fr.json';
import it from '../locales/it.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import nl from '../locales/nl.json';
import pl from '../locales/pl.json';
import pt from '../locales/pt.json';
import ro from '../locales/ro.json';
import ru from '../locales/ru.json';
import tr from '../locales/tr.json';
import uk from '../locales/uk.json';
import vi from '../locales/vi.json';
import zh from '../locales/zh.json';

const flattenKeys = (obj: unknown, prefix = ''): string[] => {
  if (!obj || typeof obj !== 'object') return [];

  const record = obj as Record<string, unknown>;
  const keys: string[] = [];

  for (const key of Object.keys(record)) {
    const value = record[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
};

describe('i18n locales', () => {
  test('all locales have identical translation keys', () => {
    const locales: Record<string, unknown> = {
      de,
      en,
      fr,
      es,
      it,
      pt,
      nl,
      pl,
      tr,
      ru,
      ar,
      fa,
      zh,
      ja,
      ko,
      vi,
      uk,
      ro,
      el,
    };

    const canonical = new Set(flattenKeys(locales.en).sort());

    for (const [code, locale] of Object.entries(locales)) {
      const keys = new Set(flattenKeys(locale).sort());

      const missingInLocale = [...canonical].filter(k => !keys.has(k));
      const extraInLocale = [...keys].filter(k => !canonical.has(k));

      expect({ code, missingInLocale, extraInLocale }).toEqual({
        code,
        missingInLocale: [],
        extraInLocale: [],
      });
    }
  });
});
