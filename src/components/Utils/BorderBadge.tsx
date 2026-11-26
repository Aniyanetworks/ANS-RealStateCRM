interface BorderBadgeProps {
  value: string;
  colorMap: (value: string) => { borderColor: string };
}

const BorderBadge = ({ value, colorMap }: BorderBadgeProps) => {
  // Handle null or undefined value
  const safeValue = value || '';
  
  // Capitalize the first letter of each word in the value
  const capitalizedValue = safeValue
    .split(' ') // Split into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
    .join(' '); // Join back into a single string

  const { borderColor } = colorMap(safeValue) || { borderColor: 'gray' };

  return (
    safeValue ? (
      <span
        style={{
          border: `1px solid ${borderColor}`,
          padding: '1px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          color: `${borderColor}`,
        }}
      >
        {capitalizedValue}
      </span>
    ) : ''
  );
};

export default BorderBadge;
