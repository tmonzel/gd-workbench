import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/geist-sans/100.css'
import '@fontsource/geist-sans/200.css'
import '@fontsource/geist-sans/300.css'
import '@fontsource/geist-sans/400.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/geist-sans/700.css'
import '@fontsource/libertinus-sans/400.css'
import '@fontsource/libertinus-sans/400-italic.css'
import '@fontsource/libertinus-sans/700.css'
import './index.css'
import App from '@/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
