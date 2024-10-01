import axios, { AxiosRequestConfig, Method } from 'axios';
import { jwtDecode } from 'jwt-decode';
import Config from '../config';
import { Util } from '../util/util';
import {
  CreatePaymentLink,
  CreatePaymentLinkPayment,
  PaymentLink,
  PaymentLinkPaymentMode,
  PaymentLinkStatus,
  PaymentRecipient,
  UpdatePaymentLink,
} from './dto';

export interface ApiAuthenticationInfo {
  address: string;
  signature: string;
}

export class Api {
  private authenticationInfo: ApiAuthenticationInfo;
  private accessToken?: string;
  private expires?: Date;

  constructor() {
    if (!Config.api.address || !Config.api.signature) throw new Error('Invalid API credentials');
    this.authenticationInfo = { address: Config.api.address, signature: Config.api.signature };
  }

  // --- PAYMENT LINKS --- //
  async getPaymentLink(externalId: string): Promise<PaymentLink> {
    return this.callApi(this.url(externalId));
  }

  async createPaymentLink(route?: string, externalId?: string, recipient?: PaymentRecipient): Promise<PaymentLink> {
    const dto: CreatePaymentLink = { route, externalId, recipient };
    return this.callApi('paymentLink', 'POST', dto);
  }

  async updatePaymentLink(
    externalId: string,
    status?: PaymentLinkStatus,
    recipient?: PaymentRecipient,
  ): Promise<PaymentLink> {
    const dto: UpdatePaymentLink = { status, recipient };
    return this.callApi(this.url(externalId), 'PUT', dto);
  }

  async createPayment(
    linkExternalId: string,
    amount: number,
    currency: string,
    externalId?: string,
    expiryDate?: Date,
    mode = PaymentLinkPaymentMode.SINGLE,
  ): Promise<PaymentLink> {
    const dto: CreatePaymentLinkPayment = {
      amount,
      currency,
      externalId,
      expiryDate,
      mode,
    };
    return this.callApi(this.url(linkExternalId, 'payment'), 'POST', dto);
  }

  async cancelPayment(linkExternalId: string): Promise<PaymentLink> {
    return this.callApi(this.url(linkExternalId, 'payment'), 'DELETE');
  }

  async waitForPayment(linkExternalId: string): Promise<PaymentLink> {
    return this.callApi(this.url(linkExternalId, 'payment/wait'), 'GET');
  }

  // --- HELPER METHODS --- //
  private url(externalId: string, path?: string): string {
    return `paymentLink${path ? '/' + path : ''}?externalLinkId=${externalId}`;
  }

  private apiUrl(version = Config.api.version): string {
    return `${Config.api.url}/${version}`;
  }

  private async callApi<T>(
    url: string,
    method: Method = 'GET',
    data?: object,
    tryCount = 1,
    retryDelay = 300,
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      url: `${this.apiUrl()}/${url}`,
      method,
      data,
      headers: {
        Authorization: 'Bearer ' + (await this.getAccessToken()),
        'Device-Id': Config.deviceId,
      },
    };

    return Util.retry(() => axios.request<T>(config).then((r) => r.data), tryCount, retryDelay);
  }

  private async getAccessToken(): Promise<string | undefined> {
    if (!this.authenticationInfo) return undefined;

    // renew
    if (this.accessToken == null || this.expires == null || this.expires <= new Date()) {
      const result = await axios.post<{ accessToken: string }>(`${this.apiUrl()}/auth`, this.authenticationInfo);
      this.accessToken = result.data.accessToken;

      const jwt: { exp: number } = jwtDecode(this.accessToken);
      this.expires = new Date(jwt.exp * 1000);
      this.expires.setMinutes(this.expires.getMinutes() - 10);
    }

    return this.accessToken;
  }
}
