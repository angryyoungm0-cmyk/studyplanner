import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { todayStr } from '../hooks/useStudyData';
import { subscribeToPush, scheduleLocalNotification } from '../lib/notifications';

export function useNotifications() {
  const { data, showToast } = useApp();
  const timersRef = useRef([]);

  const setupNotifications = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];

    if (!data.settings.enableNotifications) return;

    const todaySchedule = data.schedule[todayStr()];
    if (!todaySchedule) return;

    const completed = data.completedTasks[todayStr()] || {};

    todaySchedule.forEach((item, i) => {
      if (completed[i] || item.type === 'break' || item.type === 'rest' || item.type === 'school') return;

      const [h, m] = item.time.split(':').map(Number);
      const itemTime = new Date();
      itemTime.setHours(h, m, 0, 0);

      const reminderTime = new Date(itemTime.getTime() - data.settings.reminderBefore * 60000);
      const delay = reminderTime.getTime() - Date.now();

      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          scheduleLocalNotification(
            'StudyPlanner Reminder',
            `Time to study: ${item.title}${item.description ? '\n' + item.description : ''}`,
            0
          );
        }, delay);
        timersRef.current.push(timer);
      }
    });
  }, [data]);

  useEffect(() => {
    setupNotifications();
    const interval = setInterval(setupNotifications, 60000);
    return () => {
      clearInterval(interval);
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, [setupNotifications]);

  const enablePush = useCallback(async () => {
    const sub = await subscribeToPush();
    if (sub) {
      showToast('Push notifications enabled!');
    } else {
      showToast('Push notifications not available', 'error');
    }
    return sub;
  }, [showToast]);

  return { setupNotifications, enablePush };
}