import moment from "moment";
export const formatDateYYYYMMDD = (isoDate: Date | string | null | undefined): string => {
  if (isoDate) {
    return moment.utc(isoDate).format("YYYY-MM-DD");
  } else {
    return "";
  }
};

export const formatDate27September2012 = (date: Date | string | null | undefined): string => {
  if (date) {
    return moment(date).format("DD MMMM YYYY");
  } else {
    return "";
  }
};


