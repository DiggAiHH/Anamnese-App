/**
 * PasswordGenerator Service
 * Domain service for generating secure passwords.
 */
export class PasswordGenerator {
  /**
   * Generates a secure random password using crypto.getRandomValues
   * @param length Length of the password (default: 20)
   * @returns Generated password string
   */
  static generate(length: number = 20): string {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const symbols = '!@#$%^&*()-_=+[]{};:,.?';
    const all = `${lower}${upper}${digits}${symbols}`;

    const getRandomInt = (max: number): number => {
      try {
        if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
          const buf = new Uint32Array(1);
          crypto.getRandomValues(buf);
          return buf[0] % max;
        }
      } catch (e) {
        // Fallback
      }
      return Math.floor(Math.random() * max);
    };

    const pick = (chars: string): string => {
      return chars[getRandomInt(chars.length)];
    };

    // Ensure at least one character from each set
    const out: string[] = [pick(lower), pick(upper), pick(digits), pick(symbols)];

    // Fill the rest
    while (out.length < length) {
      out.push(pick(all));
    }

    // Fisher–Yates shuffle
    for (let i = out.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }

    return out.join('');
  }
}
