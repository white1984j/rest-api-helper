declare module 'rest-api-helper';

interface RequestConfig {
  url: string,
  method: 'post' | 'get' | 'put' | 'delete' | 'head' | 'patch',
  headers?: Headers,
  parseConfig?: {
    [key: string]: string;
  }
}

export interface Config {
  baseURL: string,
  logger: boolean,
  statusDescription: {
    [status: number]: string,
  },
  headers?: {
    [key: string]: string,
  },
  successStatus: number[],
  request: {
    [method: string]: RequestConfig,
  },
}

interface Body {
  [key: string]: any;
}

type QueryParams = Body;

interface Headers {
  [key: string]: string;
}

export interface Response<T> {
  status: number;
  body: T;
  headers: Headers;
}

export interface Request<T> {
  withHeaders(headers: Headers): Request<T>;
  withBody(body: Body | string): Request<T>;
  shouldBeIntercepted(value: boolean): Request<T>;
  withQueryParams(params: QueryParams): Request<T>;
  withUrlParam(name: string, value: string | number): Request<T>;
  /*
   * @deprecated - use withUrlParam
   */
  withParam(name: string, value: string | number): Request<T>;
  fetch(): Promise<Response<T>>;
}

export interface Interceptor<T> {
  delegate: (response: Response<T>) => void;
}

export class RestApiHelper {
  /*
   * @deprecated - use withConfig
   */
  static configure(config: Config): void;
  static build<T>(method: string): Request<T>;

  static builder(): RestApiHelper;
  withConfig(config: any): RestApiHelper;
  withInterceptor<T>(interceptor: Interceptor<any>): RestApiHelper;
}

export default RestApiHelper;
