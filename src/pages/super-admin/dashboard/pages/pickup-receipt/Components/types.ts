export interface DataType {
  date: string;
  propertyAddress: string;
  receivedFrom: string;
  representation: string;
  paymentType: string;
  paymentMethod: string;
  amountReceived: number;
  receivedBy: string;
  signature: string;
  representationReceivedBy: string;
  bankDraftImage: File | null;
  uuid: string;
  bankDraftImagePath: string;
  transactionType: string;
  receiptId?: string;
  pickupPerson?: string;
  pickupBy?: string;
  reasonForPayment?: string;
  handleBy?: string;
  receiversId?: string;
  tradeSheetId?: string;
  serial?: number;
}

export const REASON_OPTIONS = [
  { value: "balanceOfDepositRefundReturn", label: "Balance of Deposit Refund" },
  { value: "depositRefund", label: "Deposit Refund" },
];
export const reasonLabel = (value?: string | null) => REASON_OPTIONS.find((o) => o.value === value)?.label || "N/A";

