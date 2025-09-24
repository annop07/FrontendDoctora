"use client"

import Image from 'next/image'
import { Stethoscope } from 'lucide-react'

export default function Navbar(){
  return (
    <nav className="w-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-lg px-8 py-4 border-b border-emerald-200/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4">
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
        </div>
        
        {/* Navigation & Info */}
        <div className="flex items-center space-x-8">
          {/* Decorative Elements */}
          <div className="hidden lg:flex items-center gap-3 opacity-30">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse delay-100"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
      </div>
      
      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-300/40 via-green-300/40 to-teal-300/40"></div>
    </nav>
  )
}
