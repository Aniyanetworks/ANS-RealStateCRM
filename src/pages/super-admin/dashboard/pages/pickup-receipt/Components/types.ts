export interface DataType {
  date: string; // Date of the transaction
  propertyAddress: string; // Address of the property
  receivedFrom: string; // Received from (Sales Representative, Buyer, Tenant)
  representation: string; // Representation type
  paymentType: string; // Type of payment
  paymentMethod: string; // Payment method
  amountReceived: number; // Amount received
  receivedBy: string; // Received by (who received the payment)
  signature: string; // Signature
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

/** Reason For Payment (optional). The stored value "balanceOfDepositRefundReturn" is kept so existing receipts still read correctly. */
export const REASON_OPTIONS = [
  { value: "balanceOfDepositRefundReturn", label: "Balance of Deposit Refund" },
  { value: "depositRefund", label: "Deposit Refund" },
];
export const reasonLabel = (value?: string | null) => REASON_OPTIONS.find((o) => o.value === value)?.label || "N/A";

