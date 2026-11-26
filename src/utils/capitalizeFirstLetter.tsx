const capitalizeFirstLetter = (str: string): string => {
  if (typeof str !== 'string' || str.trim() === '') return ''; // Return empty string for non-string or empty input
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default capitalizeFirstLetter;
