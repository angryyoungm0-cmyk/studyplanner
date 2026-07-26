import { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  en: {
    dashboard: 'Dashboard',
    schedule: 'Schedule',
    subjects: 'Subjects',
    exams: 'Exams',
    generate: 'Generate',
    settings: 'Settings',
    aiChat: 'AI Chat',
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    daysLeft: 'Days Left',
    chaptersDone: 'Chapters Done',
    totalChapters: 'Total Chapters',
    progress: 'Progress',
    todaySchedule: "Today's Schedule",
    noSchedule: 'No schedule generated yet. Add your subjects and exams first!',
    weeklyProgress: 'Weekly Progress',
    notifications: 'Notifications',
    enableNotifications: 'Enable Notifications',
    reminderBefore: 'Remind me before each session (minutes)',
    enableNotifBtn: 'Enable Notifications',
    saveSettings: 'Save Settings',
    studyPlayerAI: 'StudyPlayer AI (Groq API)',
    getApiKey: 'Get a free API key from',
    groqApiKey: 'Groq API Key',
    saveApiKey: 'Save API Key',
    dataManagement: 'Data Management',
    exportData: 'Export Data',
    importData: 'Import Data',
    resetAllData: 'Reset All Data',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    english: 'English',
    marathi: 'Marathi',
    subjectsTitle: 'Subjects',
    addSubject: 'Add Subject',
    examTitle: 'Exams',
    addExam: 'Add Exam',
    generateSchedule: 'Generate Schedule',
    calendarExport: 'Calendar Export',
    exportPdf: 'Export PDF',
    exportIcs: 'Export Calendar (.ics)',
    studyStreak: 'Study Streak',
    currentStreak: 'Current Streak',
    bestStreak: 'Best Streak',
    days: 'days',
    day: 'day',
    streakMessage: 'Keep it going!',
    streakBroken: 'Start a new streak today!',
    cloudSync: 'Cloud Sync',
    syncToCloud: 'Sync to Cloud',
    restoreFromCloud: 'Restore from Cloud',
    pushNotifications: 'Push Notifications',
    enablePush: 'Enable Push',
  },
  mr: {
    dashboard: 'डॅशबोर्ड',
    schedule: 'वेळापत्रक',
    subjects: 'विषय',
    exams: 'परीक्षा',
    generate: 'तयार करा',
    settings: 'सेटिंग्ज',
    aiChat: 'AI चॅट',
    goodMorning: 'सप्रभात',
    goodAfternoon: 'शुभ संध्या',
    goodEvening: 'शुभ सायंकाळ',
    daysLeft: 'दिवस शिल्लक',
    chaptersDone: 'अध्याय पूर्ण',
    totalChapters: 'एकूण अध्याय',
    progress: 'प्रगती',
    todaySchedule: 'आजचे वेळापत्रक',
    noSchedule: 'अजून वेळापत्रक तयार झालेले नाही. प्रथम विषय आणि परीक्षा जोडा!',
    weeklyProgress: 'साप्ताहिक प्रगती',
    notifications: 'सूचना',
    enableNotifications: 'सूचना सक्षम करा',
    reminderBefore: 'प्रत्येक सत्रापूर्वी स्मरण करा (मिनिटे)',
    enableNotifBtn: 'सूचना सक्षम करा',
    saveSettings: 'सेटिंग्ज जतन करा',
    studyPlayerAI: 'StudyPlayer AI (Groq API)',
    getApiKey: 'मोफत API की मिळवा',
    groqApiKey: 'Groq API की',
    saveApiKey: 'API की जतन करा',
    dataManagement: 'डेटा व्यवस्थापन',
    exportData: 'डेटा निर्यात',
    importData: 'डेटा आयात',
    resetAllData: 'सर्व डेटा रीसेट करा',
    theme: 'थीम',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    language: 'भाषा',
    english: 'इंग्रजी',
    marathi: 'मराठी',
    subjectsTitle: 'विषय',
    addSubject: 'विषय जोडा',
    examTitle: 'परीक्षा',
    addExam: 'परीक्षा जोडा',
    generateSchedule: 'वेळापत्रक तयार करा',
    calendarExport: 'कॅलेंडर निर्यात',
    exportPdf: 'PDF निर्यात',
    exportIcs: 'कॅलेंडर निर्यात (.ics)',
    studyStreak: 'अभ्यास स्ट्रीक',
    currentStreak: 'सध्याची स्ट्रीक',
    bestStreak: 'सर्वोत्तम स्ट्रीक',
    days: 'दिवस',
    day: 'दिवस',
    streakMessage: 'सुरू ठेवा!',
    streakBroken: 'आज नवीन स्ट्रीक सुरू करा!',
    cloudSync: 'क्लाउड सिंक',
    syncToCloud: 'क्लाउडवर सिंक करा',
    restoreFromCloud: 'क्लाउडवरून पुनर्संचयित करा',
    pushNotifications: 'पुश सूचना',
    enablePush: 'पुश सक्षम करा',
  }
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = useCallback((newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}