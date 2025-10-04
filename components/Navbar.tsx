"use client"

import Image from 'next/image'
import Link from 'next/link'
import { User, History, LogOut, ChevronDown, LayoutDashboard, Calendar, Clock, UserCircle, CalendarDays } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthService } from '@/lib/auth-service'

export default function Navbar(){
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ email: string; role?: string; firstName?: string | null; lastName?: string | null } | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const pathname = usePathname()

  // Check if we're on homepage
  const isHomePage = pathname === '/'

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('user')
      const token = AuthService.getToken()
      
      if (savedUser && token) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsLoggedIn(true)
      } else {
        setIsLoggedIn(false)
        setUser(null)
      }
    }

    checkAuth()
    
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuth)
    
    return () => {
      window.removeEventListener('storage', checkAuth)
    }
  }, [])

  // Logout function
  const handleLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
    AuthService.removeToken()
    sessionStorage.removeItem('bookingDraft')
    setShowDropdown(false)
    // Refresh page to update state
    window.location.reload()
  }

  // Helper function to get display name
  const getDisplayName = () => {
    if (!user) return 'Profile';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    } else {
      return user.email.split('@')[0]; // Use email username as fallback
    }
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
            // Profile Dropdown when logged in
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100/60 backdrop-blur-sm rounded-xl border border-emerald-200/60 hover:bg-emerald-200/60 transition-colors"
              >
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-emerald-800 font-medium truncate max-w-32">
                  {getDisplayName()}
                </span>
                <ChevronDown className="w-4 h-4 text-emerald-600" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-emerald-200/60 py-2 z-50">
                  <div className="px-4 py-2 border-b border-emerald-100">
                    <p className="text-sm text-emerald-600">เข้าสู่ระบบเป็น</p>
                    <p className="text-emerald-800 font-medium truncate">{user?.email}</p>
                    {user?.role && (
                      <p className="text-xs text-emerald-600 mt-1">Role: {user.role}</p>
                    )}
                    {(!user?.firstName || !user?.lastName) && (
                      <p className="text-xs text-amber-600 mt-1">
                        💡 เพิ่มชื่อ-นามสกุลในโปรไฟล์
                      </p>
                    )}
                  </div>
                  
                  {/* Role-based navigation */}
                  {user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-emerald-700"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}

                  {user?.role === 'DOCTOR' && (
                    <>
                      <Link
                        href="/doctor-dashboard"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-emerald-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>แดชบอร์ด</span>
                      </Link>
                      <Link
                        href="/doctor-appointments"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-emerald-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>นัดหมายทั้งหมด</span>
                      </Link>
                      <Link
                        href="/doctor-calendar"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-emerald-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        <CalendarDays className="w-4 h-4" />
                        <span>ปฏิทิน</span>
                      </Link>
                      <Link
                        href="/doctor-schedule"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-emerald-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Clock className="w-4 h-4" />
                        <span>เวลาทำงาน</span>
                      </Link>
                      <Link
                        href="/doctor-profile"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-emerald-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        <UserCircle className="w-4 h-4" />
                        <span>โปรไฟล์</span>
                      </Link>
                    </>
                  )}

                  {user?.role === 'PATIENT' && (
                    <>
                      <Link
                        href="/patient-profile"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-emerald-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        <UserCircle className="w-4 h-4" />
                        <span>โปรไฟล์</span>
                      </Link>
                      <Link
                        href="/History"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-emerald-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        <History className="w-4 h-4" />
                        <span>History</span>
                      </Link>
                    </>
                  )}
                  
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
            // Login/Register Buttons only on homepage when not logged in
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
    </nav>
  )
}