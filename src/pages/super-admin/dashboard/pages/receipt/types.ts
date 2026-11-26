// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

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
  /** Each bank receipt file's stored location (path) and displayable copy (src), from the receipt list API. */
  bankDraftImages?: { path: string; src: string | null }[];
  transactionType: string;
  status?: string;
  recipients?: string;
  subject?: string;
  data?: string;
  attachments?: string;
  bankDraftNumber?: string;
  receiptId?: string;
  propertyListingId?: string | number;
  refundReceiptAndMutualReleaseFile?: string;
}

export interface ImageItem {
  file?: File;
  preview: string;
  isExisting: boolean;
  path?: string;
}

