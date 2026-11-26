interface BorderBadgeProps {
  value: string;
  colorMap: (value: string) => { borderColor: string };
}

const BorderBadge = ({ value, colorMap }: BorderBadgeProps) => {
  const safeValue = value || '';
  
  const capitalizedValue = safeValue
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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
