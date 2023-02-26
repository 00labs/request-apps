import { providers } from "ethers";
import { hasReceivableForRequest } from "@frinkly/payment-processor";
import { IRequestData } from "@frinkly/types/dist/client-types";

export const fetchReceivableMinted = async (
  request: IRequestData,
  provider: providers.Provider
): Promise<boolean> => {
  const win = window as any;

  if (!win.ethereum) {
    throw new Error("ethereum not detected");
  }

  return await hasReceivableForRequest(request, provider);
};
