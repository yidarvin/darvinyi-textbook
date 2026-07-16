import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Import font packages as module dependencies so Vite fingerprints and emits their
// font files instead of leaving package-relative URLs in the production CSS.
import '@fontsource/inter/latin-300.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '@fontsource/crimson-pro/latin-400.css'
import '@fontsource/crimson-pro/latin-600.css'
import '@fontsource/crimson-pro/latin-400-italic.css'
import 'katex/dist/katex.min.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
