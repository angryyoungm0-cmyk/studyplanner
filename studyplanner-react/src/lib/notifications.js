import { saveData } from './db';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    return subscription;
  } catch (err) {
    console.warn('Push subscription failed:', err);
    return null;
  }
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.warn('Push unsubscribe failed:', err);
  }
}

export async function scheduleLocalNotification(title, body, delay = 0) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  setTimeout(() => {
    new Notification(title, {
      body,
      icon: '/studyplanner/logo.png',
      badge: '/studyplanner/logo.png',
      vibrate: [200, 100, 200],
      tag: 'studyplanner-reminder',
      renotify: true
    });
  }, delay);
}

export function checkAndNotify(schedule, completedTasks, settings) {
  if (!settings.enableNotifications) return;

  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];
  const todaySchedule = schedule[todayKey] || [];
  const todayCompleted = completedTasks[todayKey] || {};
  const reminderMs = (settings.reminderBefore || 5) * 60 * 1000;

  todaySchedule.forEach((item, i) => {
    if (todayCompleted[i]) return;
    if (item.type !== 'study' && item.type !== 'revision') return;

    const [h, m] = (item.time || '07:00').split(':').map(Number);
    const sessionTime = new Date(now);
    sessionTime.setHours(h, m, 0, 0);
    const reminderTime = new Date(sessionTime.getTime() - reminderMs);

    const diffMs = reminderTime.getTime() - now.getTime();
    if (diffMs > 0 && diffMs < 60000) {
      scheduleLocalNotification(
        'StudyPlanner Reminder',
        `Upcoming: ${item.title} at ${item.time}`,
        diffMs
      );
    }
  });
}