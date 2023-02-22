import { useWeb3React } from '@web3-react/core';
import { RButton } from './RButton';
import React from 'react';
import {
  addEthereumChain,
  chainInfos,
  IParsedRequest,
  useRequest,
} from 'request-shared';
import { RAlert } from './RAlert';
import { mintErc20TransferableReceivable } from '@requestnetwork/payment-processor';
import { Typography } from '@material-ui/core';
import { Spacer } from './Spacer';
import { ExtensionTypes } from '@requestnetwork/types';

interface IProps {
  request: IParsedRequest;
}

export const MintReceivable = (props: IProps) => {
  const { account, chainId, library } = useWeb3React();
  const { update } = useRequest();

  const { request } = props;

  if (
    (request.status !== 'receivablePending' &&
      request.status !== 'receivableUnknown') ||
    request.paymentNetwork !==
      ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE
  ) {
    return null;
  }

  let isPayee = account?.toLowerCase() === request.payee.toLowerCase();

  const chainIdOfCurrency = chainInfos[request.currencyNetwork]?.chainId;
  if (chainId !== chainIdOfCurrency && isPayee) {
    return (
      <>
        <RAlert
          severity="error"
          message={'You must mint the receivable in order to receive payments.'}
          actions={
            isPayee ? (
              <RButton
                color="default"
                onClick={async () => {
                  await addEthereumChain(chainIdOfCurrency, library);
                }}
              >
                <Typography variant="h4">
                  Switch to {request.currencyNetwork}
                </Typography>
              </RButton>
            ) : undefined
          }
        />
        <Spacer size={12} />
      </>
    );
  }

  return (
    <>
      <RAlert
        severity="error"
        message={
          isPayee
            ? 'You must mint the receivable in order to receive payments.'
            : 'This request cannot be paid until the payee mints the receivable.'
        }
        actions={
          isPayee ? (
            <RButton
              color="default"
              onClick={async () => {
                const mintTx = await mintErc20TransferableReceivable(
                  request.raw,
                  library
                );
                await mintTx.wait(1);
                await update();
              }}
            >
              <Typography variant="h4">Mint Receivable</Typography>
            </RButton>
          ) : undefined
        }
      />
      <Spacer size={12} />
    </>
  );
};
