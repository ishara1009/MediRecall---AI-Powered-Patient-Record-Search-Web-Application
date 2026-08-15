import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/api';
import { EmptyState, Skeleton } from '../../components/UI';
import './Notifications.css';

const destinationFor = (notification, role) => {
  const resourceKind = notification.relatedResource?.kind || notification.resourceKind;
  const isAppointment = resourceKind === 'Appointment' || notification.type?.startsWith('APPOINTMENT_');
  if (!isAppointment) return null;
  if (role === 'Doctor') return '/doctor/appointments';
  if (role === 'User') return '/user/appointments';
  return '/admin/dashboard';
};

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getNotifications();
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnread(response.data.unread || 0);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification._id);
        setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, isRead: true } : item));
        setUnread((count) => Math.max(0, count - 1));
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to update the notification.');
        return;
      }
    }
    const destination = destinationFor(notification, user?.role);
    if (destination) navigate(destination, { state: { appointmentId: notification.relatedResource?.id || null } });
  };

  const readAll = async () => {
    setUpdating(true);
    setError('');
    try {
      await markAllNotificationsRead();
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      setUnread(0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark notifications as read.');
    } finally {
      setUpdating(false);
    }
  };

  return <main className="notifications-page fade-in">
    <header className="notifications-heading"><div><span>PERSONAL INBOX</span><h1>Notifications</h1><p>Updates and activity associated with your MediRecall account.</p></div>{unread > 0 && <button onClick={readAll} disabled={updating}>{updating ? 'Updating…' : 'Mark all as read'}</button>}</header>
    <div className="notifications-summary"><strong>{unread}</strong><span>Unread notification{unread === 1 ? '' : 's'}</span></div>
    {error && <div className="notifications-error" role="alert">{error}<button onClick={load}>Try again</button></div>}
    {loading ? <Skeleton cards={4} /> : notifications.length === 0 ? <EmptyState title="No notifications" message="Your account updates will appear here." /> : <section className="notifications-list" aria-label="Your notifications">{notifications.map((notification) => {
      const destination = destinationFor(notification, user?.role);
      return <button className={`notification-row ${notification.isRead ? '' : 'unread'}`} onClick={() => openNotification(notification)} key={notification._id} aria-label={`${notification.isRead ? '' : 'Unread: '}${notification.title}`}>
        <span className="notification-status" aria-hidden="true">{notification.isRead ? '✓' : '●'}</span><div><div><strong>{notification.title}</strong>{!notification.isRead && <span>New</span>}</div><p>{notification.message}</p><small>{new Date(notification.createdAt).toLocaleString()}</small></div>{destination && <span className="notification-arrow" aria-hidden="true">→</span>}
      </button>;
    })}</section>}
  </main>;
}
