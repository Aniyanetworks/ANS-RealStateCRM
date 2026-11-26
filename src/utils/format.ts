export const formatPhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber) {
    return "";
  }
  let value = phoneNumber ? phoneNumber.replace(/\D/g, "") : "";
  // Format the phone number
  if (value.startsWith("1")) {
    value = "+" + value; // Add the "+" if the user types "1" as the country code
  } else {
    value = "+1" + value; // Default to Canada code "+1"
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

//format postal code
export const formatPostalCode = (postalCode: string) => {
  if (!postalCode) {
    return "";
  }
  let value = postalCode.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Add space after the third character if it's missing
  if (value.length > 3) {
    value = value.slice(0, 3) + " " + value.slice(3);
  }

  // Limit to 7 characters (6 + space)
  if (value.length > 7) {
    value = value.slice(0, 7);
  }
  return value;
};


export const formatToTwoDecimalPlaces = (value: any) => {
  const numericValue = parseFloat(value); // Convert the input to a number
  if (isNaN(numericValue)) {
    return "0.00"; // Return default if not a valid number
  }

  return numericValue.toFixed(2);
};

