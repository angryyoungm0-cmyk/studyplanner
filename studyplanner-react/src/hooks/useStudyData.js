import { useState, useCallback, useEffect } from 'react';
import { loadData, saveData } from '../lib/db';

const DB_KEY = 'studyPlanner';

export function getDefaultData() {
  return {
    subjects: [],
    exams: [],
    holidays: [],
    schedule: {},
    completedTasks: {},
    notes: {},
    streak: {
      current: 0,
      best: 0,
      lastStudyDate: null
    },
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

function loadSync() {
  try {
    const raw = JSON.parse(localStorage.getItem(DB_KEY));
    if (raw) return migrateData(raw);
    return getDefaultData();
  } catch {
    return getDefaultData();
  }
}

function migrateData(data) {
  const defaults = getDefaultData();
  const merged = { ...defaults, ...data };
  // Ensure nested objects have all fields
  merged.settings = { ...defaults.settings, ...(data.settings || {}) };
  merged.streak = { ...defaults.streak, ...(data.streak || {}) };
  // Ensure arrays exist
  if (!Array.isArray(merged.holidays)) merged.holidays = [];
  if (!Array.isArray(merged.subjects)) merged.subjects = [];
  if (!Array.isArray(merged.exams)) merged.exams = [];
  // Ensure objects exist
  if (typeof merged.schedule !== 'object' || merged.schedule === null) merged.schedule = {};
  if (typeof merged.completedTasks !== 'object' || merged.completedTasks === null) merged.completedTasks = {};
  return merged;
}

export function useStudyData() {
  const [data, setData] = useState(loadSync);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData().then(idbData => {
      if (idbData) {
        setData(migrateData(idbData));
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((newData) => {
    setData(newData);
    saveData(newData);
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(newData));
    } catch {}
  }, []);

  const updateData = useCallback((updater) => {
    setData(prev => {
      const newData = typeof updater === 'function' ? updater(prev) : updater;
      saveData(newData);
      try {
        localStorage.setItem(DB_KEY, JSON.stringify(newData));
      } catch {}
      return newData;
    });
  }, []);

  return { data, setData: persist, updateData, loaded };
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

export function exportData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `studyplanner-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      callback(imported);
    } catch {
      alert('Invalid backup file');
    }
  };
  reader.readAsText(file);
}

export function calculateStreak(completedTasks) {
  let current = 0;
  let date = new Date();
  let dateStr = toLocalDateStr(date);

  while (completedTasks[dateStr] && Object.values(completedTasks[dateStr]).some(Boolean)) {
    current++;
    date.setDate(date.getDate() - 1);
    dateStr = toLocalDateStr(date);
  }

  return current;
}

export function updateStreak(data) {
  const today = todayStr();
  const todayTasks = data.completedTasks[today] || {};
  const hasStudyToday = Object.values(todayTasks).some(Boolean);

  if (!hasStudyToday) {
    return data.streak;
  }

  const lastDate = data.streak.lastStudyDate;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateStr(yesterday);

  if (lastDate === today) {
    return data.streak;
  }

  if (lastDate === yesterdayStr) {
    const newCurrent = data.streak.current + 1;
    return {
      current: newCurrent,
      best: Math.max(newCurrent, data.streak.best),
      lastStudyDate: today
    };
  }

  return {
    current: 1,
    best: Math.max(1, data.streak.best),
    lastStudyDate: today
  };
}