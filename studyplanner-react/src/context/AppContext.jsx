import { createContext, useContext, useReducer, useCallback, useState } from 'react';
import { useStudyData, getDefaultData } from '../hooks/useStudyData';

const AppContext = createContext();

const initialState = {
  currentPage: 'dashboard',
  viewingDate: new Date().toISOString().split('T')[0]
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_VIEWING_DATE':
      return { ...state, viewingDate: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const { data, updateData } = useStudyData();
  const [appState, dispatch] = useReducer(appReducer, initialState);
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(v => ({ ...v, visible: false })), 3000);
  }, []);

  const navigateTo = useCallback((page) => {
    dispatch({ type: 'SET_PAGE', payload: page });
    window.scrollTo(0, 0);
  }, []);

  const setViewingDate = useCallback((date) => {
    dispatch({ type: 'SET_VIEWING_DATE', payload: date });
  }, []);

  const resetAllData = useCallback(() => {
    const defaultData = getDefaultData();
    updateData(defaultData);
    showToast('All data reset');
  }, [updateData, showToast]);

  const value = {
    ...appState,
    data,
    updateData,
    navigateTo,
    setViewingDate,
    showToast,
    resetAllData,
    toast,
    setToast
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
