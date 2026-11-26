/**
 * Generates a modified URL by replacing the base URL with a new base URL.
 * @param originalLink - The original URL to be modified.
 * @param oldBaseUrl - The base URL to be replaced.
 * @param newBaseUrl - The new base URL to replace with.
 * @returns - The modified URL.
 */
const generateEventLink = (originalLink: string): string => {
    const oldBaseUrl = "https://www.google.com/calendar";
    const newBaseUrl = "https://calendar.google.com/calendar/u/0";
    const modifiedLink = originalLink.replace(oldBaseUrl, newBaseUrl);
    return modifiedLink;
}

export default generateEventLink;