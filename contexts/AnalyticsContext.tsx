'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AnalyticsData {
  totalProjects: number
  totalViews: number
  totalLikes: number
  totalCollaborators: number
  monthlyGrowth: {
    projects: number
    views: number
    likes: number
    collaborators: number
  }
  projectsByCategory: { name: string; value: number; color: string }[]
  activityData: { date: string; projects: number; views: number; likes: number }[]
  topDesigns: { id: string; title: string; views: number; likes: number; thumbnail: string }[]
  userEngagement: { metric: string; current: number; previous: number; change: number }[]
}

interface AnalyticsContextType {
  analyticsData: AnalyticsData
  isLoading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
  refreshData: () => Promise<void>
  recordEvent: (eventType: string, projectId?: string) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

const initialAnalyticsData: AnalyticsData = {
  totalProjects: 0,
  totalViews: 0,
  totalLikes: 0,
  totalCollaborators: 0,
  monthlyGrowth: {
    projects: 0,
    views: 0,
    likes: 0,
    collaborators: 0,
  },
  projectsByCategory: [
    { name: 'Living Room', value: 0, color: '#3b82f6' },
    { name: 'Bedroom', value: 0, color: '#10b981' },
    { name: 'Kitchen', value: 0, color: '#f59e0b' },
    { name: 'Bathroom', value: 0, color: '#ef4444' },
    { name: 'Office', value: 0, color: '#8b5cf6' },
  ],
  activityData: [],
  topDesigns: [],
  userEngagement: [
    { metric: 'Avg. Session Duration', current: 0, previous: 0, change: 0 },
    { metric: 'Pages per Session', current: 0, previous: 0, change: 0 },
    { metric: 'Bounce Rate', current: 0, previous: 0, change: 0 },
    { metric: 'Return Visitors', current: 0, previous: 0, change: 0 },
  ],
}

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(initialAnalyticsData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  // Initialize SSE connection
  useEffect(() => {
    let sse: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connectToAnalyticsStream = () => {
      try {
        setConnectionStatus('connecting')
        
        // Close existing connection if any
        if (sse) {
          sse.close()
        }

        // Create new SSE connection
        sse = new EventSource('http://localhost:8000/analytics-updates')
        
        sse.onopen = () => {
          console.log('Analytics SSE connection established')
          setConnectionStatus('connected')
          setError(null)
        }

        sse.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('Analytics update received:', data)
            
            if (data.type === 'initial' || data.type === 'analytics_update') {
              if (data.data) {
                setAnalyticsData(data.data)
                setIsLoading(false)
              }
            }
          } catch (parseError) {
            console.error('Error parsing analytics update:', parseError)
          }
        }

        sse.onerror = (error) => {
          console.error('Analytics SSE connection error:', error)
          setConnectionStatus('disconnected')
          setError('Failed to connect to analytics stream')
          
          // Close the failed connection
          if (sse) {
            sse.close()
          }
          
          // Attempt to reconnect after 5 seconds
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect to analytics stream...')
            connectToAnalyticsStream()
          }, 5000)
        }

        setEventSource(sse)
      } catch (error) {
        console.error('Error establishing analytics SSE connection:', error)
        setConnectionStatus('disconnected')
        setError('Failed to establish analytics connection')
      }
    }

    connectToAnalyticsStream()

    // Cleanup function
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (sse) {
        sse.close()
      }
    }
  }, [])

  const refreshData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Force a reconnection to get fresh data
      if (eventSource) {
        eventSource.close()
      }
      
      // Create a temporary connection to refresh data
      const tempSse = new EventSource('http://localhost:8000/analytics-updates')
      
      tempSse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'initial' && data.data) {
            setAnalyticsData(data.data)
            setIsLoading(false)
            tempSse.close()
          }
        } catch (parseError) {
          console.error('Error parsing refresh data:', parseError)
        }
      }

      tempSse.onerror = () => {
        tempSse.close()
        setError('Failed to refresh analytics data')
        setIsLoading(false)
      }

      // Close the temporary connection after 10 seconds
      setTimeout(() => {
        tempSse.close()
      }, 10000)
    } catch (error) {
      console.error('Error refreshing analytics data:', error)
      setError('Failed to refresh analytics data')
      setIsLoading(false)
    }
  }

  const recordEvent = (eventType: string, projectId?: string) => {
    // This would typically send an API request to record the event
    // For now, we'll just log it
    console.log(`Recording analytics event: ${eventType}${projectId ? ` for project ${projectId}` : ''}`)
    
    // In a real implementation, you would send this to your backend
    // fetch('/api/analytics/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ type: eventType, projectId })
    // })
  }

  const value: AnalyticsContextType = {
    analyticsData,
    isLoading,
    error,
    connectionStatus,
    refreshData,
    recordEvent,
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}