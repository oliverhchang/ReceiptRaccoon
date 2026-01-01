import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Default center (Sunnyvale, CA)
const DEFAULT_CENTER = [37.3688, -122.0363]

export default function SpendingMap({ transactions }) {
  const [geocodedStores, setGeocodedStores] = useState([])
  const [loading, setLoading] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Safety: Wait for mount
  useEffect(() => {
    setMapReady(true)
  }, [])

  // 1. Group Data by Address
  const groupedData = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return {}

    const stats = {}

    transactions.forEach(t => {
      if (!t) return

      const address = t.store_address
      const name = t.store_name || "Unknown Store"

      if (address && typeof address === 'string' && address.trim().length > 5) {
        const key = address.toLowerCase().trim()

        if (!stats[key]) {
          stats[key] = {
            name: name,
            address: address,
            total: 0,
            visits: 0,
            coords: null
          }
        }
        stats[key].total += t.total_amount || 0
        stats[key].visits += 1
      }
    })
    return stats
  }, [transactions])

  // 2. Geocode Addresses (Same logic as before)
  useEffect(() => {
    const fetchCoordinates = async () => {
      const addressesToFind = Object.keys(groupedData)
      if (addressesToFind.length === 0) {
          setGeocodedStores([])
          return
      }

      setLoading(true)
      const results = []

      for (const key of addressesToFind) {
        const item = groupedData[key]

        try {
          // Check Local Storage
          let cachedCoords = null
          try {
             const cached = localStorage.getItem(`geo_${key}`)
             if (cached) cachedCoords = JSON.parse(cached)
          } catch (e) {
             localStorage.removeItem(`geo_${key}`)
          }

          if (cachedCoords && Array.isArray(cachedCoords)) {
            results.push({ ...item, coords: cachedCoords })
          } else {
            // Fetch from API
            await new Promise(r => setTimeout(r, 1000))

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item.address)}`
                )
                if (response.ok) {
                    const data = await response.json()
                    if (data && data.length > 0) {
                        const lat = parseFloat(data[0].lat)
                        const lon = parseFloat(data[0].lon)
                        if (!isNaN(lat) && !isNaN(lon)) {
                            const coords = [lat, lon]
                            localStorage.setItem(`geo_${key}`, JSON.stringify(coords))
                            results.push({ ...item, coords: coords })
                        }
                    }
                }
            } catch (err) {
                console.warn("Geocode fetch failed for", item.address)
            }
          }
        } catch (error) {
          console.error("Geocoding loop error", error)
        }
      }

      setGeocodedStores(results)
      setLoading(false)
    }

    fetchCoordinates()
  }, [groupedData])

  // --- HEATMAP LOGIC ---

  // Radius grows with number of visits
  // Base size 10px, adds 3px per visit (Max cap at 40px to prevent covering the map)
  const getRadius = (visits) => {
    return Math.min(40, 10 + (visits * 3))
  }

  // Color gets "Hotter" the more you visit
  const getColor = (visits) => {
    if (visits >= 10) return "#ef4444" // Red (Hot Spot)
    if (visits >= 5)  return "#f97316" // Orange
    if (visits >= 3)  return "#eab308" // Yellow
    return "#3b82f6"                   // Blue (Rare visit)
  }

  if (!mapReady) return <div style={{height: '500px', background: '#f7fafc', borderRadius: '16px'}}>Loading Map...</div>

  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
      height: '500px',
      position: 'relative',
      zIndex: 0
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
        <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>Visit Frequency Map</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#718096' }}>
                Bigger, redder circles = places you go most often.
            </p>
        </div>
        {loading && <span style={{fontSize: '0.8rem', color: '#718096'}}>Finding locations...</span>}
      </div>

      <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
        <MapContainer
            key={geocodedStores.length}
            center={DEFAULT_CENTER}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {geocodedStores.map((store, index) => (
                <CircleMarker
                    key={`${index}-${store.name}`}
                    center={store.coords}

                    // NEW: Use Visit-based sizing
                    radius={getRadius(store.visits)}

                    // NEW: Use Visit-based coloring
                    fillColor={getColor(store.visits)}
                    color={getColor(store.visits)}

                    weight={1}
                    opacity={1}
                    fillOpacity={0.6}
                >
                    <Popup>
                        <div style={{textAlign: 'center'}}>
                            <strong>{store.name}</strong><br/>
                            <div style={{margin: '5px 0', fontSize: '1.1em', fontWeight: 'bold', color: getColor(store.visits)}}>
                                {store.visits} Visits
                            </div>
                            <span style={{fontSize:'0.9em', color: '#718096'}}>Total Spent: ${store.total.toFixed(0)}</span>
                        </div>
                    </Popup>
                    <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                        {store.name}: {store.visits} visits
                    </Tooltip>
                </CircleMarker>
            ))}
        </MapContainer>
      </div>
    </div>
  )
}