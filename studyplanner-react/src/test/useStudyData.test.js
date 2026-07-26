import { describe, it, expect } from 'vitest';
import {
  todayStr,
  toLocalDateStr,
  parseDate,
  formatDate,
  daysBetween,
  timeToMinutes,
  minutesToTime,
  generateId,
  isHoliday,
  getFirstExamDate,
  calculateStreak,
  updateStreak,
  getDefaultData
} from '../hooks/useStudyData';

describe('Date utilities', () => {
  it('todayStr returns YYYY-MM-DD format', () => {
    const result = todayStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('toLocalDateStr returns YYYY-MM-DD', () => {
    const date = new Date(2026, 0, 15);
    expect(toLocalDateStr(date)).toBe('2026-01-15');
  });

  it('parseDate creates correct date', () => {
    const date = parseDate('2026-03-15');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
  });

  it('daysBetween calculates correctly', () => {
    expect(daysBetween('2026-01-01', '2026-01-02')).toBe(1);
    expect(daysBetween('2026-01-01', '2026-01-08')).toBe(7);
    expect(daysBetween('2026-01-10', '2026-01-01')).toBe(-9);
  });

  it('formatDate returns a string', () => {
    const result = formatDate('2026-01-15');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('Time utilities', () => {
  it('timeToMinutes converts correctly', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('01:00')).toBe(60);
    expect(timeToMinutes('07:30')).toBe(450);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('minutesToTime converts correctly', () => {
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(60)).toBe('01:00');
    expect(minutesToTime(450)).toBe('07:30');
    expect(minutesToTime(1439)).toBe('23:59');
  });
});

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('generates unique ids', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('isHoliday', () => {
  it('returns false for no holidays', () => {
    expect(isHoliday('2026-01-15', [])).toBe(false);
  });

  it('detects specific holiday dates', () => {
    expect(isHoliday('2026-01-26', ['2026-01-26'])).toBe(true);
    expect(isHoliday('2026-01-15', ['2026-01-26'])).toBe(false);
  });
});

describe('getFirstExamDate', () => {
  it('returns null for empty exams', () => {
    expect(getFirstExamDate([])).toBeNull();
    expect(getFirstExamDate(null)).toBeNull();
  });

  it('returns earliest date', () => {
    const exams = [
      { date: '2026-03-15', name: 'Math' },
      { date: '2026-02-01', name: 'Science' },
      { date: '2026-04-01', name: 'English' }
    ];
    expect(getFirstExamDate(exams)).toBe('2026-02-01');
  });
});

describe('getDefaultData', () => {
  it('returns object with required fields', () => {
    const data = getDefaultData();
    expect(data).toHaveProperty('subjects');
    expect(data).toHaveProperty('exams');
    expect(data).toHaveProperty('schedule');
    expect(data).toHaveProperty('completedTasks');
    expect(data).toHaveProperty('streak');
    expect(data).toHaveProperty('settings');
    expect(data.settings).toHaveProperty('groqApiKey');
    expect(data.streak).toHaveProperty('current');
    expect(data.streak).toHaveProperty('best');
  });
});

describe('Study streaks', () => {
  it('calculateStreak returns 0 for no completed tasks', () => {
    expect(calculateStreak({})).toBe(0);
  });

  it('calculateStreak counts consecutive days', () => {
    const today = todayStr();
    const yesterday = toLocalDateStr(new Date(Date.now() - 86400000));
    const tasks = {
      [today]: { 0: true },
      [yesterday]: { 0: true }
    };
    expect(calculateStreak(tasks)).toBe(2);
  });

  it('updateStreak returns existing streak when no study today', () => {
    const data = {
      completedTasks: {},
      streak: { current: 5, best: 5, lastStudyDate: '2026-01-01' }
    };
    const result = updateStreak(data);
    expect(result.current).toBe(5);
  });

  it('updateStreak increments when studied yesterday', () => {
    const yesterday = toLocalDateStr(new Date(Date.now() - 86400000));
    const today = todayStr();
    const data = {
      completedTasks: { [today]: { 0: true } },
      streak: { current: 3, best: 3, lastStudyDate: yesterday }
    };
    const result = updateStreak(data);
    expect(result.current).toBe(4);
    expect(result.best).toBe(4);
    expect(result.lastStudyDate).toBe(today);
  });

  it('updateStreak resets when gap in study', () => {
    const today = todayStr();
    const data = {
      completedTasks: { [today]: { 0: true } },
      streak: { current: 5, best: 5, lastStudyDate: '2026-01-10' }
    };
    const result = updateStreak(data);
    expect(result.current).toBe(1);
    expect(result.best).toBe(5);
  });
});