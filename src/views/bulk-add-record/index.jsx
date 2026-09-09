import { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import { useSnackbar } from 'notistack';

import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';

import MainCard from 'ui-component/cards/MainCard';
import useAxios from '../../api/useAxios';
import sampleImportUrl from '../../public/sample_import.xlsx?url';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

const ACCEPTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const STATUS_COLORS = {
  created: 'success',
  skipped: 'warning',
  failed: 'error'
};

const formatFileSize = (bytes) => {
  if (!bytes) {
    return '0 KB';
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getFileExtension = (fileName) => {
  const lastDot = String(fileName ?? '').lastIndexOf('.');

  return lastDot === -1
    ? ''
    : String(fileName).slice(lastDot).toLowerCase();
};

const hasAcceptedExtension = (file) =>
  ACCEPTED_EXTENSIONS.includes(getFileExtension(file?.name));

// Browsers report an empty or generic MIME type for some spreadsheets,
// so the extension stays the primary check and MIME only rejects a
// clearly mismatched type.
const hasAcceptedMimeType = (file) => {
  const type = String(file?.type ?? '').toLowerCase();

  if (!type || type === 'application/octet-stream') {
    return true;
  }

  return ACCEPTED_MIME_TYPES.includes(type);
};

const isAcceptedFile = (file) =>
  hasAcceptedExtension(file) && hasAcceptedMimeType(file);

const createFileId = (file) =>
  `${file.name}-${file.size}-${file.lastModified}`;

export default function BulkAddRecordPage() {
  const api = useAxios();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const inputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importResults, setImportResults] = useState([]);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');

  const showApiError = useCallback(
    (error, fallbackMessage = 'Something went wrong.') => {
      const data = error?.response?.data;

      const message =
        data?.message ||
        data?.detail ||
        data?.error ||
        error?.message ||
        fallbackMessage;

      enqueueSnackbar(message, { variant: 'error' });
    },
    [enqueueSnackbar]
  );

  const addFiles = useCallback(
    (incomingFiles) => {
      const selected = Array.from(incomingFiles || []);

      if (!selected.length) {
        return;
      }

      const accepted = [];
      const invalidType = [];
      const emptyFiles = [];
      const oversized = [];

      selected.forEach((file) => {
        if (!isAcceptedFile(file)) {
          invalidType.push(file.name);
          return;
        }

        if (!file.size) {
          emptyFiles.push(file.name);
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          oversized.push(file.name);
          return;
        }

        accepted.push(file);
      });

      if (invalidType.length) {
        enqueueSnackbar(
          `Unsupported file type: ${invalidType.join(', ')}. Allowed: ${ACCEPTED_EXTENSIONS.join(', ')}`,
          { variant: 'error' }
        );
      }

      if (emptyFiles.length) {
        enqueueSnackbar(
          `File is empty: ${emptyFiles.join(', ')}`,
          { variant: 'error' }
        );
      }

      if (oversized.length) {
        enqueueSnackbar(
          `File too large (max 10 MB): ${oversized.join(', ')}`,
          { variant: 'error' }
        );
      }

      if (!accepted.length) {
        return;
      }

      setFiles((previousFiles) => {
        const existingIds = new Set(
          previousFiles.map((file) => createFileId(file))
        );

        const duplicates = [];
        const newFiles = [];

        accepted.forEach((file) => {
          const fileId = createFileId(file);

          if (existingIds.has(fileId)) {
            duplicates.push(file.name);
            return;
          }

          existingIds.add(fileId);
          newFiles.push(file);
        });

        if (duplicates.length) {
          enqueueSnackbar(
            `Duplicate file skipped: ${duplicates.join(', ')}`,
            { variant: 'warning' }
          );
        }

        return [...previousFiles, ...newFiles];
      });
    },
    [enqueueSnackbar]
  );

  const handleFileInputChange = (event) => {
    addFiles(event.target.files);

    // Allow re-selecting the same file after removing it.
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    addFiles(event.dataTransfer?.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = (fileId) => {
    setFiles((previousFiles) =>
      previousFiles.filter(
        (file) => createFileId(file) !== fileId
      )
    );
  };

  const handleResultsClose = () => {
    setResultsOpen(false);
  };

  const importMutation = useMutation({
    mutationFn: async (filesToImport) => {
      const collected = [];

      for (const file of filesToImport) {
        setCurrentFileName(file.name);

        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await api.post(
            '/api/inventory/bulk-import-excel',
            formData
          );

          collected.push({
            fileName: file.name,
            data: response.data
          });
        } catch (error) {
          collected.push({
            fileName: file.name,
            error:
              error?.response?.data?.message ||
              error?.response?.data?.detail ||
              error?.message ||
              'Upload failed.'
          });
        }
      }

      return collected;
    },
    onSuccess: (collected) => {
      setImportResults(collected);
      setResultsOpen(true);
      setCurrentFileName('');
      setFiles([]);

      queryClient.invalidateQueries({
        queryKey: ['display-record-list']
      });

      const totals = collected.reduce(
        (accumulator, item) => {
          const summary = item?.data?.summary;

          return {
            created:
              accumulator.created + Number(summary?.created || 0),
            skipped:
              accumulator.skipped + Number(summary?.skipped || 0),
            failed:
              accumulator.failed +
              Number(summary?.failed || 0) +
              (item?.error ? 1 : 0)
          };
        },
        { created: 0, skipped: 0, failed: 0 }
      );

      enqueueSnackbar(
        `Import finished — ${totals.created} created, ${totals.skipped} skipped, ${totals.failed} failed.`,
        {
          variant: totals.failed > 0 ? 'warning' : 'success'
        }
      );
    },
    onError: (error) => {
      setCurrentFileName('');
      showApiError(error, 'Import failed.');
    }
  });

  const handleImport = () => {
    if (!files.length) {
      return;
    }

    setImportResults([]);
    importMutation.mutate(files);
  };

  const isImporting = importMutation.isPending;

  const overallSummary = useMemo(() => {
    if (!importResults.length) {
      return null;
    }

    return importResults.reduce(
      (accumulator, item) => {
        const summary = item?.data?.summary;

        return {
          total_rows:
            accumulator.total_rows + Number(summary?.total_rows || 0),
          created:
            accumulator.created + Number(summary?.created || 0),
          skipped:
            accumulator.skipped + Number(summary?.skipped || 0),
          failed:
            accumulator.failed + Number(summary?.failed || 0)
        };
      },
      { total_rows: 0, created: 0, skipped: 0, failed: 0 }
    );
  }, [importResults]);

  return (
    <>
      <MainCard
        title="Bulk Add Record"
        secondary={
          <Button
            component="a"
            href={sampleImportUrl}
            download="sample_import.xlsx"
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
          >
            Download Template
          </Button>
        }
      >
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            Upload one or more Excel/CSV files to create display records in
            bulk. Use the template to match the expected columns.
          </Typography>

          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'divider',
              borderRadius: 2,
              bgcolor: isDragging ? 'primary.lighter' : 'transparent',
              p: 5,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background-color 0.2s',
              '&:hover': {
                borderColor: 'primary.main'
              }
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              accept={ACCEPTED_EXTENSIONS.join(',')}
              onChange={handleFileInputChange}
            />

            <CloudUploadOutlinedIcon
              sx={{ fontSize: 48, color: 'primary.main', mb: 1 }}
            />

            <Typography variant="h4" gutterBottom>
              Drag &amp; drop files here
            </Typography>

            <Typography variant="body2" color="text.secondary">
              or click to browse — single or multiple files
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              Supported: {ACCEPTED_EXTENSIONS.join(', ')} (max 10 MB each)
            </Typography>
          </Box>

          {files.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="subtitle1">
                Selected files ({files.length})
              </Typography>

              {files.map((file) => {
                const fileId = createFileId(file);

                return (
                  <Stack
                    key={fileId}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      px: 2,
                      py: 1
                    }}
                  >
                    <InsertDriveFileOutlinedIcon
                      fontSize="small"
                      color="primary"
                    />

                    <Typography
                      variant="body2"
                      sx={{
                        flexGrow: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={file.name}
                    >
                      {file.name}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {formatFileSize(file.size)}
                    </Typography>

                    <Tooltip title="Remove">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={isImporting}
                          onClick={() => handleRemoveFile(fileId)}
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                );
              })}
            </Stack>
          )}

          {isImporting && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Uploading {currentFileName}...
              </Typography>

              <LinearProgress />
            </Stack>
          )}

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<CloudUploadOutlinedIcon />}
              disabled={!files.length || isImporting}
              onClick={handleImport}
            >
              {isImporting ? 'Importing...' : 'Import Files'}
            </Button>

            {files.length > 0 && (
              <Button
                color="inherit"
                disabled={isImporting}
                onClick={() => setFiles([])}
              >
                Clear
              </Button>
            )}

            {importResults.length > 0 && !isImporting && (
              <Button onClick={() => setResultsOpen(true)}>
                View Last Results
              </Button>
            )}
          </Stack>
        </Stack>
      </MainCard>

      <Dialog
        open={resultsOpen}
        onClose={handleResultsClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Import Results</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            {overallSummary && (
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Chip
                  label={`Total rows: ${overallSummary.total_rows}`}
                  variant="outlined"
                />
                <Chip
                  label={`Created: ${overallSummary.created}`}
                  color="success"
                />
                <Chip
                  label={`Skipped: ${overallSummary.skipped}`}
                  color="warning"
                />
                <Chip
                  label={`Failed: ${overallSummary.failed}`}
                  color="error"
                />
              </Stack>
            )}

            {importResults.map((item) => (
              <Stack key={item.fileName} spacing={1}>
                <Typography variant="subtitle1">
                  {item.fileName}
                </Typography>

                {item.error ? (
                  <Alert severity="error">{item.error}</Alert>
                ) : (
                  <TableContainer sx={{ maxHeight: 420 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Row</TableCell>
                          <TableCell>Store</TableCell>
                          <TableCell>Store Code</TableCell>
                          <TableCell>Product</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell>Table Type</TableCell>
                          <TableCell align="center">Table #</TableCell>
                          <TableCell>Security Type</TableCell>
                          <TableCell align="center">Qty</TableCell>
                          <TableCell>Keyboard</TableCell>
                          <TableCell>Pen</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Reason</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {(item?.data?.results || []).map(
                          (result, index) => (
                            <TableRow
                              key={`${item.fileName}-${result?.row ?? index}`}
                            >
                              <TableCell>{result?.row ?? '-'}</TableCell>

                              <TableCell>
                                {result?.details?.store || '-'}
                              </TableCell>

                              <TableCell>
                                {result?.store_code ||
                                  result?.details?.store_code ||
                                  '-'}
                              </TableCell>

                              <TableCell>
                                {result?.details?.product || '-'}
                              </TableCell>

                              <TableCell>
                                {result?.item_code ||
                                  result?.details?.sku ||
                                  '-'}
                              </TableCell>

                              <TableCell>
                                {result?.details?.table_type || '-'}
                              </TableCell>

                              <TableCell align="center">
                                {result?.details?.table_number ?? '-'}
                              </TableCell>

                              <TableCell>
                                {result?.details?.security_type || '-'}
                              </TableCell>

                              <TableCell align="center">
                                {result?.details?.quantity ?? '-'}
                              </TableCell>

                              <TableCell>
                                {result?.details?.keyboard || '-'}
                              </TableCell>

                              <TableCell>
                                {result?.details?.pen || '-'}
                              </TableCell>

                              <TableCell>
                                <Chip
                                  size="small"
                                  label={result?.status || 'unknown'}
                                  color={
                                    STATUS_COLORS[result?.status] ||
                                    'default'
                                  }
                                />
                              </TableCell>

                              <TableCell>
                                {result?.reason || '-'}
                              </TableCell>
                            </TableRow>
                          )
                        )}

                        {!(item?.data?.results || []).length && (
                          <TableRow>
                            <TableCell colSpan={13} align="center">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No row details returned.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Stack>
            ))}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={handleResultsClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
