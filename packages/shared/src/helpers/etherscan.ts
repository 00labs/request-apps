import { ClientTypes } from "@frinkly/types";
import { IParsedRequest } from "../";

const etherscanDomain: Record<string, string> = {
  goerli: "https://goerli.etherscan.io",
  mainnet: "https://etherscan.io",
  matic: "https://polygonscan.com",
};

export const getEtherscanUrl = (
  request?: ClientTypes.IRequestData | IParsedRequest
) => {
  if (!request) {
    return "";
  }
  if ("currencyInfo" in request) {
    return request?.currencyInfo?.network
      ? etherscanDomain[request.currencyInfo.network]
      : "";
  }
  return request.currencyNetwork
    ? etherscanDomain[request.currencyNetwork]
    : "";
};
