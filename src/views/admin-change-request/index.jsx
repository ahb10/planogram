import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

import MainCard from 'ui-component/cards/MainCard';
import ServerTable from 'ui-component/tables/server-side-custom-table';

import useAxios from '../../api/useAxios';
import { formatDate } from 'utils/helper-function';

const STATUS_OPTIONS = ['Pending', 'Approved'];

const getApiErrorMessage = (error) => {
  const responseData = error?.response?.data?.errors?.name[0] || "Something went wrong. Please try again.";

  if (responseData) {
    return responseData.message;
  }

  return 'Something went wrong. Please try again.';
};

const getStatusColor = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'approved':
      return 'success';

    case 'pending':
      return 'warning';

    default:
      return 'default';
  }
};

const AdminChangeRequest = () => {
  const api = useAxios();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState(null);
  const [status, setStatus] = useState('Pending');

  const showApiError = useCallback(
    (error) => {
      enqueueSnackbar(getApiErrorMessage(error), {
        variant: 'error',
        preventDuplicate: true
      });
    },
    [enqueueSnackbar]
  );

  const handleOpenEdit = useCallback((request) => {
    setSelectedRequest(request);

    const currentStatus = STATUS_OPTIONS.includes(
      request?.status
    )
      ? request.status
      : 'Pending';

    setStatus(currentStatus);
    setEditOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditOpen(false);
    setSelectedRequest(null);
    setStatus('Pending');
  }, []);

  const handleOpenDelete = useCallback((request) => {
    setSelectedRequest(request);
    setDeleteOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleTableSearchChange = useCallback((value) => {
    const normalizedValue = String(value || '').trim();

    setSearch((previousSearch) => {
      if (previousSearch === normalizedValue) {
        return previousSearch;
      }

      setPage(0);
      return normalizedValue;
    });
  }, []);

  const handleTablePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

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
    placeholderData: (previousData) => previousData
  });

  const requests = useMemo(() => {
    return Array.isArray(requestData?.results)
      ? requestData.results
      : [];
  }, [requestData]);

  const totalRequests = Number(requestData?.count || 0);

  useEffect(() => {
    const totalPages = Number(
      requestData?.total_pages || 0
    );

    if (totalPages > 0 && page >= totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [requestData?.total_pages, page]);

  const updateRequestMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();

      formData.append('status', status);

      const response = await api.patch(
        `/api/inventory/update-request/${selectedRequest?.id}`,
        formData
      );

      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-change-request-list']
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
        queryKey: ['admin-change-request-list']
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

  const handleUpdateStatus = () => {
    if (!selectedRequest?.id || !status) {
      return;
    }

    updateRequestMutation.mutate();
  };

  const handleDeleteConfirm = () => {
    if (!selectedRequest?.id) {
      return;
    }

    deleteRequestMutation.mutate(selectedRequest.id);
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
        render: (request) =>
          request?.request_id || '-'
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
            title={request?.description || ''}
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
            label={request?.status || 'Pending'}
            color={getStatusColor(request?.status)}
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
            ? formatDate(request.created_at)
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
              onClick={() => handleOpenEdit(request)}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() => handleOpenDelete(request)}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )
      }
    ],
    [handleOpenEdit, handleOpenDelete]
  );

  useEffect(() => {
    if (isError && error) {
      showApiError(error);
    }
  }, [isError, error, showApiError]);

  return (
    <>
      <MainCard title="Change Requests">
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Review, approve, or delete user change requests.
          </Typography>

          <ServerTable
            columns={requestColumns}
            rows={requests}
            getRowId={(request) => request.id}
            loading={isLoading || isFetching}
            error={null}
            emptyMessage="No change requests found."
            searchValue={search}
            searchPlaceholder="Search requests..."
            onSearchChange={handleTableSearchChange}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            totalCount={totalRequests}
            onPageChange={handleTablePageChange}
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
        <DialogTitle>Update Request Status</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Request ID:{' '}
              <strong>
                {selectedRequest?.request_id || '-'}
              </strong>
            </Typography>

            <FormControl fullWidth>
              <InputLabel id="request-status-label">
                Status
              </InputLabel>

              <Select
                labelId="request-status-label"
                id="request-status"
                value={status}
                label="Status"
                onChange={(event) =>
                  setStatus(event.target.value)
                }
              >
                {STATUS_OPTIONS.map((statusOption) => (
                  <MenuItem
                    key={statusOption}
                    value={statusOption}
                  >
                    {statusOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseEdit}
            disabled={updateRequestMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={
              updateRequestMutation.isPending ||
              !status
            }
          >
            {updateRequestMutation.isPending
              ? 'Updating...'
              : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={handleCloseDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Change Request</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete request{' '}
            <strong>
              {selectedRequest?.request_id ||
                'this request'}
            </strong>
            ?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDelete}
            disabled={deleteRequestMutation.isPending}
          >
            No
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleteRequestMutation.isPending}
          >
            {deleteRequestMutation.isPending
              ? 'Deleting...'
              : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminChangeRequest;