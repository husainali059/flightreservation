import { api } from './client';
import type {
  UserNotification,
  SearchHistoryItem,
  SavedRouteItem,
  LoyaltyPointsData,
  LoyaltyTransactionItem,
  BookingSummary,
} from '../types/customer';

export const customerAPI = {
  // Notifications
  getNotifications: (params?: { unread?: boolean; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.unread) q.set('unread', 'true');
    if (params?.limit) q.set('limit', String(params.limit));
    return api.get<{ notifications: UserNotification[]; unreadCount: number }>(
      `/user/notifications?${q.toString()}`
    );
  },
  markNotificationRead: (id: string) => api.patch<unknown>(`/user/notifications/${id}/read`, {}),
  markAllNotificationsRead: () => api.patch<unknown>('/user/notifications/read-all', {}),

  // Search history
  saveSearchHistory: (data: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    tripType?: string;
    adults?: number;
    children?: number;
    infants?: number;
    cabinClass?: string;
  }) => api.post<SearchHistoryItem>('/user/search-history', data),
  getSearchHistory: (limit?: number) =>
    api.get<SearchHistoryItem[]>(`/user/search-history${limit ? `?limit=${limit}` : ''}`),
  deleteSearchHistory: (id: string) => api.delete(`/user/search-history/${id}`),
  clearSearchHistory: () => api.delete('/user/search-history'),

  // Saved routes (wishlist)
  getSavedRoutes: () => api.get<SavedRouteItem[]>('/user/saved-routes'),
  addSavedRoute: (data: {
    origin: string;
    destination: string;
    priceAlert?: boolean;
    targetPrice?: number;
    cabinClass?: string;
  }) => api.post<SavedRouteItem>('/user/saved-routes', data),
  deleteSavedRoute: (id: string) => api.delete(`/user/saved-routes/${id}`),

  // Loyalty
  getLoyaltyPoints: () => api.get<LoyaltyPointsData>('/user/loyalty-points'),
  getLoyaltyTransactions: (limit?: number) =>
    api.get<LoyaltyTransactionItem[]>(`/user/loyalty/transactions${limit ? `?limit=${limit}` : ''}`),

  // Bookings (for dashboard)
  getBookings: (status?: string) =>
    api.get<BookingSummary[]>(`/bookings${status ? `?status=${status}` : ''}`),
};
