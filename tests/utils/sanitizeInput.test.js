/**
 * sanitizeInput Tests
 * Tests the input sanitization function from server.js
 */

// Recreate the sanitizeInput function (extracted from server.js line 233)
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>"']/g, '')
    .slice(0, 500);
};

describe('sanitizeInput', () => {
  it('should return non-string values unchanged', () => {
    expect(sanitizeInput(42)).toBe(42);
    expect(sanitizeInput(null)).toBeNull();
    expect(sanitizeInput(undefined)).toBeUndefined();
    expect(sanitizeInput(true)).toBe(true);
  });

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
    expect(sanitizeInput('\thello\n')).toBe('hello');
  });

  it('should remove angle brackets (XSS prevention)', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
  });

  it('should remove quotes', () => {
    expect(sanitizeInput('He said "hello"')).toBe('He said hello');
    expect(sanitizeInput("It's fine")).toBe('Its fine');
  });

  it('should truncate strings over 500 characters', () => {
    const longString = 'a'.repeat(600);
    const result = sanitizeInput(longString);
    expect(result.length).toBe(500);
  });

  it('should handle empty strings', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput('   ')).toBe('');
  });

  it('should preserve normal text', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World');
    expect(sanitizeInput('user@email.com')).toBe('user@email.com');
  });

  it('should handle strings with only special characters', () => {
    expect(sanitizeInput('<>"')).toBe('');
  });
});
