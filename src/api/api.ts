import axios, { AxiosRequestConfig, Method } from 'axios';
import { jwtDecode } from 'jwt-decode';
import Config from '../config';
import { Util } from '../util/util';
import {
  CreatePaymentLink,
  CreatePaymentLinkPayment,
  Fiat,
  PaymentLink,
  PaymentLinkPaymentMode,
  PaymentLinkStatus,
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

  private fiats?: Fiat[];

  constructor() {
    if (!Config.api.address || !Config.api.signature) throw new Error('Invalid API credentials');
    this.authenticationInfo = { address: Config.api.address, signature: Config.api.signature };
  }

  // --- PAYMENT LINKS --- //
  async getPaymentLink(externalId: string): Promise<PaymentLink> {
    return this.callApi(this.url(externalId, false));
  }

  async createPaymentLink(externalId?: string): Promise<PaymentLink> {
    const dto: CreatePaymentLink = { externalId };
    return this.callApi('paymentLink', 'POST', dto);
  }

  async updatePaymentLink(externalId: string, status: PaymentLinkStatus): Promise<PaymentLink> {
    const dto: UpdatePaymentLink = { status };
    return this.callApi(this.url(externalId, false), 'PUT', dto);
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
      currency: await this.getFiat(currency),
      externalId,
      expiryDate,
      mode,
    };
    return this.callApi(this.url(linkExternalId, true), 'POST', dto);
  }

  async cancelPayment(linkExternalId: string): Promise<PaymentLink> {
    return this.callApi(this.url(linkExternalId, true), 'DELETE');
  }

  // --- OTHER --- //

  async getFiats(): Promise<Fiat[]> {
    return (this.fiats ??= await this.callApi('fiat'));
  }

  async getFiat(currency: string): Promise<Fiat> {
    const fiats = await this.getFiats();
    const fiat = fiats.find((f) => f.name === currency);
    if (!fiat) throw new Error(`Invalid currency ${currency}`);

    return fiat;
  }

  // --- HELPER METHODS --- //
  private url(externalId: string, isPayment: boolean): string {
    return `paymentLink${isPayment ? '/payment' : ''}?externalId=${externalId}`;
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
