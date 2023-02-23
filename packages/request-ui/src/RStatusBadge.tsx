import React from 'react';
import { makeStyles, Theme, Box, Typography } from '@material-ui/core';

import { colors, statusColors } from './colors';
import { RequestStatus } from 'request-shared';
import { CurrencyDefinition } from '@requestnetwork/currency';

interface IProps {
  status: RequestStatus;
  currency?: CurrencyDefinition;
  className?: string;
}

const useStyles = makeStyles<Theme, IProps>({
  status: {
    borderRadius: 3,
    padding: '8px 24px',
    backgroundColor: ({ status }) => statusColors[status],
    color: colors.statusText,
  },
});

export const statusLabels: Record<RequestStatus, string> = {
  open: 'Awaiting Payment',
  paid: 'Paid',
  pending: 'Pending',
  canceled: 'Canceled',
  overpaid: 'Overpaid',
  unknown: 'Unknown',
  receivablePending: 'Awaiting Request Mint',
  receivableUnknown: 'Switch Networks to See Status',
};

export const RStatusBadge = (props: IProps) => {
  const classes = useStyles(props);

  let statusLabel = statusLabels[props.status];
  if (
    props.status === 'receivableUnknown' &&
    props.currency &&
    'network' in props.currency
  ) {
    statusLabel = `Switch to ${props.currency.network} to See Status`;
  }

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      position="relative"
    >
      <div
        className={[classes.status, props.className].join(' ')}
        title={
          props.status === 'unknown'
            ? 'The balance computation might have failed'
            : ''
        }
      >
        <Typography variant="h6">{statusLabel}</Typography>
      </div>
    </Box>
  );
};
