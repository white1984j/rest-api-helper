import { copyObject } from 'rest-api-helper/src/utils';
import { Logger } from './api-hepler-logger';
import config from '../config/config';
import { Options } from './Options';
import { RequestError } from './RequestError';
import { Request } from './Requst';
import { isApplicationJson, isTextPlain } from "./utils";

export class RestApiHelper {
	static _config = {};
	static interceptor;

	static configure(config) {
		RestApiHelper._config = config;
		Logger.setOption(config.logger);
		Logger.log('ApiHelper/CONFIG', {config});
	}

	static build(url) {
		if (url) {
			try {
				return new Request(copyObject(RestApiHelper._config.request[url]), url);
			} catch (e) {
				throw new Error(e);
			}
		} else {
			throw new Error('You should specify url');
		}
	}

	static builder() {
		return RestApiHelper;
	}

	static withConfig(config) {
		RestApiHelper._config = config;
		Logger.setOption(config.logger);
		Logger.log('apiHelper[CONFIG]', {config});
		return RestApiHelper;
	}

	static withInterceptor(interceptor) {
		RestApiHelper.interceptor = interceptor;
		return RestApiHelper;
	}

	static async fetch(request) {
		let responseBody = {};
		let responseHeaders = {};

		const config = typeof request === 'object' ? request._config : RestApiHelper._config.request[request];
		const options = new Options(config, RestApiHelper._config.baseURL, RestApiHelper._config.headers);

		try {
			Logger.log(`apiHelper[${(options.getMethod()).toUpperCase()}]	[${options.getRequestUrl()}]: `, {url: options.getUrl(), ...options.getOptions()});
			const response = await fetch(options.getUrl(), options.getOptions());
			Logger.log(`apiHelper[COMPLETE]	[${options.getRequestUrl()}]:`, {response}, 'blue');

			responseHeaders = RestApiHelper._parseHeaders(response);

			try {
				if (isTextPlain(responseHeaders)) {
					responseBody = await response.text()
				} else if (isApplicationJson(responseHeaders)) {
					responseBody = await response.json()
				} else {
					responseBody = await response.formData()
				}
				Logger.log(`apiHelper[PARSE]	[${options.getRequestUrl()}]:`, {
					status: response.status,
					body: responseBody,
					headers: responseHeaders
				}, 'green');
			} catch (error) {
				/* that's okay. If status 400, for example, it crashes, but that's okay :) Do nothing */
			}

			return RestApiHelper._decorate({
				status: response.status,
				body: responseBody,
				headers: responseHeaders
			}, request.isInterceptionEnabled, options.getRequestUrl());
		} catch (error) {
			throw error;
		}
	}

	static _decorate(response, isInterceptionEnabled, requestName) {

		if (RestApiHelper.interceptor && isInterceptionEnabled) {
			RestApiHelper.interceptor.delegate({
				status: response.status,
				meta: response
			})
		}

		if (RestApiHelper._isSuccess(response.status)) {
			return response;
		}
		const message = {status: `${response.status} ${RestApiHelper._config.statusDescription[response.status] || config.status[response.status]}`};
		Logger.log(`apiHelper[ERROR]	[${requestName}]:`, message, 'red');

		throw new RequestError(`${response.status}`, `${RestApiHelper._config.statusDescription[response.status] || config.status[response.status]}`, JSON.stringify(response.body));
	}

	static _isSuccess(status) {
		return RestApiHelper._config.successStatus.indexOf(status) !== -1;
	}

	static _parseHeaders(response) {
		if (response) {
			if (response.headers) {
				if (response.headers.map) {
					return response.headers.map;
				} else {
					return response.headers;
				}
			} else {
				return {}
			}
		}
	}
}
