export enum MessageType {
  PRODUCT = 'Product',
  ERROR = 'Error',
}

export interface ProductPayload {
  product: number;
  price: number;
}

export interface ProductMessage {
  type: MessageType.PRODUCT;
  payload: ProductPayload;
}

export interface ErrorMessage {
  type: MessageType.ERROR;
  payload: string;
}

export type Message = ProductMessage | ErrorMessage;
