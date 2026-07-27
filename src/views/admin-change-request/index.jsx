import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import { Formik } from 'formik';
import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

import MainCard from 'ui-component/cards/MainCard';
import ServerTable from 'ui-component/tables/server-side-custom-table';

import useAxios from '../../api/useAxios';
import { formatDate } from 'utils/helper-function';

import requestStatusSchema, {
  REQUEST_STATUS_OPTIONS
} from './requestStatusSchema';
import RecordDetailItem from './component/RecordDetailItem';

const getApiErrorMessage = (error) => {
  const responseData = error?.response?.data;

  const firstFieldError =
    responseData?.errors &&
      typeof responseData.errors === 'object'
      ? Object.values(responseData.errors)
        .flat()
        .find(Boolean)
      : null;

  return (
    responseData?.message ||
    firstFieldError ||
    responseData?.detail ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
};

const getStatusColor = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'approved':
      return 'success';

    case 'rejected':
      return 'error';

    case 'pending':
      return 'warning';

    default:
      return 'default';
  }
};

const getRequestStatus = (requestStatus) => {
  return (
    REQUEST_STATUS_OPTIONS.find(
      (statusOption) =>
        statusOption.toLowerCase() ===
        String(requestStatus || '').toLowerCase()
    ) || 'Pending'
  );
};

