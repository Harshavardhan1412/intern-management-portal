'use client'

import Link from 'next/link'
import { Shield, Users, Building, ArrowRight, GraduationCap, Award, Target, Mail, MapPin } from 'lucide-react'

const loginRoles = [
  { role: 'admin', label: 'Admin', icon: <Shield size={20} />, href: '/login', desc: 'Full system access — manage interns, tasks, evaluations' },
  { role: 'director', label: 'Director', icon: <Building size={20} />, href: '/login', desc: 'Projects & oversight — add projects, approve leaves' },
  { role: 'intern', label: 'Intern', icon: <Users size={20} />, href: '/login', desc: 'Daily workspace — tasks, attendance, leave, files' },
]

const stories = [
  { title: 'Vibe Coding Workshop', desc: 'Aspiring developers, students, and tech enthusiasts came together on March 8, 2026 to explore AI, prompt engineering, LLMs, and modern development tools — making it a memorable and impactful learning experience.', icon: <GraduationCap size={32} />, date: 'March 8, 2026', bg: '/landing-bg.jpeg' },
  { title: 'Anantapur Police AI Hackathon', desc: 'Engineering and management students delivered real solutions to complex policing issues at the Anantapur Police AI Hackathon 2026. SP P. Jagadeesh appreciated every participant for their innovative approach to public safety challenges.', icon: <Award size={32} />, date: '2026', bg: '/police-hackathon.webp' },
  { title: 'Industry Partnerships', desc: 'Live project deployments with partner companies giving interns real-world production experience before graduation — bridging the gap between classroom learning and industry impact.', icon: <Target size={32} />, date: 'Ongoing', bg: '/industry-logo.jpeg' },
]

const stats = [
  { value: '500+', label: 'Interns Trained' },
  { value: '50+', label: 'Live Projects' },
  { value: '15+', label: 'Partner Colleges' },
  { value: '98%', label: 'Placement Rate' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="px-6 py-4 border-b" style={{ backgroundColor: '#0F172A', borderColor: '#1E293B' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: '#14B8A6' }}>I</div>
            <span className="font-bold text-xl tracking-tight text-white">incuxAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-white px-5 py-2 rounded-lg transition-all hover:opacity-90" style={{ backgroundColor: '#14B8A6' }}>Sign In</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden" style={{ backgroundColor: '#0F172A' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/landing-bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5 }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.4), rgba(15,23,42,0.85))' }} />
        <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8" style={{ backgroundColor: 'rgba(20, 184, 166, 0.15)', color: '#2DD4BF' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2DD4BF' }} />
            Intern Management Platform v1.0
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold leading-none tracking-tight text-white mb-6">
            incuxAI
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10" style={{ color: '#94A3B8' }}>
            From onboarding to evaluation — a centralized platform for managing the full lifecycle of interns.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {loginRoles.map((r) => (
              <Link
                key={r.role}
                href={r.href}
                className="group flex items-center gap-3 px-6 py-3.5 rounded-xl text-white font-medium transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ backgroundColor: r.role === 'intern' ? '#14B8A6' : r.role === 'admin' ? '#0EA5E9' : '#8B5CF6' }}
              >
                {r.icon} <span className="hidden sm:inline">{r.label}</span> Login <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: '#64748B' }}>Select your role to sign in</p>
        </div>
      </section>

      <section className="py-16 px-6 border-b" style={{ borderColor: '#E2E8F0' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold" style={{ color: '#14B8A6' }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: '#64748B' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#0F172A' }}>About incuxAI</h2>
            <p className="text-lg max-w-3xl mx-auto" style={{ color: '#64748B' }}>
              incuxAI bridges the gap between academic learning and industry experience. Our structured intern
              management platform ensures every intern gets hands-on project exposure, continuous mentorship,
              and clear performance tracking.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: 'Mission', desc: 'Empower the next generation of tech talent with real-world project experience and structured mentorship.', color: '#14B8A6' },
              { title: 'Vision', desc: 'Build the largest industry-ready intern community in India through quality programs and industry partnerships.', color: '#0EA5E9' },
              { title: 'Values', desc: 'Integrity, innovation, inclusivity — every intern gets equal opportunity to grow and contribute.', color: '#8B5CF6' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border transition-shadow hover:shadow-md" style={{ borderColor: '#E2E8F0' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold mb-4" style={{ backgroundColor: item.color }}>{item.title[0]}</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: item.color }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      <section className="py-20 px-6" style={{ backgroundColor: '#0F172A' }}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Success Stories</h2>
          <p className="text-lg mb-12 max-w-2xl mx-auto" style={{ color: '#94A3B8' }}>
            Milestones achieved by incuxAI interns and the programs that made them possible.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {stories.map((s) => (
              <div key={s.title} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5" style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}>
                {s.bg ? (
                  <div className="h-40 overflow-hidden">
                    <img src={s.bg} alt={s.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center" style={{ backgroundColor: '#1E293B' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: '#14B8A6' }}>I</div>
                      <span className="text-lg font-bold tracking-tight text-white">incuxAI</span>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="mb-3" style={{ color: '#14B8A6' }}>{s.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{s.desc}</p>
                  <p className="text-xs mt-3" style={{ color: '#64748B' }}>{s.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      <footer style={{ backgroundColor: '#0F172A', borderColor: '#1E293B' }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: '#14B8A6' }}>I</div>
                <span className="font-bold text-lg text-white">incuxAI</span>
              </div>
              <p className="text-sm max-w-md" style={{ color: '#94A3B8' }}>
                Empowering the next generation of tech talent through structured internship programs, real-world projects, and continuous mentorship.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
              <div className="space-y-2.5">
                <a href="#" className="block text-sm transition-colors hover:text-teal-500" style={{ color: '#94A3B8' }}>Home</a>
                <a href="#" className="block text-sm transition-colors hover:text-teal-500" style={{ color: '#94A3B8' }}>About</a>
                <a href="#" className="block text-sm transition-colors hover:text-teal-500" style={{ color: '#94A3B8' }}>Programs</a>
                <a href="#" className="block text-sm transition-colors hover:text-teal-500" style={{ color: '#94A3B8' }}>Contact</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Connect</h4>
              <div className="space-y-2.5">
                <a href="#" className="flex items-center gap-2 text-sm transition-colors hover:text-teal-500" style={{ color: '#94A3B8' }}>Twitter / X</a>
                <a href="#" className="flex items-center gap-2 text-sm transition-colors hover:text-teal-500" style={{ color: '#94A3B8' }}>LinkedIn</a>
                <a href="#" className="flex items-center gap-2 text-sm transition-colors hover:text-teal-500" style={{ color: '#94A3B8' }}>Instagram</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ borderColor: '#1E293B', color: '#64748B' }}>
            <p>&copy; 2026 incuxAI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Mail size={12} /> contact@incuxai.com</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> Bangalore, India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
