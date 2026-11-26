const capitalizeAllLetters = (str: string): string => {
    if (typeof str !== 'string' || str.trim() === '') return '';
    return str.toUpperCase();
  };
  
  export default capitalizeAllLetters;
  