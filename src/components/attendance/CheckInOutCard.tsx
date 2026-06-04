'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, MapPin, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function CheckInOutCard({ 
  internId, 
  todayRecord, 
  onSuccess 
}: { 
  internId: string | null
  todayRecord: any
  onSuccess: () => void 
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState<string>('')
  const [locLoading, setLocLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      )
      if (!response.ok) throw new Error('Geocoding request failed')
      const data = await response.json()
      
      const addr = data.address
      if (addr) {
        const parts = []
        if (addr.road) parts.push(addr.road)
        if (addr.suburb) parts.push(addr.suburb)
        if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village)
        if (addr.state) parts.push(addr.state)
        if (parts.length > 0) {
          return parts.join(', ')
        }
      }
      return data.display_name || 'Address not found'
    } catch (err) {
      console.error('Reverse geocoding error:', err)
      return 'Address unavailable'
    }
  }

  const startCamera = async () => {
    setShowCamera(true)
    if (!location) {
      getLocation()
    }
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
          videoRef.current.srcObject = stream
        } catch (err) {
          setMessage('Camera access denied.')
          setShowCamera(false)
        }
      }
    }, 100)
  }

  const captureSelfie = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    if (!location) {
      setMessage('Location is required to capture selfie. Please enable GPS.')
      return
    }

    const width = video.videoWidth
    const height = video.videoHeight
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 1. Draw the video frame
    ctx.drawImage(video, 0, 0, width, height)

    // 2. Draw overlay background band (slate-900 with opacity) at the bottom
    // Accommodate 3 lines of text: Time, GPS, and Address
    const barHeight = Math.max(85, Math.floor(height * 0.20))
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
    ctx.fillRect(0, height - barHeight, width, barHeight)

    // 3. Set text properties
    const fontSize = Math.max(10, Math.floor(barHeight * 0.15))
    ctx.font = `600 ${fontSize}px sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    // Format local date and time
    const now = new Date()
    const dateStr = now.toLocaleDateString(undefined, { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
    const timeStr = now.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    })
    
    const paddingLeft = Math.max(15, Math.floor(width * 0.04))
    const lineSpacing = barHeight / 4

    // Draw Date/Time
    ctx.fillText(`🕒 Time: ${dateStr} ${timeStr}`, paddingLeft, height - barHeight + lineSpacing * 1)
    
    // Draw GPS coordinates
    ctx.fillText(`📍 GPS: Lat ${location.lat.toFixed(6)}, Lng ${location.lng.toFixed(6)}`, paddingLeft, height - barHeight + lineSpacing * 2)

    // Draw Address
    const displayAddress = address || 'Address unavailable'
    ctx.fillText(`🏠 Addr: ${displayAddress}`, paddingLeft, height - barHeight + lineSpacing * 3)

    // 4. Convert canvas to blob and upload
    canvas.toBlob(async (blob) => {
      if (!blob || !internId) return
      setLoading(true)
      const path = `attendance-selfies/${internId}/${Date.now()}.jpg`
      const { data: upload } = await supabase.storage.from('attendance-selfies').upload(path, blob)
      if (upload) {
        const { data: { publicUrl } } = supabase.storage.from('attendance-selfies').getPublicUrl(path)
        setSelfieUrl(publicUrl)
      }
      const stream = video.srcObject as MediaStream
      stream?.getTracks().forEach(t => t.stop())
      setShowCamera(false)
      setLoading(false)
    }, 'image/jpeg', 0.85)
  }

  const getLocation = () => {
    setLocLoading(true)
    setMessage('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLocation({ lat, lng })
        setLocLoading(false)

        // Resolve coordinates to a readable address
        setAddressLoading(true)
        getAddressFromCoords(lat, lng).then((addr) => {
          setAddress(addr)
          setAddressLoading(false)
        }).catch(() => {
          setAddressLoading(false)
        })
      },
      (err) => {
        let errMsg = 'Location access denied. Please enable GPS.'
        if (err.code === err.TIMEOUT) {
          errMsg = 'Location request timed out. Please try again.'
        }
        setMessage(errMsg)
        setLocLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // Automatically request location when component mounts
  useEffect(() => {
    getLocation()
  }, [])

  const checkIn = async () => {
    if (!internId || !selfieUrl || !location) return
    setLoading(true)
    const res = await fetch('/api/attendance/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internId, selfieUrl, latitude: location.lat, longitude: location.lng })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Attendance marked successfully!')
      onSuccess()
    } else {
      setMessage(data.error || 'Failed to check in')
    }
    setLoading(false)
  }

  const checkOut = async () => {
    if (!internId) return
    setLoading(true)
    const res = await fetch('/api/attendance/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internId })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Checked out successfully!')
      onSuccess()
    } else {
      setMessage(data.error || 'Failed to check out')
    }
    setLoading(false)
  }

  if (todayRecord && todayRecord.check_out_time) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-slate-100">
          <CheckCircle size={32} className="text-slate-600" />
        </div>
        <p className="text-lg font-semibold text-slate-900">Shift Completed</p>
        <p className="text-sm text-slate-500 mt-1">
          Total Hours: <span className="font-semibold text-slate-700">{todayRecord.total_hours}h</span>
        </p>
      </div>
    )
  }

  if (todayRecord && !todayRecord.check_out_time) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-100">
            <Clock size={32} className="text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-slate-900">You are Checked In</p>
          <p className="text-sm text-slate-500 mt-1">
            Since {new Date(todayRecord.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        
        {message && (
          <p className={`text-sm px-3 py-2 rounded-lg mb-4 text-center ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {message}
          </p>
        )}

        <button
          onClick={checkOut}
          disabled={loading}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Processing...' : 'Check Out Now'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 text-center mb-4">Start Your Shift</h3>
      
      {showCamera ? (
        <div className="space-y-3">
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover rounded-xl bg-slate-100" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* GPS Overlay Badge inside Video Preview */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg text-xs flex flex-col gap-1.5 max-w-[85%] shadow-sm">
              <div className="flex items-center gap-1.5 font-medium">
                {locLoading ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Fetching GPS...</span>
                  </>
                ) : location ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>GPS Active</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>GPS Error</span>
                  </>
                )}
              </div>
              {address && (
                <div className="text-[10px] text-slate-200 font-normal truncate mt-0.5" title={address}>
                  🏠 {address}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={captureSelfie} 
              disabled={loading || !location} 
              className="flex-1 bg-brand text-white py-2 rounded-xl text-sm font-medium hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? 'Processing...' : !location ? 'Waiting for GPS...' : 'Capture'}
            </button>
            <button 
              onClick={() => {
                if (videoRef.current?.srcObject) {
                  const stream = videoRef.current.srcObject as MediaStream
                  stream.getTracks().forEach(t => t.stop())
                }
                setShowCamera(false)
              }} 
              disabled={loading} 
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : selfieUrl ? (
        <div className="text-center space-y-2">
          <img src={selfieUrl} alt="selfie" className="w-24 h-24 object-cover rounded-full mx-auto border-2 border-brand" />
          <p className="text-xs text-brand font-medium">Selfie Stamped & Stored ✓</p>
        </div>
      ) : (
        <button onClick={startCamera} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-brand hover:text-brand transition-colors">
          <Camera size={20} /> Take Selfie
        </button>
      )}

      {/* GPS status on the main card view */}
      {!showCamera && !selfieUrl && (
        <div className="flex flex-col items-center justify-center gap-1.5 text-xs py-1">
          {locLoading ? (
            <span className="text-slate-400 animate-pulse flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              Obtaining GPS location...
            </span>
          ) : location ? (
            <div className="text-center space-y-1 w-full">
              <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5">
                <MapPin size={12} />
                GPS Coordinates Stamped
              </span>
              {address ? (
                <p className="text-slate-500 text-[10px] px-4 font-normal leading-relaxed truncate max-w-full">
                  Mapped to: <span className="font-semibold text-slate-600">{address}</span>
                </p>
              ) : addressLoading ? (
                <p className="text-slate-400 text-[10px] animate-pulse">
                  Resolving physical address...
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-red-500 font-medium flex items-center gap-1">
                ⚠️ GPS Location Access Required
              </span>
              <button onClick={getLocation} className="text-brand hover:underline text-xs font-semibold">
                Click here to retry
              </button>
            </div>
          )}
        </div>
      )}

      {message && (
        <p className={`text-sm px-3 py-2 rounded-lg text-center ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {message}
        </p>
      )}

      <button
        onClick={checkIn}
        disabled={!selfieUrl || !location || loading}
        className="w-full bg-brand text-white py-3 rounded-xl font-medium hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Processing...' : 'Check In'}
      </button>
    </div>
  )
}
