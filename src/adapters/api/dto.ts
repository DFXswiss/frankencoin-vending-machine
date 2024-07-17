export interface Fiat {
  id: number;
  name: string;
  buyable: boolean;
  sellable: boolean;
  cardBuyable: boolean;
  cardSellable: boolean;
  instantBuyable: boolean;
  instantSellable: boolean;
}

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
  currency: Fiat;
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
  status: PaymentLinkStatus;
}

export interface CreatePaymentLinkPayment {
  mode: PaymentLinkPaymentMode;
  amount: number;
  externalId?: string;
  currency: Fiat;
  expiryDate?: Date;
}

export interface CreatePaymentLink {
  externalId?: string;
  payment?: CreatePaymentLinkPayment;
}
