"use client";

import Image from 'next/image';
import Link from 'next/link';
import { User, History, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    router.push('/');
  };

  return (
    <nav className="w-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-lg px-8 py-4 border-b border-emerald-200/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4">
          <div className="relative bg-emerald-100/60 backdrop-blur-sm rounded-xl p-2 border border-emerald-200/60">
            <Image 
              src="/images/logo.png" 
              alt="Doctora Logo" 
              width={120} 
              height={60}
              className="object-contain h-10 w-auto"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600 bg-clip-text text-transparent">
              Doctora
            </span>
            <span className="text-xs text-emerald-600/80 -mt-1">Healthcare Management</span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100/60 backdrop-blur-sm rounded-xl border border-emerald-200/60">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent"></div>
              <span className="text-emerald-600 text-sm">Loading...</span>
            </div>
          ) : isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100/60 backdrop-blur-sm rounded-xl border border-emerald-200/60 hover:bg-emerald-200/60 transition-colors"
              >
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-emerald-800 font-medium">
                  {user?.firstName || 'Profile'}
                </span>
                <ChevronDown className="w-4 h-4 text-emerald-600" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-emerald-200/60 py-2 z-50">
                  <div className="px-4 py-2 border-b border-emerald-100">
                    <p className="text-sm text-emerald-600">เข้าสู่ระบบเป็น</p>
                    <p className="text-emerald-800 font-medium truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-emerald-500">{user?.email}</p>
                    {user?.role === 'ADMIN' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full mt-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  
                  {user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  
                  <Link
                    href="/dashboard"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2 text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  
                  <Link
                    href="/History"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2 text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    <History className="w-4 h-4" />
                    <span>ประวัติการจอง</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              )}
            </div>
          ) : isHomePage ? (
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500/90 backdrop-blur-sm text-white rounded-xl border border-emerald-400/60 hover:bg-emerald-600/90 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <User className="w-4 h-4" />
              <span className="font-medium">เข้าสู่ระบบ</span>
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
