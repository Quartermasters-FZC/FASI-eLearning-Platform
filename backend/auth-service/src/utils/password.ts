/**
 * Password Utility Functions
 * AI-Powered eLearning Platform - Quartermasters FZC
 * 
 * Government-grade password security and validation
 */

import bcrypt from 'bcryptjs';
import { logger } from './logger';

// Password requirements for government-grade security
const PASSWORD_REQUIREMENTS = {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '@$!%*?&',
    maxRepeatingChars: 2,
    preventCommonPatterns: true,
};

// Common weak patterns to reject
const WEAK_PATTERNS = [
    /(.)\1{3,}/, // Four or more repeated characters
    /123456789/, // Sequential numbers
    /abcdefghi/, // Sequential letters
    /qwerty/i, // QWERTY patterns
    /password/i, // Contains "password"
    /admin/i, // Contains "admin"
    /user/i, // Contains "user"
    /login/i, // Contains "login"
];

// Common weak passwords to reject
const COMMON_PASSWORDS = [
    'password123',
    'admin123',
    'user123',
    'password',
    'adminadmin',
    'useradmin',
    '123456789',
    'qwerty123',
    'password1',
    'admin1234',
];

/**
 * Validate password against government security requirements
 */
export function validatePassword(password: string): { 
    isValid: boolean; 
    errors: string[]; 
    strength: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
} {
    const errors: string[] = [];
    let strengthScore = 0;

    // Check length
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    } else {
        strengthScore += Math.min(password.length - PASSWORD_REQUIREMENTS.minLength, 10);
    }

    if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
        errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
    }

    // Check character requirements
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
        strengthScore += 5;
    }

    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
        strengthScore += 5;
    }

    if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
        strengthScore += 5;
    }

    if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
        const specialCharRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
        if (!specialCharRegex.test(password)) {
            errors.push(`Password must contain at least one special character (${PASSWORD_REQUIREMENTS.specialChars})`);
        } else {
            strengthScore += 10;
        }
    }

    // Check for repeating characters
    const repeatingChars = password.match(/(.)\1+/g);
    if (repeatingChars) {
        const maxRepeating = Math.max(...repeatingChars.map(match => match.length));
        if (maxRepeating > PASSWORD_REQUIREMENTS.maxRepeatingChars) {
            errors.push(`Password cannot have more than ${PASSWORD_REQUIREMENTS.maxRepeatingChars} repeating characters`);
        }
    }

    // Check for weak patterns
    if (PASSWORD_REQUIREMENTS.preventCommonPatterns) {
        for (const pattern of WEAK_PATTERNS) {
            if (pattern.test(password)) {
                errors.push('Password contains common weak patterns');
                break;
            }
        }

        // Check against common passwords
        if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
            errors.push('Password is too common and easily guessable');
        }
    }

    // Calculate character diversity
    const uniqueChars = new Set(password).size;
    strengthScore += Math.min(uniqueChars, 20);

    // Determine strength level
    let strength: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
    if (strengthScore < 20) {
        strength = 'weak';
    } else if (strengthScore < 35) {
        strength = 'fair';
    } else if (strengthScore < 50) {
        strength = 'good';
    } else if (strengthScore < 65) {
        strength = 'strong';
    } else {
        strength = 'very_strong';
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength
    };
}

/**
 * Hash password using bcrypt with appropriate salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
    try {
        // Validate password before hashing
        const validation = validatePassword(password);
        if (!validation.isValid) {
            throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
        }

        // Use higher salt rounds for production
        const saltRounds = process.env.NODE_ENV === 'production' ? 14 : 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        logger.info('Password hashed successfully');
        return hashedPassword;
    } catch (error) {
        logger.error('Password hashing failed:', error);
        throw error;
    }
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    try {
        const isMatch = await bcrypt.compare(password, hash);
        return isMatch;
    } catch (error) {
        logger.error('Password comparison failed:', error);
        throw new Error('Password verification failed');
    }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = PASSWORD_REQUIREMENTS.specialChars;
    
    const allChars = uppercase + lowercase + numbers + specialChars;
    
    let password = '';
    
    // Ensure at least one character from each required category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password has been compromised using basic checks
 * (In production, you might integrate with HaveIBeenPwned API)
 */
export function checkPasswordCompromise(password: string): boolean {
    // Basic check against known compromised patterns
    const compromisedPatterns = [
        /^password\d*$/i,
        /^admin\d*$/i,
        /^user\d*$/i,
        /^123456/,
        /^qwerty/i,
        /^letmein/i,
        /^welcome/i,
        /^monkey/i,
        /^dragon/i,
    ];

    return compromisedPatterns.some(pattern => pattern.test(password));
}

/**
 * Get password strength description
 */
export function getPasswordStrengthDescription(strength: string): string {
    const descriptions = {
        weak: 'Very weak - easily guessable, use a stronger password',
        fair: 'Fair - consider adding more complexity',
        good: 'Good - meets basic security requirements',
        strong: 'Strong - good security level',
        very_strong: 'Very strong - excellent security level'
    };

    return descriptions[strength as keyof typeof descriptions] || 'Unknown strength level';
}

/**
 * Generate password requirements description for UI
 */
export function getPasswordRequirementsDescription(): string[] {
    return [
        `At least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
        'Contains at least one uppercase letter (A-Z)',
        'Contains at least one lowercase letter (a-z)',
        'Contains at least one number (0-9)',
        `Contains at least one special character (${PASSWORD_REQUIREMENTS.specialChars})`,
        `No more than ${PASSWORD_REQUIREMENTS.maxRepeatingChars} repeating characters`,
        'Does not contain common weak patterns',
        'Not a commonly used password'
    ];
}