/**
 * Input sanitization utilities for frontend
 * Prevents XSS attacks by sanitizing user input
 */
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize a string input by removing all HTML tags
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
    }).trim();
};

/**
 * Sanitize all string values in an object
 * @param obj - Object to sanitize
 * @returns Object with sanitized string values
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
    const sanitized = {} as T;

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key as keyof T] = sanitizeInput(value) as any;
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key as keyof T] = sanitizeObject(value);
        } else if (Array.isArray(value)) {
            sanitized[key as keyof T] = value.map(item =>
                typeof item === 'string' ? sanitizeInput(item) : item
            ) as any;
        } else {
            sanitized[key as keyof T] = value;
        }
    }

    return sanitized;
};

/**
 * Sanitize HTML content while allowing specific tags
 * @param html - HTML string to sanitize
 * @param allowedTags - Array of allowed HTML tags
 * @returns Sanitized HTML string
 */
export const sanitizeHTML = (
    html: string,
    allowedTags: string[] = ['b', 'i', 'em', 'strong', 'a']
): string => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: ['href', 'title'],
    });
};

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if email format is valid
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

/**
 * Sanitize filename to prevent directory traversal
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
    // Remove path components
    const baseName = filename.split('/').pop() || filename;

    // Remove dangerous characters
    const sanitized = baseName.replace(/[^\w\s.-]/g, '');

    // Limit length
    return sanitized.length > 255 ? sanitized.substring(0, 255) : sanitized;
};
