import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import MainCard from 'ui-component/cards/MainCard';
import ServerTable from 'ui-component/tables/server-side-custom-table';

import useAxios from '../../api/useAxios';
import requestSchema from './requestSchema';
import { formatDate } from 'utils/helper-function';
import DescriptionModal from 'ui-component/modals/DescriptionModal';

const getListFromResponse = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.results)) {
    return responseData.results;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.data?.results)) {
    return responseData.data.results;
  }

  return [];
};

const getOptionName = (options, currentValue) => {
  if (
    currentValue === null ||
    currentValue === undefined ||
    currentValue === ''
  ) {
    return '';
  }

  const selectedOption = options.find(
    (option) => String(option?.id) === String(currentValue)
  );

  return selectedOption
    ? String(selectedOption?.name ?? selectedOption?.value ?? '')
    : '';
};

const getApiErrorMessage = (error) => {
  const responseData = error?.response?.data?.message || "Something went wrong. Please try again.";

  if (responseData) {
    return responseData.message;
  }

  return 'Something went wrong. Please try again.';
};

const getStatusColor = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'completed':
      return 'success';
    case 'rejected':
      return 'error';
    case 'in process':
      return 'warning';
    default:
      return 'default';
  }
};

const getDisplayValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '-';
  }

  return value;
};

