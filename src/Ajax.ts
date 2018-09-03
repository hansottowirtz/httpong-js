/// <reference types="jquery"/>
/// <reference types="angular"/>

import { ElpongError } from './Errors';
import { Util } from './Util';

export type AjaxPromiseThenOnResolveFunction = (response: AjaxResponse) => void;
export type AjaxPromiseThenFunction = (resolve_fn: AjaxPromiseThenOnResolveFunction) => any;

export type AjaxPromise = Promise<AjaxResponse>;

export interface AjaxResponse extends Response {
  data?: any;
}

export type AjaxExternalFunction = Function | any;
export type AjaxFunction = (url: string, instruction: AjaxInstruction) => AjaxPromise;

export interface AjaxObject {
  data: {};
}

export interface AjaxInstruction {
  data: {};
  method: string;
  headers: {};
  [prop: string]: any;
}

export type AjaxData = any;

export interface AjaxHeaders {
  [name: string]: string;
}

export enum AjaxAdapterType {
  Fetch = 0,
  Angular = 1,
  AngularJS = 2,
  JQuery = 3
}

export type AjaxAdapterTypeString = 'fetch'|'angular'|'angularjs'|'jquery';

export namespace Ajax {
  let ajaxFunction: AjaxFunction;

  interface AjaxFunctionOptions {
    method: string;
    type: string;
    url: string;
    data: string;
    body: string;
    headers: AjaxHeaders;
    dataType: 'json';
    responseType: 'json';
  }

  export function executeRequest(url: string, method: string, data?: AjaxData, headers?: AjaxHeaders) {
    if (!headers) { headers = {}; }
    headers['Accept'] = headers['Content-Type'] = 'application/json';
    const serialized_data = JSON.stringify(data === undefined ? {} : data);
    let options: AjaxFunctionOptions = {
      method: method,
      type: method,
      url: url,
      data: serialized_data,
      body: serialized_data,
      headers: headers,
      dataType: 'json',
      responseType: 'json'
    };
    return ajaxFunction(options.url, options);
  }

  // Set the http function used for requests
  // The function should accept one object with keys
  // method, url, params, headers
  // and return a promise-like object
  // with then and catch
  //
  // @note Like $http or jQuery.ajax or http.request or fetch
  // @param {Function} fn The function.
  // @param {string} type The function.
  export function setAjaxFunction(fn: AjaxExternalFunction, adapter_type?: AjaxAdapterType|AjaxAdapterTypeString) {
    const type = convertAjaxAdapterTypeStringToType(adapter_type);
    switch (type) {
      case AjaxAdapterType.JQuery:
        ajaxFunction = (url: string, instruction: AjaxInstruction) => {
          let deferred = jQuery.Deferred();
          let ajax = (fn as Function)(url, instruction);
          ajax.then((data: any, status: any, jqxhr: any) => deferred.resolve({data, status: jqxhr.statusCode().status, headers: jqxhr.getAllResponseHeaders()}));
          ajax.catch((data: any, status: any, jqxhr: any) => deferred.reject({data, status: jqxhr.statusCode().status, headers: jqxhr.getAllResponseHeaders()}));
          // Convert to Promise, as Typescript users are probably not using jQuery
          // and if so, they won't have a lot of trouble with the differences.
          return deferred.promise() as any as Promise<any>;
        }
        break;
      case AjaxAdapterType.Fetch:
        ajaxFunction = (url: string, instruction: AjaxInstruction) => {
          return new Promise((resolve, reject) => {
            // Request with GET/HEAD method cannot have body
            (instruction as any).body = (instruction.method === 'GET') ? undefined : instruction.data;
            let http_promise = (fn as Function)(url, instruction) as Promise<Response>;
            http_promise.then((response: Response) => {
              if (response.status === 204) {
                resolve(response);
              } else {
                const contentType = response.headers.get('content-type');
                if (!contentType || contentType.indexOf('json') < 0) throw new ElpongError('ajahct');
                let json_promise = response.json();
                json_promise.then((json: string) => {
                  (response as any).data = json;
                  resolve(response);
                });
                json_promise.catch(reject);
              }
            });
            http_promise.catch(reject);
          });
        }
        break;
      case AjaxAdapterType.Angular:
        ajaxFunction = (url: string, instruction: AjaxInstruction) => {
          return new Promise<AjaxResponse>((resolve, reject) => {
            instruction.responseType = undefined;
            (fn as any).request.bind(fn)(url, instruction).subscribe((response: any) => {
              if (response.status === 204) {
                resolve(response)
              } else {
                const contentType = response.headers.get('content-type');
                if (!contentType || contentType.indexOf('json') < 0) throw new Error('ajahct');
                const json = response.json();
                (response as any).data = json;
                resolve(response);
              }
            }, (httpErrorResponse: any) => { reject(httpErrorResponse); });
          });
        }
        break;
      default:
        // Default is AngularJS behavior, a promise that resolves to a response
        // object with the payload in the data field.
        ajaxFunction = (url: string, instruction: AjaxInstruction) => (fn as Function)(instruction);
    }
  }

  function convertAjaxAdapterTypeStringToType(type?: AjaxAdapterType|AjaxAdapterTypeString): AjaxAdapterType {
    if (!Util.isInteger(type)) {
      switch (type) {
        case 'angular':
          return AjaxAdapterType.Angular;
        case 'angularjs':
          return AjaxAdapterType.AngularJS;
        case 'jquery':
          return AjaxAdapterType.JQuery;
        default:
          return AjaxAdapterType.Fetch;
      }
    } else {
      return type;
    }
  }
}
