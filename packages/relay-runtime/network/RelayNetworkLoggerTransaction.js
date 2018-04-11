/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule RelayNetworkLoggerTransaction
 * @flow
 * @format
 */

'use strict';

const invariant = require('invariant');

import type {CacheConfig, Variables} from '../util/RelayRuntimeTypes';
import type {RequestNode} from 'RelayConcreteNode';
import type {ExecutePayload, UploadableMap} from 'RelayNetworkTypes';

let queryID = 1;

export interface IRelayNetworkLoggerTransaction {
  constructor(config: TransactionConfig): void;
  addLog(label: string, ...values: Array<any>): void;
  commitLogs(error: ?Error, payload: ?ExecutePayload, status?: ?string): void;
  flushLogs(error: ?Error, payload: ?ExecutePayload, status?: ?string): void;
  markCommitted(): void;
  getCacheConfig(): ?CacheConfig;
  getIdentifier(): string;
  getLogsToPrint(): Array<RelayNetworkLog>;
  getRequest(): RequestNode;
  getUploadables(): ?UploadableMap;
  getVariables(): Variables;
}

type TransactionConfig = {
  request: RequestNode,
  variables: Variables,
  cacheConfig: ?CacheConfig,
  uploadables?: ?UploadableMap,
};

export type RelayNetworkLog = {
  label: string,
  values: Array<any>,
};

/**
 * A network logger transaction is an object that you can construct, pass around
 * and add logs to, ultimately calling its commit method when you're done.
 * Different transactions can have different commit logic. One might use
 * `console.log`. Another might ping a logging endpoint. Another might add some
 * autogenerated logs before doing either of the foregoing.
 */
class RelayNetworkLoggerTransaction implements IRelayNetworkLoggerTransaction {
  _cacheConfig: ?CacheConfig;
  _hasCommittedLogs = false;
  _id: number;
  _logs: Array<RelayNetworkLog> = [];
  _request: RequestNode;
  _uploadables: ?UploadableMap;
  _variables: Variables;

  constructor({
    request,
    variables,
    cacheConfig,
    uploadables,
  }: TransactionConfig): void {
    this._cacheConfig = cacheConfig;
    this._id = queryID++;
    this._request = request;
    this._uploadables = uploadables;
    this._variables = variables;
  }

  addLog(label: string, ...values: Array<any>): void {
    this._logs.push({label, values});
  }

  clearLogs(): void {
    this._logs = [];
  }

  printLogs(error: ?Error, payload: ?ExecutePayload, status?: ?string): void {
    /* eslint-disable no-console */
    const transactionId = this.getIdentifier();
    console.groupCollapsed &&
      console.groupCollapsed(`%c${transactionId}`, error ? 'color:red' : '');
    console.timeEnd && console.timeEnd(transactionId);
    this.getLogsToPrint(error, payload, status).forEach(({label, values}) => {
      console.log(`${label}:`, ...values);
    });
    console.groupEnd && console.groupEnd();
    /* eslint-enable no-console */
  }

  commitLogs(error: ?Error, payload: ?ExecutePayload, status?: ?string): void {
    invariant(
      this._hasCommittedLogs === false,
      `The logs for transaction #${this._id} have already been committed.`,
    );
    this.printLogs(error, payload, status);
    this.markCommitted();
  }

  markCommitted() {
    this._hasCommittedLogs = true;
  }

  flushLogs(error: ?Error, payload: ?ExecutePayload, status?: ?string): void {
    invariant(
      this._hasCommittedLogs === false,
      `The logs for transaction #${this._id} have already been committed.`,
    );
    this.printLogs(error, payload, status);
    this.clearLogs();
  }

  getCacheConfig(): ?CacheConfig {
    return this._cacheConfig;
  }

  getIdentifier(): string {
    return `[${this._id}] Relay Modern: ${this._request.name}`;
  }

  getLogsToPrint(
    error: ?Error,
    payload: ?ExecutePayload,
    status: ?string,
  ): Array<RelayNetworkLog> {
    return this._logs;
  }

  getRequest(): RequestNode {
    return this._request;
  }

  getUploadables(): ?UploadableMap {
    return this._uploadables;
  }

  getVariables(): Variables {
    return this._variables;
  }
}

module.exports = RelayNetworkLoggerTransaction;