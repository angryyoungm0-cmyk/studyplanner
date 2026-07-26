import { useState, useCallback } from 'react';

const DB_KEY = 'studyPlanner';

export function getDefaultData() {
  return {
    subjects: [],
    exams: [],
    holidays: [],
    schedule: {},
    completedTasks: {},
    notes: {},
    settings: {
      studyStartTime: '07:00',
      studyEndTime: '22:00',
      schoolStart: '10:30',
      schoolEnd: '18:20',
      sessionDuration: 45,
      breakDuration: 10,
      enableNotifications: true,
      reminderBefore: 5,
      holidaySessionDuration: 60,
      holidayBreakDuration: 15,
      groqApiKey: ''
    }
  };
}

export function useStudyData() {
  const [data, setData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY)) || getDefaultData();
    } catch {
      return getDefaultData();
    }
  });

  const saveData = useCallback((newData) => {
    localStorage.setItem(DB_KEY, JSON.stringify(newData));
    setData(newData);
  }, []);

  const updateData = useCallback((updater) => {
    setData(prev => {
      const newData = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(DB_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  return { data, setData: saveData, updateData };
}

export function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(str) {
  const parts = str.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function formatDate(dateStr) {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function daysBetween(date1, date2) {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function isHoliday(dateStr, holidays) {
  if (!holidays) return false;
  if (holidays.includes(dateStr)) return true;
  if (holidays.includes('weekends')) {
    const d = parseDate(dateStr);
    if (d.getDay() === 0) return true;
  }
  return false;
}

export function getFirstExamDate(exams) {
  if (!exams || exams.length === 0) return null;
  return exams.reduce((min, e) => e.date < min ? e.date : min, exams[0].date);
}
