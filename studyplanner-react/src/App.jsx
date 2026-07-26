import { useRef, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { useNotifications } from './hooks/useNotifications';
import { animateToast } from './hooks/useAnimations';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Schedule } from './pages/Schedule';
import { Subjects } from './pages/Subjects';
import { Exams } from './pages/Exams';
import { GenerateSchedule } from './pages/GenerateSchedule';
import { StudyPlayer } from './pages/StudyPlayer';
import { Settings } from './pages/Settings';

function AppContent() {
  const { currentPage, toast } = useApp();
  const toastRef = useRef(null);

  useNotifications();

  useEffect(() => {
    if (toast.visible) animateToast(toastRef.current);
  }, [toast.visible]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'schedule': return <Schedule />;
      case 'subjects': return <Subjects />;
      case 'exams': return <Exams />;
      case 'generate': return <GenerateSchedule />;
      case 'studyplayer': return <StudyPlayer />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Navbar />
      <main style={{flex:1}}>
        {renderPage()}
      </main>
      <BottomNav />
      <div
        ref={toastRef}
        className={`toast ${toast.visible ? 'show' : ''} ${toast.type}`}
        style={{ opacity: toast.visible ? 1 : 0 }}
      >
        {toast.message}
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
