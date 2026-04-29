/**
 * Character Checker Utility
 * Business logic for comparing unique characters between two strings
 * with optional case sensitivity.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

/**
 * Check how many unique characters from input1 exist in input2.
 *
 * Algorithm:
 * 1. total = input1.length (total character count, not unique)
 * 2. Extract unique characters from input1 using Set
 * 3. Apply case sensitivity:
 *    - "insensitive": convert both inputs to lowercase before comparison
 *    - "sensitive": use original case
 * 4. Count how many unique chars from input1 appear in input2
 * 5. Calculate percentage: (matched / total) * 100, rounded to 2 decimals
 *
 * @param {string} input1 - The source string to extract unique characters from
 * @param {string} input2 - The target string to search for matches
 * @param {string} type - "sensitive" or "insensitive"
 * @returns {{ input1: string, input2: string, type: string, matched: number, total: number, percentage: number }}
 *
 * @example
 * // Case-insensitive: "ABBCD" vs "Gallant Duck"
 * // total = "ABBCD".length = 5
 * // unique chars from "ABBCD" (lowercase) = {a, b, c, d}
 * // "gallant duck" contains: a ✓, b ✗, c ✓, d ✓ → matched = 3
 * // percentage = (3 / 5) * 100 = 60.00
 * checkCharacters("ABBCD", "Gallant Duck", "insensitive")
 * // → { input1: "ABBCD", input2: "Gallant Duck", type: "insensitive", matched: 3, total: 5, percentage: 60.00 }
 */
function checkCharacters(input1, input2, type) {
  // Requirement 8.6: total is the length of input1 (not unique count)
  const total = input1.length;

  // Requirement 8.1: Extract unique characters from input1 using Set
  // Requirement 8.3: Apply case insensitivity if type === "insensitive"
  let compareInput1 = input1;
  let compareInput2 = input2;

  if (type === 'insensitive') {
    // Requirement 8.3: Convert both inputs to lowercase before comparison
    compareInput1 = input1.toLowerCase();
    compareInput2 = input2.toLowerCase();
  }
  // Requirement 8.2: For "sensitive", use original case (no transformation)

  // Extract unique characters from (possibly lowercased) input1
  const uniqueChars = new Set(compareInput1.split(''));

  // Requirement 8.4: Count how many unique chars from input1 exist in input2
  let matched = 0;
  for (const char of uniqueChars) {
    if (compareInput2.includes(char)) {
      matched++;
    }
  }

  // Requirement 8.6: Calculate percentage = (matched / total) * 100, rounded to 2 decimals
  const percentage = total > 0 ? Math.round((matched / total) * 100 * 100) / 100 : 0;

  // Requirement 8.5: Return object with input1, input2, type, matched, total, percentage
  return {
    input1,
    input2,
    type,
    matched,
    total,
    percentage,
  };
}

module.exports = {
  checkCharacters,
};
