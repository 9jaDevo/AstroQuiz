import React, { useState } from 'react'
import { Download, X, Smartphone, Monitor, Zap } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [isVisible, setIsVisible] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)

  // Don't show if not installable, already installed, or user dismissed
  if (!isInstallable || isInstalled || !isVisible) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const success = await installApp()
      if (success) {
        setIsVisible(false)
      }
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Remember user dismissed for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 shadow-2xl border border-white/20 backdrop-blur-md">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Install AstroQuiz</h3>
              <p className="text-blue-100 text-sm">Get the full app experience</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 text-blue-100">
            <Zap className="h-4 w-4" />
            <span className="text-sm">Faster loading and offline access</span>
          </div>
          <div className="flex items-center space-x-3 text-blue-100">
            <Smartphone className="h-4 w-4" />
            <span className="text-sm">Native app experience</span>
          </div>
          <div className="flex items-center space-x-3 text-blue-100">
            <Monitor className="h-4 w-4" />
            <span className="text-sm">Works on all devices</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 bg-white text-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            {isInstalling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Installing...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Install</span>
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-3 text-white/80 hover:text-white transition-colors duration-200"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}