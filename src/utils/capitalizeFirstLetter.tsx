const capitalizeFirstLetter = (str: string): string => {
  if (typeof str !== 'string' || str.trim() === '') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default capitalizeFirstLetter;
