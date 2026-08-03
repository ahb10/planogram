import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import { useSearchParams } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import { useSnackbar } from 'notistack';

import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import MainCard from 'ui-component/cards/MainCard';
import ServerTable from 'ui-component/tables/server-side-custom-table';

import useAxios from '../../api/useAxios';
import ActivityDetailDialog from './components/activity-detail';


const ACTIVITY_TABS = [
  {
    label: 'System Activity',
    filter: 'system_activity'
  },
  {
    label: 'User Accounts Activity',
    filter: 'user_accounts_activity'
  }
];


export default function ActivityPage() {
  const api = useAxios();
  const { enqueueSnackbar } = useSnackbar();

  const [searchParams, setSearchParams] = useSearchParams();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const handleOpenDetail = useCallback((activity) => {
    setSelectedActivity(activity);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedActivity(null);
  }, []);

  // --------------------------------------------------
  // Tab
  // --------------------------------------------------

  const tabParam = searchParams.get('tab');

  const tab = useMemo(() => {
    const index = ACTIVITY_TABS.findIndex(
      (item) => item.filter === tabParam
    );

    return index >= 0 ? index : 0;
  }, [tabParam]);


  const selectedFilter = ACTIVITY_TABS[tab].filter;


  const handleTabChange = useCallback(
    (event, newValue) => {
      const selectedTab = ACTIVITY_TABS[newValue];

      setSearchParams((currentParams) => {
        const params = new URLSearchParams(currentParams);

        params.set('tab', selectedTab.filter);

        return params;
      });

      // Reset table to first page
      setPage(0);
    },
    [setSearchParams]
  );


  // --------------------------------------------------
  // Table State
  // --------------------------------------------------

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');


  // --------------------------------------------------
  // Search
  // --------------------------------------------------

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


  // --------------------------------------------------
  // Pagination
  // --------------------------------------------------

  const handleTablePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);


  const handleRowsPerPageChange = useCallback((newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);


  // --------------------------------------------------
  // API Error
  // --------------------------------------------------

  const showApiError = useCallback(
    (error) => {
      const message =
        error?.response?.data?.message ||
        'Something went wrong while loading activity.';

      enqueueSnackbar(message, {
        variant: 'error',
        preventDuplicate: true
      });
    },
    [enqueueSnackbar]
  );


  // --------------------------------------------------
  // Fetch Activity
  // --------------------------------------------------

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery({
    queryKey: [
      'activity-list',
      selectedFilter,
      page,
      rowsPerPage,
      search
    ],

    queryFn: async () => {
      const response = await api.get(
        '/api/activity/grouped-list',
        {
          params: {
            filter_by: selectedFilter,
            page: page + 1,
            size: rowsPerPage,

            ...(search && {
              search
            })
          }
        }
      );

      return response.data;
    },

    placeholderData: (previousData) => previousData
  });


  // --------------------------------------------------
  // Fetch Detail Activity API
  // --------------------------------------------------

  const {
    data: detailResponse,
    isLoading: detailLoading,
    isFetching: detailFetching,
    isError: detailIsError,
    error: detailError
  } = useQuery({
    queryKey: [
      'activity-detail',
      selectedActivity?.change_id
    ],

    queryFn: async () => {
      const response = await api.get(
        `/api/activity/detail/${selectedActivity.change_id}`
      );

      return response.data;
    },

    enabled: Boolean(
      detailOpen &&
      selectedActivity?.change_id
    ),

    retry: false
  });

  const activityDetail = detailResponse?.data || null;

  // --------------------------------------------------
  // Handle API Error
  // --------------------------------------------------

  useEffect(() => {
    if (isError && error) {
      showApiError(error);
    }
  }, [
    isError,
    error,
    showApiError
  ]);

  // detail API error handling

  useEffect(() => {
    if (!detailIsError || !detailError) {
      return;
    }

    const message =
      detailError?.response?.data?.message ||
      'Something went wrong while loading activity detail.';

    enqueueSnackbar(message, {
      variant: 'error',
      preventDuplicate: true
    });
  }, [
    detailIsError,
    detailError,
    enqueueSnackbar
  ]);


  // --------------------------------------------------
  // Activity Data
  // --------------------------------------------------

  const activities = useMemo(() => {
    return Array.isArray(data?.results)
      ? data.results
      : [];
  }, [data]);


  const totalActivities = Number(
    data?.count || 0
  );


  // --------------------------------------------------
  // Validate Current Page
  // --------------------------------------------------

  useEffect(() => {
    const totalPages = Number(
      data?.total_pages || 0
    );

    if (
      totalPages > 0 &&
      page + 1 > totalPages
    ) {
      setPage(
        Math.max(totalPages - 1, 0)
      );
    }
  }, [
    data?.total_pages,
    page
  ]);


  // --------------------------------------------------
  // Table Columns
  // --------------------------------------------------

  const systemActivityColumns = useMemo(
    () => [
      {
        id: 'activity',
        label: 'Entity',
        minWidth: 150,

        sx: {
          whiteSpace: 'nowrap'
        },

        cellSx: {
          whiteSpace: 'normal',
          overflowWrap: 'anywhere'
        },

        render: (activity) =>
          activity?.model_name || '-'
      },

      {
        id: 'field_count',
        label: 'Field Count',
        minWidth: 150,

        sx: {
          whiteSpace: 'nowrap',
          textAlign: 'center',
        },

        cellSx: {
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          textAlign: 'center',
        },

        render: (activity) =>
          activity?.field_count || '-'
      },

      {
        id: 'summary',
        label: 'Summary',
        minWidth: 200,

        sx: {
          whiteSpace: 'nowrap'
        },

        cellSx: {
          whiteSpace: 'normal',
          overflowWrap: 'anywhere'
        },

        render: (activity) =>
          activity?.summary || '-'
      },

      {
        id: 'activity_performed_by',
        label: 'Activity Performed By',
        minWidth: 180,

        sx: {
          whiteSpace: 'nowrap'
        },

        cellSx: {
          whiteSpace: 'normal',
          overflowWrap: 'anywhere'
        },

        render: (activity) => (
          <div>
            <div>
              {activity?.changed_by_name || '-'}
            </div>

            {activity?.changed_by_email && (
              <div
                style={{
                  fontSize: '0.85em',
                  color: '#666'
                }}
              >
                {activity.changed_by_email}
              </div>
            )}
          </div>
        )
      },

      {
        id: 'changed_at',
        label: 'Date & Time',
        minWidth: 180,

        render: (activity) => {
          if (!activity?.changed_at) {
            return '-';
          }

          return new Date(activity.changed_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      },

      {
        id: 'detail',
        label: 'Detail',
        minWidth: 100,

        sx: {
          whiteSpace: 'nowrap',
          textAlign: 'center'
        },

        cellSx: {
          whiteSpace: 'nowrap',
          textAlign: 'center'
        },

        render: (activity) => (
          <Tooltip title="View activity detail">
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={!activity?.change_id}
                onClick={() => handleOpenDetail(activity)}
                aria-label="View activity detail"
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )
      }
    ],
    [handleOpenDetail]
  );


  const formatDateTime = (value) => {
    if (!value) return '-';

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

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <MainCard title="Activity">

      <Stack spacing={2}>

        {/* Tabs */}

        <Tabs
          value={tab}
          onChange={handleTabChange}
          aria-label="Activity type"
        >

          {ACTIVITY_TABS.map((activityTab) => (
            <Tab
              key={activityTab.filter}
              label={activityTab.label}
            />
          ))}

        </Tabs>


        {/* Activity Table */}

        <ServerTable
          columns={systemActivityColumns}

          rows={activities}

          getRowId={(activity) =>
            activity.id
          }

          loading={
            isLoading ||
            isFetching
          }

          error={null}

          emptyMessage="No activity found."

          searchValue={search}

          searchPlaceholder="Search activity..."

          onSearchChange={
            handleTableSearchChange
          }

          page={page}

          rowsPerPage={
            rowsPerPage
          }

          rowsPerPageOptions={[
            10,
            25,
            50,
            100
          ]}

          totalCount={
            totalActivities
          }

          onPageChange={
            handleTablePageChange
          }

          onRowsPerPageChange={
            handleRowsPerPageChange
          }
        />

        {/* Activity Detail Dialog */}
        <ActivityDetailDialog
          open={detailOpen}
          onClose={handleCloseDetail}
          loading={detailLoading || detailFetching}
          detail={activityDetail}
        />

      </Stack>

    </MainCard>
  );
}