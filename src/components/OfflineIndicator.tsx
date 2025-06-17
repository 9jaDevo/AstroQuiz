import React from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'

export default function OfflineIndicator() {
  const { isOnline } = usePWA()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg border border-red-400/30 flex items-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">You're offline</span>
      </div>
    </div>
  )
}

export function OnlineIndicator() {
  const { isOnline } = usePWA()
  const [showConnected, setShowConnected] = React.useState(false)

  React.useEffect(() => {
    if (isOnline) {
      setShowConnected(true)
      const timer = setTimeout(() => setShowConnected(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  if (!showConnected) {
    return null
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-green-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg border border-green-400/30 flex items-center space-x-2 animate-slide-down">
        <Wifi className="h-4 w-4" />
        <span className="text-sm font-medium">Back online</span>
      </div>
    </div>
  )
}