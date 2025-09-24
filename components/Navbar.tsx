"use client"

import Image from 'next/image'
import Link from 'next/link'
import { User, History, LogOut, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function Navbar(){
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const pathname = usePathname()

  // ตรวจสอบว่าอยู่หน้าแรกหรือไม่
  const isHomePage = pathname === '/'

  // ตรวจสอบสถานะการล็อกอินจาก localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      setIsLoggedIn(true)
    }
  }, [])

  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
    localStorage.removeItem('user')
    sessionStorage.removeItem('bookingDraft')
    setShowDropdown(false)
    // รีเฟรชหน้าเพื่ออัพเดท state ใน component อื่นๆ
    window.location.reload()
  }

  return (
    <nav className="w-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-lg px-8 py-4 border-b border-emerald-200/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-4">
          <div className="relative bg-emerald-100/60 backdrop-blur-sm rounded-xl p-2 border border-emerald-200/60">
            <Image 
              src="/images/logo.png" 
              alt="Doctora Logo" 
              width={120} 
              height={60}
              className="object-contain h-10 w-auto"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-emerald-800 tracking-wide">
              Doctora
            </span>
          </div>
        </Link>
        
        {/* Navigation & Auth Buttons */}
        <div className="flex items-center space-x-6">
          {/* Decorative Elements */}
          <div className="hidden lg:flex items-center gap-3 opacity-30">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse delay-100"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-200"></div>
          </div>

          {/* Auth Section */}
          {isLoggedIn ? (
            // Profile Dropdown เมื่อล็อกอินแล้ว
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100/60 backdrop-blur-sm rounded-xl border border-emerald-200/60 hover:bg-emerald-200/60 transition-colors"
              >
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-emerald-800 font-medium">Profile</span>
                <ChevronDown className="w-4 h-4 text-emerald-600" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-emerald-200/60 py-2 z-50">
                  <div className="px-4 py-2 border-b border-emerald-100">
                    <p className="text-sm text-emerald-600">เข้าสู่ระบบเป็น</p>
                    <p className="text-emerald-800 font-medium truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/History"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-emerald-700"
                    onClick={() => setShowDropdown(false)}
                  >
                    <History className="w-4 h-4" />
                    <span>History</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-red-600 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : isHomePage ? (
            // Login/Register Buttons เฉพาะในหน้าแรกเมื่อยังไม่ล็อกอิน
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-6 py-2 text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Register
              </Link>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-300/40 via-green-300/40 to-teal-300/40"></div>
    </nav>
  )
}
