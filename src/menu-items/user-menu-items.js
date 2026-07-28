// assets
import DashboardIcon from '@mui/icons-material/Dashboard';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const userDashboard = {
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
    {
      id: 'request',
      title: 'Change Requests',
      type: 'item',
      url: '/change-request',
      icon: PlaylistAddIcon,
      breadcrumbs: true
    },
  ]
};

export default userDashboard;