const RequestDisplayRecordsTable = ({ records = [] }) => {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        width: '100%',
        overflowX: 'auto'
      }}
    >
      <Table
        size="small"
        sx={{ minWidth: 1800 }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 100, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Record ID
            </TableCell>
            <TableCell sx={{ minWidth: 150, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Region
            </TableCell>
            <TableCell sx={{ minWidth: 200, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Store
            </TableCell>
            <TableCell sx={{ minWidth: 130, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Store Code
            </TableCell>
            <TableCell sx={{ minWidth: 130, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Branch Code
            </TableCell>
            <TableCell sx={{ minWidth: 280, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Product
            </TableCell>
            <TableCell sx={{ minWidth: 170, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Item Code
            </TableCell>
            <TableCell sx={{ minWidth: 160, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Table Type
            </TableCell>
            <TableCell
              align="center"
              sx={{ minWidth: 120, whiteSpace: 'nowrap', fontWeight: 700 }}
            >
              Table Number
            </TableCell>
            <TableCell sx={{ minWidth: 180, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Security Type
            </TableCell>
            <TableCell
              align="center"
              sx={{ minWidth: 100, whiteSpace: 'nowrap', fontWeight: 700 }}
            >
              Quantity
            </TableCell>
            <TableCell sx={{ minWidth: 120, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Keyboard
            </TableCell>
            <TableCell sx={{ minWidth: 120, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Pen
            </TableCell>
            <TableCell sx={{ minWidth: 150, whiteSpace: 'nowrap', fontWeight: 700 }}>
              Created At
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {records.map((record, index) => (
            <TableRow
              key={record?.id ?? `display-record-${index}`}
              hover
            >
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.id)}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.region_name)}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.store_name)}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.store_code)}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.branch_code)}
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 280,
                  maxWidth: 380,
                  whiteSpace: 'normal',
                  overflowWrap: 'anywhere'
                }}
              >
                {getDisplayValue(record?.product_name)}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.product_sku)}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.table_type_name)}
              </TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.table_number)}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.security_type_name)}
              </TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.quantity)}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.keyboard)}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {getDisplayValue(record?.pen)}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {record?.created_at
                  ? formatDate(record.created_at)
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const getDisplayRecordLabel = (record) => {
  const parts = [
    record?.product_name,
    record?.product_sku
      ? `SKU: ${record.product_sku}`
      : '',
    record?.table_number !== null &&
      record?.table_number !== undefined
      ? `Table: ${record.table_number}`
      : '',
    record?.security_type_name
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(' | ')
    : `Display Record #${record?.id}`;
};

const SearchableSelectField = ({
  id,
  label,
  name,
  value,
  options,
  error,
  touched,
  loading,
  disabled = false,
  setFieldValue,
  setFieldTouched,
  onValueChange,
  noOptionsText = 'No options found'
}) => {
  const selectedOption =
    options.find(
      (option) => String(option?.id) === String(value)
    ) || null;

  return (
    <Autocomplete
      id={id}
      options={options}
      value={selectedOption}
      loading={loading}
      disabled={disabled || loading}
      autoHighlight
      clearOnEscape
      noOptionsText={noOptionsText}
      isOptionEqualToValue={(option, selectedValue) =>
        String(option?.id) === String(selectedValue?.id)
      }
      getOptionLabel={(option) =>
        String(option?.name || '')
      }
      onChange={(_, selectedValue) => {
        const nextValue =
          selectedValue?.id !== undefined
            ? String(selectedValue.id)
            : '';

        if (onValueChange) {
          onValueChange(nextValue);
          return;
        }

        setFieldValue(name, nextValue);
      }}
      onBlur={() => {
        setFieldTouched(name, true);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          name={name}
          label={label}
          error={Boolean(touched && error)}
          helperText={touched && error ? error : ''}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress size={18} />
                ) : null}

                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  );
};

const ChangeRequestFormFields = ({
  api,
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  setFieldValue,
  setFieldTouched,
  regionOptions,
  isRegionsLoading,
  showApiError
}) => {
  const selectedRegionName = useMemo(
    () => getOptionName(regionOptions, values.region),
    [regionOptions, values.region]
  );

  const {
    data: storeOptionsData,
    isFetching: isStoresLoading,
    isError: isStoresError,
    error: storesError
  } = useQuery({
    queryKey: ['request-store-name-list', selectedRegionName],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/store-name-list',
        {
          params: {
            region: selectedRegionName
          }
        }
      );

      return response.data;
    },
    enabled: Boolean(selectedRegionName)
  });

  const storeOptions = useMemo(
    () => getListFromResponse(storeOptionsData),
    [storeOptionsData]
  );

  const selectedStoreName = useMemo(
    () => getOptionName(storeOptions, values.store),
    [storeOptions, values.store]
  );

  const {
    data: tableOptionsData,
    isFetching: isTableTypesLoading,
    isError: isTableTypesError,
    error: tableTypesError
  } = useQuery({
    queryKey: [
      'request-table-name-list',
      selectedRegionName,
      selectedStoreName
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/table-name-list',
        {
          params: {
            region: selectedRegionName,
            store: selectedStoreName
          }
        }
      );

      return response.data;
    },
    enabled: Boolean(
      selectedRegionName &&
      selectedStoreName
    )
  });

  const tableTypeOptions = useMemo(
    () => getListFromResponse(tableOptionsData),
    [tableOptionsData]
  );

  const selectedTableTypeName = useMemo(
    () => getOptionName(tableTypeOptions, values.table_type),
    [tableTypeOptions, values.table_type]
  );

  const {
    data: productOptionsData,
    isFetching: isProductsLoading,
    isError: isProductsError,
    error: productsError
  } = useQuery({
    queryKey: [
      'request-product-name-list',
      selectedRegionName,
      selectedStoreName,
      selectedTableTypeName
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/product-name-list',
        {
          params: {
            region: selectedRegionName,
            store: selectedStoreName,
            table_type: selectedTableTypeName
          }
        }
      );

      return response.data;
    },
    enabled: Boolean(
      selectedRegionName &&
      selectedStoreName &&
      selectedTableTypeName
    )
  });

  const productOptions = useMemo(
    () => getListFromResponse(productOptionsData),
    [productOptionsData]
  );

  const selectedProductName = useMemo(
    () => getOptionName(productOptions, values.product),
    [productOptions, values.product]
  );

  const {
    data: securityOptionsData,
    isFetching: isSecurityTypesLoading,
    isError: isSecurityTypesError,
    error: securityTypesError
  } = useQuery({
    queryKey: [
      'request-security-name-list',
      selectedRegionName,
      selectedStoreName,
      selectedTableTypeName,
      selectedProductName
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/security-name-list',
        {
          params: {
            region: selectedRegionName,
            store: selectedStoreName,
            table_type: selectedTableTypeName,
            product: selectedProductName
          }
        }
      );

      return response.data;
    },
    enabled: Boolean(
      selectedRegionName &&
      selectedStoreName &&
      selectedTableTypeName &&
      selectedProductName
    )
  });

  const securityTypeOptions = useMemo(
    () => getListFromResponse(securityOptionsData),
    [securityOptionsData]
  );

  const selectedSecurityTypeName = useMemo(
    () =>
      getOptionName(
        securityTypeOptions,
        values.security_type
      ),
    [securityTypeOptions, values.security_type]
  );

  const {
    data: displayRecordOptionsData,
    isFetching: isDisplayRecordsLoading,
    isError: isDisplayRecordsError,
    error: displayRecordsError
  } = useQuery({
    queryKey: [
      'request-display-record-options',
      selectedRegionName,
      selectedStoreName,
      selectedTableTypeName,
      selectedProductName,
      selectedSecurityTypeName
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/record-name-list',
        {
          params: {
            region: selectedRegionName,
            store: selectedStoreName,
            table_type: selectedTableTypeName,
            product: selectedProductName,
            security_type: selectedSecurityTypeName
          }
        }
      );

      return response.data;
    },
    enabled: Boolean(
      selectedRegionName &&
      selectedStoreName &&
      selectedTableTypeName &&
      selectedProductName &&
      selectedSecurityTypeName
    )
  });

  const displayRecordOptions = useMemo(
    () =>
      getListFromResponse(displayRecordOptionsData).map(
        (record) => ({
          id: record.id,
          name: getDisplayRecordLabel(record),
          record
        })
      ),
    [displayRecordOptionsData]
  );

  useEffect(() => {
    if (isStoresError && storesError) {
      showApiError(storesError);
    }
  }, [
    isStoresError,
    storesError,
    showApiError
  ]);

  useEffect(() => {
    if (isTableTypesError && tableTypesError) {
      showApiError(tableTypesError);
    }
  }, [
    isTableTypesError,
    tableTypesError,
    showApiError
  ]);

  useEffect(() => {
    if (isProductsError && productsError) {
      showApiError(productsError);
    }
  }, [
    isProductsError,
    productsError,
    showApiError
  ]);

  useEffect(() => {
    if (isSecurityTypesError && securityTypesError) {
      showApiError(securityTypesError);
    }
  }, [
    isSecurityTypesError,
    securityTypesError,
    showApiError
  ]);

  useEffect(() => {
    if (isDisplayRecordsError && displayRecordsError) {
      showApiError(displayRecordsError);
    }
  }, [
    isDisplayRecordsError,
    displayRecordsError,
    showApiError
  ]);

  const clearFields = (fieldNames) => {
    fieldNames.forEach((fieldName) => {
      setFieldValue(fieldName, '', false);
      setFieldTouched(fieldName, false, false);
    });
  };

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <SearchableSelectField
        id="change-request-region"
        name="region"
        label="Region"
        value={values.region}
        options={regionOptions}
        loading={isRegionsLoading}
        touched={touched.region}
        error={errors.region}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        onValueChange={(nextValue) => {
          setFieldValue('region', nextValue);
          clearFields([
            'store',
            'table_type',
            'product',
            'security_type',
            'display_record'
          ]);
        }}
      />

      <SearchableSelectField
        id="change-request-store"
        name="store"
        label="Store"
        value={values.store}
        options={storeOptions}
        loading={isStoresLoading}
        disabled={!values.region}
        touched={touched.store}
        error={errors.store}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        onValueChange={(nextValue) => {
          setFieldValue('store', nextValue);
          clearFields([
            'table_type',
            'product',
            'security_type',
            'display_record'
          ]);
        }}
      />

      <SearchableSelectField
        id="change-request-table-type"
        name="table_type"
        label="Table Type"
        value={values.table_type}
        options={tableTypeOptions}
        loading={isTableTypesLoading}
        disabled={!values.region || !values.store}
        touched={touched.table_type}
        error={errors.table_type}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        onValueChange={(nextValue) => {
          setFieldValue('table_type', nextValue);
          clearFields([
            'product',
            'security_type',
            'display_record'
          ]);
        }}
      />

      <SearchableSelectField
        id="change-request-product"
        name="product"
        label="Product"
        value={values.product}
        options={productOptions}
        loading={isProductsLoading}
        disabled={
          !values.region ||
          !values.store ||
          !values.table_type
        }
        touched={touched.product}
        error={errors.product}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        onValueChange={(nextValue) => {
          setFieldValue('product', nextValue);
          clearFields([
            'security_type',
            'display_record'
          ]);
        }}
      />

      <SearchableSelectField
        id="change-request-security-type"
        name="security_type"
        label="Security Type"
        value={values.security_type}
        options={securityTypeOptions}
        loading={isSecurityTypesLoading}
        disabled={
          !values.region ||
          !values.store ||
          !values.table_type ||
          !values.product
        }
        touched={touched.security_type}
        error={errors.security_type}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        onValueChange={(nextValue) => {
          setFieldValue('security_type', nextValue);
          clearFields(['display_record']);
        }}
      />

      <SearchableSelectField
        id="change-request-display-record"
        name="display_record"
        label="Display Record"
        value={values.display_record}
        options={displayRecordOptions}
        loading={isDisplayRecordsLoading}
        disabled={
          !values.region ||
          !values.store ||
          !values.table_type ||
          !values.product ||
          !values.security_type
        }
        touched={touched.display_record}
        error={errors.display_record}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        noOptionsText="No display records found"
      />

      <FormControl fullWidth>
        <TextField
          id="change-request-description"
          name="description"
          label="Description"
          multiline
          minRows={4}
          value={values.description}
          onChange={handleChange}
          onBlur={handleBlur}
          error={Boolean(
            touched.description &&
            errors.description
          )}
          helperText={
            touched.description &&
              errors.description
              ? errors.description
              : ''
          }
        />
      </FormControl>
    </Stack>
  );
};

