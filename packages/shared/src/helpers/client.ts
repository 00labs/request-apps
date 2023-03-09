//@ts-nocheck
import { CurrencyDefinition } from "@frinkly/currency";
import { RequestNetwork, Types } from "@frinkly/request-client.js";
import { useCurrency } from "../contexts/CurrencyContext";

export const useRequestClient = (
  network: string,
  signatureProvider?: Types.SignatureProvider.ISignatureProvider
) => {
  const { currencyList } = useCurrency();
  return getRequestClient(network, signatureProvider, currencyList);
};

const getBaseUrl = (networkName) => {
  // if (networkName === "goerli") {
  //   return `https://${networkName}.v2.rn.huma.finance/`;
  // }
  return `https://${networkName}.gateway.request.network/`;
};

export const getRequestClient = (
  network: string,
  signatureProvider?: Types.SignatureProvider.ISignatureProvider,
  currencyList?: CurrencyDefinition[]
) => {
  // Mapped from chainIdToName.ts
  const networkMap = {
    mainnet: "xdai",
    matic: "xdai",
    goerli: "goerli",
  };
  const networkName = networkMap[network] ?? network;
  const requestNetwork = new RequestNetwork({
    nodeConnectionConfig: {
      baseURL: getBaseUrl(networkName),
      // baseURL: `https://${networkName}.gateway.request.network/`,
      // baseURL: `https://${networkName}.v2.rn.huma.finance/`,
      // baseURL: `http://localhost:3000`,
    },
    signatureProvider,
    currencies: currencyList,
  });

  return requestNetwork;
};
