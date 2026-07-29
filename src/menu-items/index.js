import dashboard from './dashboard';
import userDashboard from './user-menu-items';
import viewerDashboard from './viewer-menu-items';

// ==============================|| MENU ITEMS ||============================== //

export const adminMenu = {
  items: [dashboard]
};

export const userMenu = {
  items: [userDashboard]
};

export const viewerMenu = {
  items: [viewerDashboard]
};