const AdminChangeRequest = () => {
  const api = useAxios();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] =
    useState(10);
  const [search, setSearch] = useState('');

  const [editOpen, setEditOpen] =
    useState(false);
  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [
    selectedRequest,
    setSelectedRequest
  ] = useState(null);

  const [recordDetailOpen, setRecordDetailOpen] =
    useState(false);

  const [recordDetail, setRecordDetail] =
    useState(null);

  const showApiError = useCallback(
    (error) => {
      enqueueSnackbar(
        getApiErrorMessage(error),
        {
          variant: 'error',
          preventDuplicate: true
        }
      );
    },
    [enqueueSnackbar]
  );

  const handleOpenEdit = useCallback(
    (request) => {
      setSelectedRequest(request);
      setEditOpen(true);
    },
    []
  );

  const handleCloseEdit = useCallback(() => {
    setEditOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleOpenDelete = useCallback(
    (request) => {
      setSelectedRequest(request);
      setDeleteOpen(true);
    },
    []
  );

  const handleCloseDelete = useCallback(() => {
    setDeleteOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleTableSearchChange = useCallback(
    (value) => {
      const normalizedValue = String(
        value || ''
      ).trim();

      setSearch((previousSearch) => {
        if (
          previousSearch === normalizedValue
        ) {
          return previousSearch;
        }

        setPage(0);

        return normalizedValue;
      });
    },
    []
  );

  const handleTablePageChange = useCallback(
    (newPage) => {
      setPage(newPage);
    },
    []
  );

  const handleRowsPerPageChange = useCallback(
    (newRowsPerPage) => {
      setRowsPerPage(newRowsPerPage);
      setPage(0);
    },
    []
  );

  const {
    data: requestData,
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery({
    queryKey: [
      'admin-change-request-list',
      page,
      rowsPerPage,
      search
    ],

    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/request-list',
        {
          params: {
            page: page + 1,
            size: rowsPerPage,
            ...(search && { search })
          }
        }
      );

      return response.data;
    },

    placeholderData: (previousData) =>
      previousData
  });

  const requests = useMemo(() => {
    return Array.isArray(
      requestData?.results
    )
      ? requestData.results
      : [];
  }, [requestData]);

  const totalRequests = Number(
    requestData?.count || 0
  );

  const statusInitialValues = useMemo(() => {
    const currentStatus = getRequestStatus(
      selectedRequest?.status
    );

    return {
      status: currentStatus,

      rejection_reason:
        currentStatus === 'Rejected'
          ? selectedRequest?.rejection_reason ||
          ''
          : ''
    };
  }, [selectedRequest]);

  useEffect(() => {
    const totalPages = Number(
      requestData?.total_pages || 0
    );

    if (
      totalPages > 0 &&
      page >= totalPages
    ) {
      setPage(
        Math.max(totalPages - 1, 0)
      );
    }
  }, [requestData?.total_pages, page]);

  const recordDetailMutation = useMutation({
    mutationFn: async (recordId) => {
      const response = await api.get(
        `/api/inventory/record-detail/${recordId}`
      );

      return response.data;
    },

    onSuccess: (responseData) => {
      setRecordDetail(responseData?.data || null);
      setRecordDetailOpen(true);
    },

    onError: showApiError
  });

  const handleOpenRecordDetail = useCallback(
    (request) => {
      const recordId =
        request?.display_record_id ??
        (
          typeof request?.display_record === 'object'
            ? request?.display_record?.id
            : request?.display_record
        );

      if (!recordId) {
        enqueueSnackbar(
          'Display record ID is not available.',
          {
            variant: 'error',
            preventDuplicate: true
          }
        );

        return;
      }

      setRecordDetail(null);
      recordDetailMutation.mutate(recordId);
    },
    [recordDetailMutation, enqueueSnackbar]
  );

  const handleCloseRecordDetail = useCallback(() => {
    if (recordDetailMutation.isPending) {
      return;
    }

    setRecordDetailOpen(false);
    setRecordDetail(null);
  }, [recordDetailMutation.isPending]);

  const updateRequestMutation = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData();

      formData.append(
        'status',
        values.status
      );

      formData.append(
        'rejection_reason',
        values.status === 'Rejected'
          ? values.rejection_reason.trim()
          : ''
      );

      const response = await api.patch(
        `/api/inventory/update-request/${selectedRequest?.id}`,
        formData
      );

      return response.data;
    },

    onSuccess: (responseData) => {
      queryClient.invalidateQueries({
        queryKey: [
          'admin-change-request-list'
        ]
      });

      queryClient.invalidateQueries({
        queryKey: ['change-request-list']
      });

      enqueueSnackbar(
        responseData?.message ||
        'Request status updated successfully.',
        {
          variant: 'success',
          preventDuplicate: true
        }
      );

      handleCloseEdit();
    },

    onError: showApiError
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      const response = await api.delete(
        `/api/inventory/update-request/${requestId}`
      );

      return response.data;
    },

    onSuccess: (responseData) => {
      queryClient.invalidateQueries({
        queryKey: [
          'admin-change-request-list'
        ]
      });

      queryClient.invalidateQueries({
        queryKey: ['change-request-list']
      });

      enqueueSnackbar(
        responseData?.message ||
        'Request deleted successfully.',
        {
          variant: 'success',
          preventDuplicate: true
        }
      );

      handleCloseDelete();
    },

    onError: showApiError
  });

  const handleDeleteConfirm = () => {
    if (!selectedRequest?.id) {
      return;
    }

    deleteRequestMutation.mutate(
      selectedRequest.id
    );
  };

  const requestColumns = useMemo(
    () => [
      {
        id: 'request_id',
        label: 'Request ID',
        minWidth: 130,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (request) => (
          <Button
            variant="text"
            size="small"
            onClick={() =>
              handleOpenRecordDetail(request)
            }
            disabled={
              recordDetailMutation.isPending
            }
            sx={{
              minWidth: 'auto',
              p: 0,
              textTransform: 'none',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            {request?.request_id || '-'}
          </Button>
        )
      },
      {
        id: 'user_name',
        label: 'Requested By',
        minWidth: 150,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (request) =>
          request?.user_name || '-'
      },
      {
        id: 'display_record',
        label: 'Display Record',
        minWidth: 130,
        align: 'center',
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (request) =>
          request?.display_record || '-'
      },
      {
        id: 'store_name',
        label: 'Store',
        minWidth: 170,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (request) =>
          request?.store_name || '-'
      },
      {
        id: 'description',
        label: 'Description',
        minWidth: 320,
        width: 320,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          minWidth: 320,
          width: 320,
          whiteSpace: 'normal'
        },
        render: (request) => (
          <Typography
            variant="body2"
            title={
              request?.description || ''
            }
            sx={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              lineHeight: 1.5,
              whiteSpace: 'normal',
              overflowWrap: 'break-word'
            }}
          >
            {request?.description || '-'}
          </Typography>
        )
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 110,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (request) => (
          <Chip
            size="small"
            label={
              request?.status || 'Pending'
            }
            color={getStatusColor(
              request?.status
            )}
            variant="outlined"
          />
        )
      },
      {
        id: 'created_at',
        label: 'Created At',
        minWidth: 140,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (request) =>
          request?.created_at
            ? formatDate(
              request.created_at
            )
            : '-'
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 110,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (request) => (
          <>
            <IconButton
              size="small"
              color="primary"
              onClick={() =>
                handleOpenEdit(request)
              }
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() =>
                handleOpenDelete(request)
              }
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )
      }
    ],
    [
      handleOpenEdit,
      handleOpenDelete
    ]
  );

  useEffect(() => {
    if (isError && error) {
      showApiError(error);
    }
  }, [
    isError,
    error,
    showApiError
  ]);

  return (
    <>
      <MainCard title="Change Requests">
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Review, approve, reject, or
            delete user change requests.
          </Typography>

          <ServerTable
            columns={requestColumns}
            rows={requests}
            getRowId={(request) =>
              request.id
            }
            loading={
              isLoading || isFetching
            }
            error={null}
            emptyMessage="No change requests found."
            searchValue={search}
            searchPlaceholder="Search requests..."
            onSearchChange={
              handleTableSearchChange
            }
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[
              10,
              25,
              50,
              100
            ]}
            totalCount={totalRequests}
            onPageChange={
              handleTablePageChange
            }
            onRowsPerPageChange={
              handleRowsPerPageChange
            }
          />
        </Stack>
      </MainCard>

      <Dialog
        open={editOpen}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Request Status
        </DialogTitle>

        <Formik
          initialValues={
            statusInitialValues
          }
          enableReinitialize
          validationSchema={
            requestStatusSchema
          }
          onSubmit={(values) => {
            if (!selectedRequest?.id) {
              return;
            }

            updateRequestMutation.mutate(
              values
            );
          }}
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            handleSubmit,
            setFieldValue,
            setFieldTouched
          }) => (
            <form
              id="update-request-status-form"
              onSubmit={handleSubmit}
            >
              <DialogContent>
                <Stack
                  spacing={2}
                  sx={{ mt: 1 }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Request ID:{' '}
                    <strong>
                      {selectedRequest?.request_id ||
                        '-'}
                    </strong>
                  </Typography>

                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.status &&
                      errors.status
                    )}
                  >
                    <InputLabel id="request-status-label">
                      Status
                    </InputLabel>

                    <Select
                      labelId="request-status-label"
                      id="request-status"
                      name="status"
                      value={values.status}
                      label="Status"
                      onBlur={handleBlur}
                      onChange={(event) => {
                        const nextStatus =
                          event.target.value;

                        setFieldValue(
                          'status',
                          nextStatus
                        );

                        if (
                          nextStatus !==
                          'Rejected'
                        ) {
                          setFieldValue(
                            'rejection_reason',
                            '',
                            false
                          );

                          setFieldTouched(
                            'rejection_reason',
                            false,
                            false
                          );
                        }
                      }}
                    >
                      {REQUEST_STATUS_OPTIONS.map(
                        (statusOption) => (
                          <MenuItem
                            key={statusOption}
                            value={statusOption}
                          >
                            {statusOption}
                          </MenuItem>
                        )
                      )}
                    </Select>

                    {touched.status &&
                      errors.status && (
                        <FormHelperText>
                          {errors.status}
                        </FormHelperText>
                      )}
                  </FormControl>

                  {values.status ===
                    'Rejected' && (
                      <TextField
                        id="request-rejection-reason"
                        name="rejection_reason"
                        label="Rejection Reason"
                        placeholder="Enter the reason for rejecting this request"
                        value={
                          values.rejection_reason
                        }
                        onChange={(event) =>
                          setFieldValue(
                            'rejection_reason',
                            event.target.value
                          )
                        }
                        onBlur={handleBlur}
                        multiline
                        minRows={4}
                        fullWidth
                        required
                        error={Boolean(
                          touched.rejection_reason &&
                          errors.rejection_reason
                        )}
                        helperText={
                          touched.rejection_reason &&
                            errors.rejection_reason
                            ? errors.rejection_reason
                            : ''
                        }
                      />
                    )}
                </Stack>
              </DialogContent>

              <DialogActions
                sx={{ px: 3, pb: 2 }}
              >
                <Button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={
                    updateRequestMutation.isPending
                  }
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  type="submit"
                  disabled={
                    updateRequestMutation.isPending
                  }
                >
                  {updateRequestMutation.isPending
                    ? 'Updating...'
                    : 'Update Status'}
                </Button>
              </DialogActions>
            </form>
          )}
        </Formik>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={handleCloseDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Delete Change Request
        </DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to
            delete request{' '}
            <strong>
              {selectedRequest?.request_id ||
                'this request'}
            </strong>
            ?
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{ px: 3, pb: 2 }}
        >
          <Button
            onClick={handleCloseDelete}
            disabled={
              deleteRequestMutation.isPending
            }
          >
            No
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={
              deleteRequestMutation.isPending
            }
          >
            {deleteRequestMutation.isPending
              ? 'Deleting...'
              : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* detail dialog */}

      {recordDetail &&
        <Dialog
          open={recordDetailOpen}
          onClose={handleCloseRecordDetail}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Display Record Details for ID: {recordDetail?.id}
          </DialogTitle>

          <DialogContent>
            {recordDetailMutation.isPending ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={2}
                sx={{ py: 6 }}
              >
                <CircularProgress size={32} />

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Loading display record...
                </Typography>
              </Stack>
            ) : recordDetail ? (
              <Box
                sx={{
                  mt: 1,
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))'
                  },
                  gap: 2
                }}
              >

                <RecordDetailItem
                  label="Region"
                  value={recordDetail?.region_name}
                />

                <RecordDetailItem
                  label="Store"
                  value={recordDetail?.store_name}
                />

                <RecordDetailItem
                  label="Store Code"
                  value={recordDetail?.store_code}
                />

                <RecordDetailItem
                  label="Branch Code"
                  value={recordDetail?.branch_code}
                />

                <RecordDetailItem
                  label="Table Type"
                  value={recordDetail?.table_type_name}
                />

                <RecordDetailItem
                  label="Table Number"
                  value={recordDetail?.table_number}
                />

                <RecordDetailItem
                  label="Product"
                  value={recordDetail?.product_name}
                />

                <RecordDetailItem
                  label="Product SKU"
                  value={recordDetail?.product_sku}
                />

                <RecordDetailItem
                  label="Security Type"
                  value={recordDetail?.security_type_name}
                />

                <RecordDetailItem
                  label="Quantity"
                  value={recordDetail?.quantity}
                />

                <RecordDetailItem
                  label="Keyboard"
                  value={recordDetail?.keyboard}
                />

                <RecordDetailItem
                  label="Pen"
                  value={recordDetail?.pen}
                />

                <RecordDetailItem
                  label="Created At"
                  value={
                    recordDetail.created_at
                      ? formatDate(recordDetail?.created_at)
                      : '-'
                  }
                />
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 3 }}
              >
                Display record details are not available.
              </Typography>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCloseRecordDetail}
              disabled={recordDetailMutation.isPending}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>}
    </>
  );
};

export default AdminChangeRequest;