import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CloseIcon from '@mui/icons-material/Close';

export default function DescriptionModal({
  open,
  onClose,
  title = 'Request Details',
  description,
  rejectionReason,
  descriptionEmptyMessage = 'No description available.',
  rejectionReasonEmptyMessage = 'No rejection reason available.'
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          {title}
        </Typography>

        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close request details modal"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
            >
              Description
            </Typography>

            <Typography
              variant="body1"
              color={
                description
                  ? 'text.primary'
                  : 'text.secondary'
              }
              sx={{
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                lineHeight: 1.7
              }}
            >
              {description || descriptionEmptyMessage}
            </Typography>
          </Stack>

          {rejectionReason &&
            <>
              <Divider />

              <Stack spacing={1}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                >
                  Rejection Reason
                </Typography>

                <Typography
                  variant="body1"
                  color={
                    rejectionReason
                      ? 'text.primary'
                      : 'text.secondary'
                  }
                  sx={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    lineHeight: 1.7
                  }}
                >
                  {rejectionReason || rejectionReasonEmptyMessage}
                </Typography>
              </Stack>
            </>
          }
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DescriptionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  rejectionReason: PropTypes.string,
  descriptionEmptyMessage: PropTypes.string,
  rejectionReasonEmptyMessage: PropTypes.string
};
