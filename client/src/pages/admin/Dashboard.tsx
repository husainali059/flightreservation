import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminAnalytics from './AdminAnalytics';
import AdminFlights from './AdminFlights';
import AdminAirlines from './AdminAirlines';
import AdminAircraft from './AdminAircraft';
import AdminAirports from './AdminAirports';
import AdminBookings from './AdminBookings';
import AdminUsers from './AdminUsers';
import AdminPromos from './AdminPromos';
import AdminSettings from './AdminSettings';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminAnalytics />} />
        <Route path="flights/*" element={<AdminFlights />} />
        <Route path="airlines" element={<AdminAirlines />} />
        <Route path="aircraft" element={<AdminAircraft />} />
        <Route path="airports" element={<AdminAirports />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="promos" element={<AdminPromos />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}
