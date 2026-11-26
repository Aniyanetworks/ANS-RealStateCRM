export const formatNumberWithCommasAndDecimals = (amount:any) => {
    return `${parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };
  