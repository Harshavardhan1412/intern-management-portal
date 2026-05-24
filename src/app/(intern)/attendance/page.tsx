'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Camera, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function AttendancePage() {
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [internId, setInternId] = useState<string | null>(null)
  const [todayRecord, setTodayRecord] = useState<any>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('interns').select('id').eq('user_id', user.id).single().then(({ data }) => {
      if (data) { setInternId(data.id); checkToday(data.id) }
    })
  }, [user])

  const checkToday = async (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('attendance').select('*').eq('intern_id', id).eq('date', today).single()
    setTodayRecord(data)
  }

  const startCamera = async () => {
    setShowCamera(true)
    setTimeout(async () => {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        videoRef.current.srcObject = stream
      }
    }, 100)
  }

  const captureSelfie = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    canvas.toBlob(async (blob) => {
      if (!blob || !internId) return
      const path = `attendance-selfies/${internId}/${Date.now()}.jpg`
      const { data: upload } = await supabase.storage.from('attendance-selfies').upload(path, blob)
      if (upload) {
        const { data: { publicUrl } } = supabase.storage.from('attendance-selfies').getPublicUrl(path)
        setSelfieUrl(publicUrl)
      }
      const stream = video.srcObject as MediaStream
      stream?.getTracks().forEach(t => t.stop())
      setShowCamera(false)
    }, 'image/jpeg')
  }

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setMessage('Location access denied. Please enable GPS.')
    )
  }

  const checkIn = async () => {
    if (!internId || !selfieUrl || !location) return
    setLoading(true)
    const { error } = await supabase.from('attendance').insert({
      intern_id: internId,
      date: new Date().toISOString().split('T')[0],
      check_in_time: new Date().toISOString(),
      selfie_url: selfieUrl,
      latitude: location.lat,
      longitude: location.lng,
      status: 'present',
    })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Attendance marked successfully!')
      checkToday(internId)
    }
    setLoading(false)
  }

  if (todayRecord) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Today's Attendance</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${todayRecord.status === 'present' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              {todayRecord.status === 'present' ? <CheckCircle size={32} className="text-emerald-600" /> : <Clock size={32} className="text-amber-600" />}
            </div>
            <p className="text-lg font-semibold text-slate-900 capitalize">{todayRecord.status}</p>
            <p className="text-sm text-slate-500 mt-1">Checked in at {new Date(todayRecord.check_in_time).toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-md mx-auto space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Mark Attendance</h2>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          {showCamera ? (
            <div className="space-y-3">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <button onClick={captureSelfie} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">Capture</button>
                <button onClick={() => setShowCamera(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
              </div>
            </div>
          ) : selfieUrl ? (
            <div className="text-center">
              <img src={selfieUrl} alt="selfie" className="w-32 h-32 object-cover rounded-xl mx-auto mb-2" />
              <p className="text-xs text-emerald-600 font-medium">Selfie captured ✓</p>
            </div>
          ) : (
            <button onClick={startCamera} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
              <Camera size={20} /> Take Selfie
            </button>
          )}

          {location ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
              <MapPin size={16} /> Location captured ✓
            </div>
          ) : (
            <button onClick={getLocation} className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600">
              <MapPin size={20} /> Capture Location
            </button>
          )}

          {message && (
            <p className={`text-sm px-3 py-2 rounded-lg ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {message}
            </p>
          )}

          <button
            onClick={checkIn}
            disabled={!selfieUrl || !location || loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Marking...' : 'Check In'}
          </button>
        </div>
      </div>
    </div>
  )
}
