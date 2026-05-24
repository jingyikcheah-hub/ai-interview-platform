/**
 * PII Redaction Utility
 * Scrubs Personal Identifiable Information (PII) before sending data to external APIs.
 */

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

/**
 * Redacts common PII from text
 * @param {string} text - The input text to sanitize
 * @returns {string} - The sanitized text
 */
export function redactPII(text) {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;
  
  // Redact Emails
  sanitized = sanitized.replace(EMAIL_REGEX, '[EMAIL_REDACTED]');
  
  // Redact Phone numbers (US/Intl general formats)
  sanitized = sanitized.replace(PHONE_REGEX, '[PHONE_REDACTED]');
  
  // Redact SSN
  sanitized = sanitized.replace(SSN_REGEX, '[SSN_REDACTED]');

  // Note: Redacting names is notoriously difficult with regex without NLP models,
  // so we stick to deterministic hard-identifiers for this middleware.
  
  return sanitized;
}
