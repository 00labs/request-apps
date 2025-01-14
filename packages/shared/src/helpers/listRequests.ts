import { useCallback } from "react";
import { Request } from "@frinkly/request-client.js";
import { IdentityTypes } from "@frinkly/types";
import { EventEmitter } from "events";
import { parseRequest } from "./parseRequest";
import { chainIdToName } from "./chainIdToName";
import { IParsedRequest } from "../";
import { ICurrencyManager } from "@frinkly/currency";
import { useCurrency } from "../contexts/CurrencyContext";
import { getRequestClient } from "./client";
import { useWeb3React } from "@web3-react/core";
import { providers } from "ethers";

interface IBalanceEvents {
  finished: () => void;
  update: (request: IParsedRequest) => void;
}

export class BalanceEventEmitter extends EventEmitter {
  private _untypedOn = this.on;
  private _untypedEmit = this.emit;
  public on = <K extends keyof IBalanceEvents>(
    event: K,
    listener: IBalanceEvents[K]
  ): this => this._untypedOn(event, listener);
  public emit = <K extends keyof IBalanceEvents>(
    event: K,
    ...args: Parameters<IBalanceEvents[K]>
  ): boolean => this._untypedEmit(event, ...args);
}

export const useListRequests = () => {
  const { currencyManager } = useCurrency();
  const { library } = useWeb3React();

  return useCallback(
    (
      account: string,
      network: string | number,
      isSmartContract: boolean = false
    ) =>
      listRequests(account, network, isSmartContract, currencyManager, library),
    [currencyManager]
  );
};

export const listRequests = async (
  account: string,
  network: string | number,
  isSmartContract: boolean = false,
  currencyManager: ICurrencyManager,
  provider: providers.Web3Provider
) => {
  network = chainIdToName(network);
  if (!account) {
    throw new Error("Not connected");
  }
  const requestNetwork = getRequestClient(network);

  const requests = await requestNetwork.fromIdentity(
    {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: account,
    },
    undefined,
    {
      disablePaymentDetection: true,
    }
  );

  if (isSmartContract) {
    // TODO @VRO
    console.log("Nothing to do, yet.");
  }

  const list = [];
  for (const request of requests) {
    try {
      const parsedRequest = await parseRequest({
        requestId: request.requestId,
        data: request.getData(),
        network: network as string,
        pending: false,
        currencyManager,
        provider,
      });
      parsedRequest.loaded = false;
      list.push(parsedRequest);
    } catch (e) {
      console.log(`request ${request.requestId} could not be parsed: ${e}`);
    }
  }
  const sorted = list.sort(
    (a, b) => b.createdDate.getTime() - a.createdDate.getTime()
  );

  const emitter = new BalanceEventEmitter();

  return {
    // preloaded requests, without balance
    requests: sorted,
    // a function to start loading balances.
    // The callback is called for each updated balance.
    loadBalances: () =>
      loadBalances(
        requests,
        sorted,
        network as string,
        emitter,
        currencyManager,
        provider
      ),
    on: emitter.on,
  };
};

const loadBalances = async (
  requests: Request[],
  sortedRequests: IParsedRequest[],
  network: string,
  emitter: BalanceEventEmitter,
  currencyManager: ICurrencyManager,
  provider: providers.Web3Provider
) => {
  let i = 0;
  // update balances by batches of 10.
  while (i < sortedRequests.length) {
    const promises = [];
    for (let j = i; j < Math.min(i + 10, sortedRequests.length); j++) {
      const parsedRequest = sortedRequests[j];
      const request = requests.find(
        (x) => x.requestId === parsedRequest.requestId
      );
      if (!request) {
        continue;
      }
      const promise = loadBalance(request, network, currencyManager, provider);

      promise.then((req) => req && emitter.emit("update", req));
      promises.push(promise);
    }

    await Promise.all(promises);
    i += 10;
  }
  emitter.emit("finished");
};

const loadBalance = async (
  request: Request,
  network: string,
  currencyManager: ICurrencyManager,
  provider: providers.Web3Provider
) => {
  try {
    await request.refreshBalance();
  } catch (e) {
    return null;
  }
  const newParsedRequest = await parseRequest({
    requestId: request.requestId,
    data: request.getData(),
    network,
    pending: false,
    currencyManager,
    provider,
  });
  newParsedRequest.loaded = true;
  return newParsedRequest;
};