export default function ChangeRequestsPage() {
  const api = useAxios();
  const queryClient = useQueryClient();
  const formikRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [recordDetailOpen, setRecordDetailOpen] = useState(false);
  const [recordDetail, setRecordDetail] = useState(null);

  const showApiError = useCallback(
    (error) => {
      enqueueSnackbar(getApiErrorMessage(error), {
        variant: 'error',
        preventDuplicate: true
      });
    },
    [enqueueSnackbar]
  );

  const handleOpenCreate = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleOpenRequestDetails = useCallback((request) => {
    setSelectedRequest(request);
  }, []);

  const handleCloseRequestDetails = useCallback(() => {
    setSelectedRequest(null);
  }, []);

  const handleTableSearchChange = useCallback(
    (value) => {
      const normalizedValue = String(value || '').trim();

      setSearch((previousSearch) => {
        if (previousSearch === normalizedValue) {
          return previousSearch;
        }

        setPage(0);
        return normalizedValue;
      });
    },
    []
  );

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
      'change-request-list',
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

  const {
    data: regionOptionsData,
    isLoading: isRegionsLoading,
    isError: isRegionsError,
    error: regionsError
  } = useQuery({
    queryKey: ['request-region-name-list'],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/region-name-list'
      );

      return response.data;
    }
  });

  const requests = useMemo(
    () => getListFromResponse(requestData),
    [requestData]
  );

  const regionOptions = useMemo(
    () => getListFromResponse(regionOptionsData),
    [regionOptionsData]
  );

  const totalRequests = Number(requestData?.count || 0);

  useEffect(() => {
    const totalPages = Number(
      requestData?.total_pages || 0
    );

    if (totalPages > 0 && page >= totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [requestData?.total_pages, page]);

  const createRequestMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        display_record: Number(values.display_record),
        description: values.description.trim()
      };

      const response = await api.post(
        '/api/inventory/create-request',
        payload
      );

      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.invalidateQueries({
        queryKey: ['change-request-list']
      });

      enqueueSnackbar(
        responseData?.message ||
        'Change request created successfully.',
        {
          variant: 'success',
          preventDuplicate: true
        }
      );

      setOpen(false);
    },
    onError: showApiError
  });


  const recordDetailMutation = useMutation({
    mutationFn: async (requestId) => {
      const response = await api.get(
        `/api/inventory/request-display-records/${requestId}`
      );

      return response.data;
    },
    onSuccess: (responseData) => {
      const detailData = responseData?.data ?? responseData;

      setRecordDetail(
        detailData && typeof detailData === 'object'
          ? detailData
          : null
      );
    },
    onError: (requestError) => {
      setRecordDetail(null);
      showApiError(requestError);
    }
  });

  const recordDetailRecords = useMemo(
    () =>
      Array.isArray(recordDetail?.display_records)
        ? recordDetail.display_records
        : [],
    [recordDetail]
  );

  const handleOpenRecordDetail = useCallback(
    (request) => {
      const requestId = request?.id;

      if (!requestId) {
        enqueueSnackbar('Request ID is not available.', {
          variant: 'error',
          preventDuplicate: true
        });
        return;
      }

      setRecordDetail(null);
      recordDetailMutation.reset();
      setRecordDetailOpen(true);
      recordDetailMutation.mutate(requestId);
    },
    [recordDetailMutation, enqueueSnackbar]
  );

  const handleCloseRecordDetail = useCallback(() => {
    if (recordDetailMutation.isPending) {
      return;
    }

    setRecordDetailOpen(false);
    setRecordDetail(null);
    recordDetailMutation.reset();
  }, [recordDetailMutation]);

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
            onClick={() => handleOpenRecordDetail(request)}
            disabled={recordDetailMutation.isPending}
            sx={{
              minWidth: 'auto',
              p: 0,
              textTransform: 'none',
              fontWeight: 600,
              textDecoration: 'underline'
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
      // {
      //   id: 'store_name',
      //   label: 'Store',
      //   minWidth: 170,
      //   sx: {
      //     whiteSpace: 'nowrap'
      //   },
      //   cellSx: {
      //     whiteSpace: 'nowrap'
      //   },
      //   render: (request) => {
      //     const storeNames =
      //       request?.display_records
      //         ?.map((record) => record?.store_name)
      //         .filter(Boolean) || [];

      //     return storeNames.length > 0
      //       ? storeNames.join(', ')
      //       : '-';
      //   }
      // },
      {
        id: 'request_details',
        label: 'Details',
        minWidth: 100,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap',
        },
        render: (request) => (
          <Tooltip title="View description and rejection reason">
            <IconButton
              size="small"
              color="primary"
              onClick={() =>
                handleOpenRequestDetails(request)
              }
              aria-label={`View details for ${request?.request_id || 'request'
                }`}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
          formatDate(request?.created_at)
      }
    ],
    [
      handleOpenRequestDetails,
      handleOpenRecordDetail,
      recordDetailMutation.isPending
    ]
  );

  useEffect(() => {
    if (isError && error) {
      showApiError(error);
    }
  }, [isError, error, showApiError]);

  useEffect(() => {
    if (isRegionsError && regionsError) {
      showApiError(regionsError);
    }
  }, [
    isRegionsError,
    regionsError,
    showApiError
  ]);

  return (
    <>
      <MainCard
        title="Change Requests"
        secondary={
          ""
        }
      >
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Submit and track requests for changes to display
            records.
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

      <DescriptionModal
        open={Boolean(selectedRequest)}
        onClose={handleCloseRequestDetails}
        title={
          selectedRequest?.request_id
            ? `Request ${selectedRequest.request_id}`
            : 'Request Details'
        }
        description={selectedRequest?.description}
        rejectionReason={selectedRequest?.rejection_reason}
      />

      <Dialog
        open={recordDetailOpen}
        onClose={handleCloseRecordDetail}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          {recordDetailMutation.isPending
            ? 'Loading Request Details'
            : `Request Details: ${recordDetail?.request_id || '-'}`}
        </DialogTitle>

        <DialogContent dividers>
          {recordDetailMutation.isPending ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{ py: 6 }}
            >
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary">
                Loading display records...
              </Typography>
            </Stack>
          ) : recordDetailMutation.isError ? (
            <Typography variant="body2" color="error" sx={{ py: 3 }}>
              Unable to load display record details.
            </Typography>
          ) : recordDetail ? (
            <Stack spacing={3}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 3
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Request ID:{' '}
                  <Typography
                    component="span"
                    variant="body2"
                    fontWeight={700}
                    color="text.primary"
                  >
                    {getDisplayValue(recordDetail?.request_id)}
                  </Typography>
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Status:{' '}
                  <Chip
                    size="small"
                    label={recordDetail?.status || 'In Process'}
                    color={getStatusColor(recordDetail?.status)}
                    variant="outlined"
                    sx={{ ml: 0.5 }}
                  />
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Total Records:{' '}
                  <Typography
                    component="span"
                    variant="body2"
                    fontWeight={700}
                    color="text.primary"
                  >
                    {recordDetailRecords.length}
                  </Typography>
                </Typography>
              </Box>

              {recordDetailRecords.length > 0 ? (
                <RequestDisplayRecordsTable records={recordDetailRecords} />
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 4, textAlign: 'center' }}
                >
                  No display records are attached to this request.
                </Typography>
              )}

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
                  Description
                </Typography>

                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere'
                  }}
                >
                  {getDisplayValue(recordDetail?.description)}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
              Request details are not available.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseRecordDetail}
            disabled={recordDetailMutation.isPending}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Change Request</DialogTitle>

        <DialogContent>
          <Formik
            innerRef={formikRef}
            initialValues={{
              region: '',
              store: '',
              table_type: '',
              product: '',
              security_type: '',
              display_record: '',
              description: ''
            }}
            validationSchema={requestSchema}
            onSubmit={(values) => {
              createRequestMutation.mutate(values);
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              setFieldValue,
              setFieldTouched,
              handleSubmit
            }) => (
              <form onSubmit={handleSubmit}>
                <ChangeRequestFormFields
                  api={api}
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  setFieldTouched={setFieldTouched}
                  regionOptions={regionOptions}
                  isRegionsLoading={isRegionsLoading}
                  showApiError={showApiError}
                />
              </form>
            )}
          </Formik>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClose}
            disabled={createRequestMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() =>
              formikRef.current?.submitForm()
            }
            disabled={
              createRequestMutation.isPending ||
              isRegionsLoading
            }
          >
            {createRequestMutation.isPending
              ? 'Submitting...'
              : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
