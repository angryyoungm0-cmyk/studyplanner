import { useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { todayStr } from '../hooks/useStudyData';

export function useNotifications() {
  const { data, showToast } = useApp();
  const timersRef = useRef([]);

  const setupNotifications = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];

    if (!data.settings.enableNotifications) return;

    if ('Notification' in window && Notification.permission === 'default' && !window.hasAskedNotificationPermission) {
      window.hasAskedNotificationPermission = true;
      Notification.requestPermission();
    }

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
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('StudyPlanner Reminder', {
              body: `Time to study: ${item.title}\n${item.description}`,
              icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">📚</text></svg>'
            });
          }
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

  return { setupNotifications };
}