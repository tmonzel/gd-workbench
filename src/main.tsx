import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/libertinus-sans/400.css'
import '@fontsource/libertinus-sans/400-italic.css'
import '@fontsource/libertinus-sans/700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
