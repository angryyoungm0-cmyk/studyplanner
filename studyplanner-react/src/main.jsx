import { createRoot } from 'react-dom/client'
import { Component } from 'react'
import './styles/index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { I18nProvider } from './context/I18nContext'

class OuterErrorBoundary extends Component {
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
          position:'fixed',inset:0,background:'#1e293b',color:'#f1f5f9',
          padding:'2rem',fontFamily:'monospace',fontSize:'0.75rem',
          overflow:'auto',whiteSpace:'pre-wrap',wordBreak:'break-all',zIndex:99999
        }}>
          <h2 style={{color:'#ef4444',marginBottom:'1rem',fontSize:'1rem'}}>Startup Error</h2>
          <p>{this.state.error.message}</p>
          <p style={{color:'#94a3b8',marginTop:'1rem'}}>{this.state.error.stack}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <OuterErrorBoundary>
    <ThemeProvider>
      <I18nProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </I18nProvider>
    </ThemeProvider>
  </OuterErrorBoundary>,
)

// Hide loading screen once React mounts
const ls = document.getElementById('loading-screen');
if (ls) ls.style.display = 'none';