import { utils, BigNumber, providers, ethers } from "ethers";

import { Types } from "@frinkly/request-client.js";
import { ICurrencyManager } from "@frinkly/currency";

import { chainInfos, fetchReceivableMinted, IParsedRequest } from "../";
import { ExtensionTypes } from "@frinkly/types";

const getStatus = (
  state: Types.RequestLogic.STATE,
  expectedAmount: BigNumber,
  balance: BigNumber | undefined,
  pending: boolean,
  receivableMinted?: boolean,
  receivableStatusRequiresChainSwitch?: boolean
) => {
  if (!balance) return "unknown";
  if (state === Types.RequestLogic.STATE.CANCELED) return "canceled";

  if (balance?.eq(expectedAmount)) return "paid";
  if (balance?.gt(expectedAmount)) return "overpaid";
  if (pending) return "pending";
  if (receivableMinted === false) return "receivablePending";
  if (receivableStatusRequiresChainSwitch) return "receivableUnknown";
  return "open";
};

/** Transforms a request to a more friendly format */
export const parseRequest = async ({
  requestId,
  data,
  network,
  pending,
  currencyManager,
  provider,
}: {
  requestId: string;
  data: Types.IRequestData;
  network: string;
  pending: boolean;
  currencyManager: ICurrencyManager;
  provider: providers.Web3Provider;
}): Promise<IParsedRequest> => {
  const currency = currencyManager.fromStorageCurrency(data.currencyInfo);
  if (!currency) {
    throw new Error("Currency not found");
  }
  if (currency.type === Types.RequestLogic.CURRENCY.ISO4217) {
    throw new Error("Unsupported currency");
  }
  const { decimals } = currency;
  const amount = Number(utils.formatUnits(data.expectedAmount, decimals));

  let balance = 0;
  if (data.balance?.balance !== null && data.balance?.balance !== undefined) {
    balance = Number(utils.formatUnits(data.balance.balance, decimals));
  }

  const paymentNetwork = Object.values(data.extensions).find(
    (x) => x.type === "payment-network"
  )?.id;

  let receivableMinted;
  let receivableStatusRequiresChainSwitch = false;
  if (
    paymentNetwork ===
    ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE
  ) {
    let currencyChainId =
      "network" in currency ? chainInfos[currency.network].chainId : null;
    if (
      currencyChainId &&
      provider &&
      currencyChainId === provider.network.chainId
    ) {
      receivableMinted = await fetchReceivableMinted(data, provider);
    } else if (currencyChainId === 137) {
      // Temp fix for polygon
      const networkProvider = await ethers.providers.getDefaultProvider(
        currencyChainId,
        { alchemy: "7sBhlIVEpfCG9R-XOzBFiU1O-dMXMLDC" }
      );
      receivableMinted = await fetchReceivableMinted(data, networkProvider);
    } else if (currencyChainId === 5) {
      // Temp fix for goerli
      const networkProvider = await ethers.providers.getDefaultProvider(
        currencyChainId
      );
      receivableMinted = await fetchReceivableMinted(data, networkProvider);
    } else {
      receivableStatusRequiresChainSwitch = true;
    }
  }

  const status = getStatus(
    data.state,
    BigNumber.from(data.expectedAmount),
    data.balance?.balance ? BigNumber.from(data.balance.balance) : undefined,
    pending,
    receivableMinted,
    receivableStatusRequiresChainSwitch
  );

  const paidTimestamp = data.balance?.events.reverse()[0]?.timestamp;
  const canceledTimestamp = data.events.find(
    (x) => x.name === Types.RequestLogic.ACTION_NAME.CANCEL
  )?.timestamp;

  const extensionsValues = Object.values(data.extensions).find(
    (x) => x.type === "payment-network"
  )?.values;

  const paymentParams = data.balance?.events?.[0]?.parameters;

  return {
    requestId,
    amount,
    balance,
    currency,
    status,
    createdDate: new Date(data.timestamp * 1000),
    paidDate: paidTimestamp ? new Date(paidTimestamp * 1000) : undefined,
    canceledDate: canceledTimestamp
      ? new Date(canceledTimestamp * 1000)
      : undefined,
    paymentAddress: extensionsValues?.paymentAddress,
    paymentTxHash: paymentParams?.txHash,
    paymentFrom: paymentParams?.from,
    reason: data.contentData?.reason,
    invoiceNumber: data.contentData?.invoiceNumber,
    currencyType: data.currencyInfo.type,
    currencySymbol: currency.symbol,
    currencyNetwork: "network" in currency ? currency.network : "",
    txHash: data.balance?.events[0]?.parameters?.txHash,
    payee: data.payee?.value?.toLowerCase() || "",
    payer: data.payer?.value?.toLowerCase() || undefined,
    raw: data,
    network,
    receivableMinted,
    paymentNetwork,
  };
};
