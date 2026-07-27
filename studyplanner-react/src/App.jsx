import { useRef } from 'react';
import { useApp } from './context/AppContext';
import { useNotifications } from './hooks/useNotifications';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { Schedule } from './pages/Schedule';
import { Subjects } from './pages/Subjects';
import { Exams } from './pages/Exams';
import { GenerateSchedule } from './pages/GenerateSchedule';
import { StudyPlayer } from './pages/StudyPlayer';
import { Settings } from './pages/Settings';
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, background: '#1e293b', color: '#f1f5f9',
          padding: '2rem', fontFamily: 'monospace', fontSize: '0.75rem',
          overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', zIndex: 99999
        }}>
          <h2 style={{color:'#ef4444',marginBottom:'1rem',fontSize:'1rem'}}>App Error</h2>
          <p>{this.state.error.message}</p>
          <p style={{color:'#94a3b8',marginTop:'1rem'}}>{this.state.error.stack}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { currentPage, toast } = useApp();
  const toastRef = useRef(null);

  useNotifications();

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
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}