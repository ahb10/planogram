import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import CloseIcon from '@mui/icons-material/Close';

const formatFieldValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function ActivityDetailDialog({
  open,
  onClose,
  loading,
  detail
}) {
  const fields = Array.isArray(detail?.fields)
    ? detail.fields
    : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Typography variant="h4">
          Activity Detail
        </Typography>

        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close activity detail"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ minHeight: 260 }}>
        {loading ? (
          <Box
            sx={{
              minHeight: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CircularProgress />
          </Box>
        ) : detail ? (
          <Stack spacing={3}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))'
                },
                gap: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Entity
                </Typography>

                <Typography variant="body1" fontWeight={600}>
                  {detail?.model_name || '-'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Object ID
                </Typography>

                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ overflowWrap: 'anywhere' }}
                >
                  {detail?.object_id || '-'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Activity Performed By
                </Typography>

                <Typography variant="body1" fontWeight={600}>
                  {detail?.changed_by_name || '-'}
                </Typography>

                {detail?.changed_by_email && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ overflowWrap: 'anywhere' }}
                  >
                    {detail.changed_by_email}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Date & Time
                </Typography>

                <Typography variant="body1" fontWeight={600}>
                  {formatDateTime(detail?.changed_at)}
                </Typography>
              </Box>

              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <Typography variant="caption" color="text.secondary">
                  Summary
                </Typography>

                <Typography variant="body1" fontWeight={600}>
                  {detail?.summary || '-'}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="h5" sx={{ mb: 1.5 }}>
                Changed Fields
              </Typography>

              <TableContainer
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  maxHeight: 420
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 160 }}>
                        Field
                      </TableCell>

                      <TableCell sx={{ minWidth: 220 }}>
                        Old Value
                      </TableCell>

                      <TableCell sx={{ minWidth: 220 }}>
                        New Value
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {fields.length > 0 ? (
                      fields.map((field, index) => (
                        <TableRow
                          key={`${field?.field_name || 'field'}-${index}`}
                          hover
                        >
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              verticalAlign: 'top'
                            }}
                          >
                            {field?.field_name || '-'}
                          </TableCell>

                          <TableCell
                            sx={{
                              verticalAlign: 'top',
                              whiteSpace: 'normal',
                              overflowWrap: 'anywhere'
                            }}
                          >
                            {formatFieldValue(field?.old_value)}
                          </TableCell>

                          <TableCell
                            sx={{
                              verticalAlign: 'top',
                              whiteSpace: 'normal',
                              overflowWrap: 'anywhere'
                            }}
                          >
                            {formatFieldValue(field?.new_value)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No changed fields found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        ) : (
          <Box
            sx={{
              minHeight: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography color="text.secondary">
              Activity detail is not available.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ActivityDetailDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  detail: PropTypes.shape({
    model_name: PropTypes.string,
    object_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    changed_by_name: PropTypes.string,
    changed_by_email: PropTypes.string,
    changed_at: PropTypes.string,
    summary: PropTypes.string,
    fields: PropTypes.arrayOf(
      PropTypes.shape({
        field_name: PropTypes.string,
        old_value: PropTypes.any,
        new_value: PropTypes.any
      })
    )
  })
};

ActivityDetailDialog.defaultProps = {
  loading: false,
  detail: null
};