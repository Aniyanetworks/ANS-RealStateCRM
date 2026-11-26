// src/utils/stringUtils.ts

/**
 * This function will dynamically format strings based on given rules.
 * 
 * @param {string} input - The input string to be formatted.
 * @param {Array<{ search: string, replace: string }>} rules - The rules to apply on the input string.
 * @returns {string} - The formatted string.
 */
export const formatStringCamelCasecapitalize = (text: string): string => {
    // Replace camelCase with spaces and capitalize each word
    return text
      ?.replace(/([a-z0-9])([A-Z])/g, '$1 $2')  // Add space before uppercase letters
      ?.replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize the first letter of each word
      ?.replace(/\s+/g, ' '); // Replace multiple spaces with a single space
  };

/**
 * Person-name case: first letter of each word capital, the rest lower ("CHRISTIANE" -> "Christiane").
 * Also capitalises after "-" and "'" ("anne-marie o'brien" -> "Anne-Marie O'Brien"). Empty values pass through.
 */
export const toNameCase = (value?: string | null): string => {
  if (!value) return value ?? "";
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
};

/**
 * Split-name clean-up for "First / Last" fields: name-cases both and removes the last name when it was also
 * typed at the end of the first name ("CHRISTIANE SYLVAIN" + "SYLVAIN" -> "Christiane" + "Sylvain").
 */
export const cleanPersonName = (first?: string | null, last?: string | null) => {
  let f = toNameCase(first);
  const l = toNameCase(last);
  if (f && l && f.toLowerCase() !== l.toLowerCase() && f.toLowerCase().endsWith(" " + l.toLowerCase())) {
    f = f.slice(0, f.length - l.length).trim();
  }
  return { firstName: f, lastName: l };
};
