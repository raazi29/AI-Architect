"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ShoppingBag, MapPin } from "lucide-react"

export default function SmartShopping() {
  // Nearby Shops state
  const [shopCategory, setShopCategory] = useState("commercial.furniture_and_interior")
  const [shopRadius, setShopRadius] = useState(2000)
  const [lat, setLat] = useState<number | ''>('')
  const [lon, setLon] = useState<number | ''>('')
  const [shops, setShops] = useState<any[]>([])
  const [loadingShops, setLoadingShops] = useState(false)
  const [shopsError, setShopsError] = useState<string | null>(null)
  const [placeText, setPlaceText] = useState("")
  const [geocoding, setGeocoding] = useState(false)
  
  // Map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  // Load Leaflet dynamically
  const ensureLeaflet = async () => {
    if ((window as any).L) return (window as any).L
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.onload = () => resolve()
        link.onerror = () => reject()
        document.head.appendChild(link)
      }),
      new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject()
        document.body.appendChild(script)
      })
    ])
    return (window as any).L
  }

  // Initialize/update map when coordinates change
  useEffect(() => {
    const setup = async () => {
      if (lat === '' || lon === '' || !mapContainerRef.current) return
      const L = await ensureLeaflet()
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([lat as number, lon as number], 13)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data © OpenStreetMap contributors, Geoapify'
        }).addTo(mapRef.current)
      } else {
        mapRef.current.setView([lat as number, lon as number], 13, { animate: true })
      }
    }
    setup()
  }, [lat, lon])

  // Update markers when shops change
  useEffect(() => {
    const updateMarkers = async () => {
      if (!mapRef.current) return
      const L = (window as any).L || await ensureLeaflet()
      markersRef.current.forEach((m: any) => m.remove())
      markersRef.current = []
      shops.forEach((s) => {
        if (typeof s.lat === 'number' && typeof s.lon === 'number') {
          const marker = L.marker([s.lat, s.lon]).addTo(mapRef.current)
          marker.bindPopup(`<strong>${s.name || 'Unnamed place'}</strong><br/>${s.address || ''}`)
          markersRef.current.push(marker)
        }
      })
    }
    updateMarkers()
  }, [shops])

  // Fetch nearby shops
  const fetchShops = async () => {
    try {
      if (lat === '' || lon === '') {
        setShopsError("Please provide location")
        return
      }
      setLoadingShops(true)
      setShopsError(null)
      const url = new URL(`${API_BASE_URL}/api/shops`)
      url.searchParams.set("category", shopCategory)
      url.searchParams.set("lat", String(lat))
      url.searchParams.set("lon", String(lon))
      url.searchParams.set("radius", String(shopRadius))
      url.searchParams.set("limit", "20")
      if (placeText.trim()) {
        url.searchParams.set("city_hint", placeText.trim())
      }
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setShops(data.results || [])
    } catch (e) {
      setShopsError("Failed to find nearby shops. Please try again.")
    } finally {
      setLoadingShops(false)
    }
  }

  // Use browser geolocation
  const useMyLocation = () => {
    try {
      if (!navigator.geolocation) {
        setShopsError("Geolocation not supported")
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(6)))
          setLon(Number(pos.coords.longitude.toFixed(6)))
        },
        () => setShopsError("Unable to get your location")
      )
    } catch (_) {
      setShopsError("Unable to get your location")
    }
  }

  // Geocode place name to coordinates
  const geocodeAndSetCoords = async () => {
    try {
      if (!placeText.trim()) {
        setShopsError("Enter a city or area name")
        return
      }
      setGeocoding(true)
      setShopsError(null)
      const url = new URL(`${API_BASE_URL}/api/geocode`)
      url.searchParams.set("text", placeText.trim())
      url.searchParams.set("limit", "1")
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const first = (data?.results || [])[0]
      if (first && typeof first.lat === 'number' && typeof first.lon === 'number') {
        setLat(Number(first.lat.toFixed(6)))
        setLon(Number(first.lon.toFixed(6)))
      } else {
        setShopsError("No matching location found")
      }
    } catch (e) {
      setShopsError("Failed to geocode location. Please try again.")
    } finally {
      setGeocoding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Architect & Interior Design Marketplace</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Find nearby shops using Geoapify Places API with interactive map visualization.
            </p>
          </div>

          {/* Nearby Shops Section */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Find Nearby Shops</h2>
            </div>

            {/* Search Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Location Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input 
                  placeholder="Enter city or area" 
                  value={placeText} 
                  onChange={(e) => setPlaceText(e.target.value)} 
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={geocodeAndSetCoords} 
                    disabled={geocoding}
                    className="flex-1"
                  >
                    {geocoding ? 'Searching…' : 'Search'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={useMyLocation}
                    className="flex-1"
                  >
                    Use My Location
                  </Button>
                </div>
              </div>

              {/* Manual Coordinates */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Coordinates</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="Latitude" 
                    value={lat} 
                    onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))} 
                  />
                  <Input 
                    placeholder="Longitude" 
                    value={lon} 
                    onChange={(e) => setLon(e.target.value === '' ? '' : Number(e.target.value))} 
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={shopCategory} onValueChange={setShopCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial.furniture_and_interior">Furniture & Interior</SelectItem>
                    <SelectItem value="commercial.houseware_and_hardware">Hardware & Houseware</SelectItem>
                    <SelectItem value="commercial.garden">Garden & Outdoor</SelectItem>
                    <SelectItem value="commercial.lighting">Lighting & Electrical</SelectItem>
                    <SelectItem value="commercial.department_store">Department Stores</SelectItem>
                    <SelectItem value="commercial.shopping_mall">Shopping Malls</SelectItem>
                    <SelectItem value="commercial.food_and_drink">Food & Restaurants</SelectItem>
                    <SelectItem value="commercial.supermarket">Supermarkets</SelectItem>
                    <SelectItem value="commercial.marketplace">Marketplaces</SelectItem>
                    <SelectItem value="commercial">All Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Radius */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Radius: {shopRadius}m</label>
                <Slider 
                  value={[shopRadius]} 
                  onValueChange={(v) => setShopRadius(v[0])} 
                  min={500} 
                  max={5000} 
                  step={100} 
                />
                <Button 
                  onClick={fetchShops} 
                  disabled={loadingShops}
                  className="w-full"
                >
                  {loadingShops ? 'Searching...' : 'Find Nearby Shops'}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {shopsError && (
              <div className="text-sm text-red-500 mb-4 p-3 bg-red-50 rounded-lg">
                {shopsError}
              </div>
            )}

            {/* Results Grid */}
            {!loadingShops && shops.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-3">Found {shops.length} shops</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shops.map((s) => (
                    <Card key={s.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{s.name || 'Unnamed place'}</div>
                          <div className="text-xs text-muted-foreground mt-1">{s.address || 'No address'}</div>
                          {s.opening_hours && (
                            <div className="mt-2 text-xs text-green-600">Opening hours available</div>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            {s.map_link && (
                              <a
                                href={s.map_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-700 underline"
                              >
                                View on Map
                              </a>
                            )}
                            {s.search_link && (
                              <a
                                href={s.search_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-700 underline"
                              >
                                Search on Google
                              </a>
                            )}
                          </div>
                        </div>
                        {s.distance != null && (
                          <Badge variant="outline" className="text-xs ml-2">
                            {Math.round(s.distance)}m
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loadingShops && shops.length === 0 && !shopsError && (
              <div className="text-center py-8 text-muted-foreground">
                Enter a location and search to find nearby shops
              </div>
            )}

            {/* Map */}
            <div className="mt-4">
              <div 
                className="h-96 rounded-lg overflow-hidden border border-border" 
                ref={mapContainerRef} 
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
