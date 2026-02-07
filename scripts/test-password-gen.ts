
// Polyfill first, simulating index.js
import 'react-native-get-random-values';
import { PasswordGenerator } from '../src/domain/services/PasswordGenerator';

try {
    console.log('Testing PasswordGenerator...');
    const password = PasswordGenerator.generate();
    console.log(`Generated Password: ${password}`);

    if (!password || password.length < 12) {
        console.error('Password too short or empty');
        process.exit(1);
    }

    // Verify basic constraints
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    console.log(`Upper: ${hasUpper}, Lower: ${hasLower}, Number: ${hasNumber}, Special: ${hasSpecial}`);

    if (hasUpper && hasLower && hasNumber && hasSpecial) {
        console.log('SUCCESS: Password meets complexity requirements.');
        process.exit(0);
    } else {
        console.error('FAILURE: Password missing complexity.');
        process.exit(1);
    }
} catch (error) {
    console.error('CRITICAL ERROR:', error);
    process.exit(1);
}
