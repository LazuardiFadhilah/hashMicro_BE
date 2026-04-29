const { checkCharacters } = require('../characterChecker');

// ─── checkCharacters ─────────────────────────────────────────────────────────

describe('checkCharacters', () => {
  // ── Return shape ────────────────────────────────────────────────────────────

  describe('return shape', () => {
    it('returns an object with all required fields', () => {
      const result = checkCharacters('abc', 'abcdef', 'sensitive');
      expect(result).toHaveProperty('input1', 'abc');
      expect(result).toHaveProperty('input2', 'abcdef');
      expect(result).toHaveProperty('type', 'sensitive');
      expect(result).toHaveProperty('matched');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('percentage');
    });

    it('preserves original input1 and input2 in the result (even for insensitive)', () => {
      const result = checkCharacters('ABBCD', 'Gallant Duck', 'insensitive');
      expect(result.input1).toBe('ABBCD');
      expect(result.input2).toBe('Gallant Duck');
      expect(result.type).toBe('insensitive');
    });
  });

  // ── total = input1.length (Requirement 8.6) ─────────────────────────────────

  describe('total equals input1.length (not unique count)', () => {
    it('total is 5 for "ABBCD" (length 5, not 4 unique chars)', () => {
      const result = checkCharacters('ABBCD', 'Gallant Duck', 'insensitive');
      expect(result.total).toBe(5);
    });

    it('total is 3 for "aaa" (length 3, not 1 unique char)', () => {
      const result = checkCharacters('aaa', 'xyz', 'sensitive');
      expect(result.total).toBe(3);
    });

    it('total is 1 for single character input', () => {
      const result = checkCharacters('a', 'abc', 'sensitive');
      expect(result.total).toBe(1);
    });
  });

  // ── Unique character extraction (Requirement 8.1) ───────────────────────────

  describe('unique character extraction from input1', () => {
    it('counts each unique char only once when checking matches', () => {
      // "aaa" has 1 unique char 'a'; 'a' is in "abc" → matched = 1
      const result = checkCharacters('aaa', 'abc', 'sensitive');
      expect(result.matched).toBe(1);
    });

    it('counts all unique chars when all are distinct', () => {
      // "abc" has 3 unique chars; all in "abcdef" → matched = 3
      const result = checkCharacters('abc', 'abcdef', 'sensitive');
      expect(result.matched).toBe(3);
    });

    it('handles repeated characters in input1 correctly', () => {
      // "ABBCD" → unique = {A, B, C, D} (case-sensitive)
      // "ABCDE" contains A✓, B✓, C✓, D✓ → matched = 4
      const result = checkCharacters('ABBCD', 'ABCDE', 'sensitive');
      expect(result.matched).toBe(4);
    });
  });

  // ── Case-sensitive matching (Requirement 8.2) ────────────────────────────────

  describe('case-sensitive matching (type="sensitive")', () => {
    it('does not match lowercase against uppercase', () => {
      // unique chars from "abc" = {a, b, c}; "ABC" has no lowercase → matched = 0
      const result = checkCharacters('abc', 'ABC', 'sensitive');
      expect(result.matched).toBe(0);
    });

    it('matches exact case characters', () => {
      // unique chars from "aBc" = {a, B, c}; "aBcDe" has a✓, B✓, c✓ → matched = 3
      const result = checkCharacters('aBc', 'aBcDe', 'sensitive');
      expect(result.matched).toBe(3);
    });

    it('partial case match counts only exact matches', () => {
      // unique chars from "aB" = {a, B}; "ab" has a✓, B✗ → matched = 1
      const result = checkCharacters('aB', 'ab', 'sensitive');
      expect(result.matched).toBe(1);
    });
  });

  // ── Case-insensitive matching (Requirement 8.3) ──────────────────────────────

  describe('case-insensitive matching (type="insensitive")', () => {
    it('matches lowercase against uppercase when insensitive', () => {
      // unique chars from "abc" (lowercased) = {a, b, c}; "ABC" lowercased = "abc" → matched = 3
      const result = checkCharacters('abc', 'ABC', 'insensitive');
      expect(result.matched).toBe(3);
    });

    it('matches uppercase against lowercase when insensitive', () => {
      // unique chars from "ABC" (lowercased) = {a, b, c}; "abcdef" → matched = 3
      const result = checkCharacters('ABC', 'abcdef', 'insensitive');
      expect(result.matched).toBe(3);
    });

    it('matches the docstring example: ABBCD vs Gallant Duck', () => {
      // total = 5, unique (lowercase) = {a, b, c, d}
      // "gallant duck" contains: a✓, b✗, c✓, d✓ → matched = 3
      // percentage = (3/5)*100 = 60.00
      const result = checkCharacters('ABBCD', 'Gallant Duck', 'insensitive');
      expect(result.matched).toBe(3);
      expect(result.total).toBe(5);
      expect(result.percentage).toBe(60);
    });
  });

  // ── Percentage calculation (Requirement 8.6) ─────────────────────────────────

  describe('percentage calculation', () => {
    it('calculates percentage as (matched / total) * 100', () => {
      // "abc" → total=3, all match "abcdef" → matched=3, percentage=100
      const result = checkCharacters('abc', 'abcdef', 'sensitive');
      expect(result.percentage).toBe(100);
    });

    it('returns 0 percentage when no characters match', () => {
      const result = checkCharacters('abc', 'xyz', 'sensitive');
      expect(result.percentage).toBe(0);
    });

    it('rounds percentage to 2 decimal places', () => {
      // "aaa" → total=3, unique={a}, 'a' in "abc" → matched=1
      // percentage = (1/3)*100 = 33.333... → 33.33
      const result = checkCharacters('aaa', 'abc', 'sensitive');
      expect(result.percentage).toBe(33.33);
    });

    it('calculates 60% for the docstring example', () => {
      const result = checkCharacters('ABBCD', 'Gallant Duck', 'insensitive');
      expect(result.percentage).toBe(60);
    });

    it('handles 50% correctly', () => {
      // "ab" → total=2, unique={a,b}, "ac" has a✓, b✗ → matched=1
      // percentage = (1/2)*100 = 50
      const result = checkCharacters('ab', 'ac', 'sensitive');
      expect(result.percentage).toBe(50);
    });

    it('returns 0 percentage for empty input1', () => {
      const result = checkCharacters('', 'abc', 'sensitive');
      expect(result.percentage).toBe(0);
      expect(result.total).toBe(0);
      expect(result.matched).toBe(0);
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty input1', () => {
      const result = checkCharacters('', 'abc', 'sensitive');
      expect(result.total).toBe(0);
      expect(result.matched).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('handles empty input2 (no matches possible)', () => {
      const result = checkCharacters('abc', '', 'sensitive');
      expect(result.matched).toBe(0);
      expect(result.total).toBe(3);
      expect(result.percentage).toBe(0);
    });

    it('handles single character match', () => {
      const result = checkCharacters('a', 'a', 'sensitive');
      expect(result.matched).toBe(1);
      expect(result.total).toBe(1);
      expect(result.percentage).toBe(100);
    });

    it('handles single character no match', () => {
      const result = checkCharacters('a', 'b', 'sensitive');
      expect(result.matched).toBe(0);
      expect(result.total).toBe(1);
      expect(result.percentage).toBe(0);
    });

    it('handles spaces as characters', () => {
      // " " (space) is a character; "hello world" contains a space
      const result = checkCharacters(' ', 'hello world', 'sensitive');
      expect(result.matched).toBe(1);
    });

    it('handles numeric characters in strings', () => {
      const result = checkCharacters('123', '1234', 'sensitive');
      expect(result.matched).toBe(3);
      expect(result.total).toBe(3);
      expect(result.percentage).toBe(100);
    });
  });
});
