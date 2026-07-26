import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { I18nProvider } from './context/I18nContext'

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <I18nProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </I18nProvider>
  </ThemeProvider>,
)