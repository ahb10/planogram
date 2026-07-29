// assets
import DashboardIcon from '@mui/icons-material/Dashboard';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const viewerDashboard = {
  id: 'dashboard',
  // title: 'Dashboard',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/',
      icon: DashboardIcon,
      breadcrumbs: false
    },
  ]
};

export default viewerDashboard;
