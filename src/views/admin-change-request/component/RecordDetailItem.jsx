import { Box, Typography } from '@mui/material';
import React from 'react'

const RecordDetailItem = ({
  label,
  value
}) => {
  const displayValue =
    value === null ||
      value === undefined ||
      value === ''
      ? '-'
      : value;
  return (
    <Box
      sx={{
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mb: 0.5 }}
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={500}
        sx={{
          overflowWrap: 'anywhere'
        }}
      >
        {displayValue}
      </Typography>
    </Box>
  )
}

export default RecordDetailItem