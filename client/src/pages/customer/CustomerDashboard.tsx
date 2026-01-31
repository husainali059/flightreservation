import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from '../../components/customer/CustomerLayout';
import DashboardHome from './DashboardHome';
import Bookings from '../Bookings';
import BookingDetail from '../BookingDetail';
import Profile from '../Profile';
import Loyalty from './Loyalty';
import Wishlist from './Wishlist';
import SearchHistoryPage from './SearchHistoryPage';
import NotificationsPage from './NotificationsPage';
import HelpPage from './HelpPage';
import SettingsPage from './SettingsPage';

export default function CustomerDashboard() {
  return (
    <CustomerLayout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:pnr" element={<BookingDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="loyalty" element={<Loyalty />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="search-history" element={<SearchHistoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </CustomerLayout>
  );
}
