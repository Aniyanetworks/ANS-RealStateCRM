export type TabType = {
  id: string;
  name: string;
};

export const tabs: TabType[] = [
  {
    id: "current",
    name: "Current Listings",
  },
  {
    id: "previous",
    name: "Previous Listings",
  },
  {
    id: "all",
    name: "All Listings",
  },
];

export const statusOptions = [
  {
    label: "Approved",
    value: "approved",
  },
  {
    label: "Under Review",
    value: "underReview",
  },
  {
    label: "Draft",
    value: "draft",
  },
  {
    label: "Incomplete",
    value: "rejected",
  },
  {
    label: "Pending MLS",
    value: "pendingMls",
  },
];

export const listingStatusOptions = [
  {
    label: "Listed",
    value: "listed",
  },
  {
    label: "Sold Conditional",
    value: "soldConditional",
  },
  {
    label: "Leased",
    value: "leased",
  },
  {
    label: "Terminated",
    value: "terminated",
  },
  {
    label: "Suspended",
    value: "suspended",
  },
  {
    label: "Extended",
    value: "extended",
  },
  {
    label: "Expired",
    value: "expired",
  },
  {
    label: "DFT",
    value: "dft",
  },
  {
    label: "Closed",
    value: "closed",
  },
  {
    label: "Exclusive",
    value: "exclusive",
  },
];
