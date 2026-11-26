/* eslint-disable @typescript-eslint/no-explicit-any */

import moment from 'moment';

export const formatDate = (isoDate: any): string => {
  if (isoDate) {
    return moment.utc(isoDate).format('YYYY-MM-DD');
  }
  return '';
};

export const normalizeAddress = (addressParts: string[]): string => {
  return addressParts
    .filter(Boolean)
    .map(part => part?.toLowerCase().trim().replace(/[^\w\s]/g, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const extractAddressParts = (propertyAddress: string) => {
  if (!propertyAddress) return { streetNumber: '', streetName: '', city: '' };
  
  const firstPart = propertyAddress.split(',')[0]?.trim() || propertyAddress.trim();
  const streetMatch = firstPart.match(/^(\d+)\s+(.+)$/);
  const streetNumber = streetMatch ? streetMatch[1] : '';
  const streetName = streetMatch ? streetMatch[2].trim() : firstPart;
  
  return {
    streetNumber: streetNumber,
    streetName: streetName,
    city: ''
  };
};

export const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
};

export const calculateSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 100;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  if (longer.includes(shorter)) {
    return (shorter.length / longer.length) * 100;
  }
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return ((maxLength - distance) / maxLength) * 100;
};

