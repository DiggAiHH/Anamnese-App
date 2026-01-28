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

    const pick = (chars: string): string => {
      // Create a buffer for 1 32-bit integer
      const buf = new Uint32Array(1);
      // Use global crypto (available in RN via polyfill/native or web)
      crypto.getRandomValues(buf);
      return chars[buf[0] % chars.length];
    };

    // Ensure at least one character from each set
    const out: string[] = [pick(lower), pick(upper), pick(digits), pick(symbols)];

    // Fill the rest
    for (let i = out.length; i < length; i++) {
      out.push(pick(all));
    }

    // Fisher–Yates shuffle
    for (let i = out.length - 1; i > 0; i--) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      const j = buf[0] % (i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }

    return out.join('');
  }
}
