import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { AppBootstrap } from './AppBootstrap.tsx'
import { initTheme } from './store/themeStore'

initTheme()

// Register service worker immediately so offline install works after first load.
registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new Event('ssc-pwa-offline-ready'))
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppBootstrap />
  </StrictMode>,
)
