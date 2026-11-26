const capitalizeAllLetters = (str: string): string => {
    if (typeof str !== 'string' || str.trim() === '') return ''; // Return empty string for non-string or empty input
    return str.toUpperCase();
  };
  
  export default capitalizeAllLetters;
  