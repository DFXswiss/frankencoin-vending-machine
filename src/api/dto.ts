export enum PaymentLinkStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum PaymentLinkPaymentStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  EXPIRED = 'Expired',
}

export enum PaymentLinkPaymentMode {
  SINGLE = 'Single',
  MULTIPLE = 'Multiple',
}

export interface PaymentLinkPayment {
  id: number;
  externalId?: string;
  status: PaymentLinkPaymentStatus;
  amount: number;
  currency: string;
  mode: PaymentLinkPaymentMode;
  expiryDate: Date;
  url: string;
  lnurl: string;
}

export interface PaymentLink {
  id: number;
  routeId: number;
  externalId?: string;
  status: PaymentLinkStatus;
  url: string;
  lnurl: string;
  payment?: PaymentLinkPayment;
}

export interface UpdatePaymentLink {
  status?: PaymentLinkStatus;
  webhookUrl?: string;
  recipient?: PaymentRecipient;
}

export interface CreatePaymentLinkPayment {
  mode: PaymentLinkPaymentMode;
  amount: number;
  externalId?: string;
  currency: string;
  expiryDate?: Date;
}
export interface PaymentRecipient {
  name?: string;
  address?: {
    street?: string;
    houseNumber?: string;
    zip?: string;
    city?: string;
    country?: string;
  };
  phone?: string;
  mail?: string;
  website?: string;
}

export interface CreatePaymentLink {
  route?: string;
  externalId?: string;
  webhookUrl?: string;
  recipient?: PaymentRecipient;
  payment?: CreatePaymentLinkPayment;
}
