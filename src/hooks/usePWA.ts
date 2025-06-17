import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isStandalone: boolean
  installPrompt: BeforeInstallPromptEvent | null
}

export function usePWA() {
  const [pwaState, setPWAState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    isStandalone: false,
    installPrompt: null,
  })

  useEffect(() => {
    // Check if app is running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://')

    // Check if app is already installed
    const isInstalled = isStandalone || 
                       localStorage.getItem('pwa-installed') === 'true'

    setPWAState(prev => ({
      ...prev,
      isStandalone,
      isInstalled,
    }))

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('PWA: Install prompt available')
      e.preventDefault()
      setPWAState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e,
      }))
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App installed')
      localStorage.setItem('pwa-installed', 'true')
      setPWAState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
      }))
    }

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('PWA: Back online')
      setPWAState(prev => ({ ...prev, isOnline: true }))
    }

    const handleOffline = () => {
      console.log('PWA: Gone offline')
      setPWAState(prev => ({ ...prev, isOnline: false }))
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const installApp = async (): Promise<boolean> => {
    if (!pwaState.installPrompt) {
      console.warn('PWA: No install prompt available')
      return false
    }

    try {
      await pwaState.installPrompt.prompt()
      const choiceResult = await pwaState.installPrompt.userChoice
      
      console.log('PWA: Install choice:', choiceResult.outcome)
      
      if (choiceResult.outcome === 'accepted') {
        setPWAState(prev => ({
          ...prev,
          isInstallable: false,
          installPrompt: null,
        }))
        return true
      }
      
      return false
    } catch (error) {
      console.error('PWA: Error during installation:', error)
      return false
    }
  }

  const registerForNotifications = async (): Promise<boolean> => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('PWA: Notifications not supported')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      console.log('PWA: Notification permission:', permission)
      return permission === 'granted'
    } catch (error) {
      console.error('PWA: Error requesting notification permission:', error)
      return false
    }
  }

  const showNotification = async (title: string, options?: NotificationOptions): Promise<void> => {
    if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') {
      console.warn('PWA: Cannot show notification')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      })
    } catch (error) {
      console.error('PWA: Error showing notification:', error)
    }
  }

  return {
    ...pwaState,
    installApp,
    registerForNotifications,
    showNotification,
  }
}