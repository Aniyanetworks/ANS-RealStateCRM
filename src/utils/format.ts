export const formatPhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber) {
    return "";
  }
  let value = phoneNumber ? phoneNumber.replace(/\D/g, "") : "";
  if (value.startsWith("1")) {
    value = "+" + value;
  } else {
    value = "+1" + value;
  }

  if (value.length > 2 && value.length <= 5) {
    value = value.slice(0, 2) + " (" + value.slice(2);
  } else if (value.length > 5 && value.length <= 8) {
    value =
      value.slice(0, 2) + " (" + value.slice(2, 5) + ") " + value.slice(5);
  } else if (value.length > 8) {
    value =
      value.slice(0, 2) +
      " (" +
      value.slice(2, 5) +
      ") " +
      value.slice(5, 8) +
      "-" +
      value.slice(8, 12);
  }

  return value;
};

export const formatPostalCode = (postalCode: string) => {
  if (!postalCode) {
    return "";
  }
  let value = postalCode.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (value.length > 3) {
    value = value.slice(0, 3) + " " + value.slice(3);
  }

  if (value.length > 7) {
    value = value.slice(0, 7);
  }
  return value;
};


export const formatToTwoDecimalPlaces = (value: any) => {
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    return "0.00";
  }

  return numericValue.toFixed(2);
};

