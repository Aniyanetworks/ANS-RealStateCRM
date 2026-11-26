// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

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

