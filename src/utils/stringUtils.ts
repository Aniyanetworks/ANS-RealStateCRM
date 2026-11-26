
export const formatStringCamelCasecapitalize = (text: string): string => {
    return text
      ?.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      ?.replace(/\b\w/g, (char) => char.toUpperCase())
      ?.replace(/\s+/g, ' ');
  };

export const toNameCase = (value?: string | null): string => {
  if (!value) return value ?? "";
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
};

export const cleanPersonName = (first?: string | null, last?: string | null) => {
  let f = toNameCase(first);
  const l = toNameCase(last);
  if (f && l && f.toLowerCase() !== l.toLowerCase() && f.toLowerCase().endsWith(" " + l.toLowerCase())) {
    f = f.slice(0, f.length - l.length).trim();
  }
  return { firstName: f, lastName: l };
};
