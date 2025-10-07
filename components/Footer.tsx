// components/Footer.tsx
import { Phone, AlertTriangle } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-red-600 to-red-700">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
          <AlertTriangle className="w-6 h-6 text-red-100 animate-pulse" />
          <p className="text-red-50 text-lg font-medium text-center leading-relaxed">
            การนัดหมายนี้ไม่สามารถใช้ในผู้ป่วยฉุกเฉิน หรือนัดหมายแพทย์ในวันเดียวกัน
          </p>
          <AlertTriangle className="w-6 h-6 text-red-100 animate-pulse" />
        </div>
        
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <div className="flex items-center gap-3 bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-400/30">
            <Phone className="w-5 h-5 text-red-100" />
            <div>
              <div className="text-red-100 text-xs opacity-90">ฉุกเฉิน</div>
              <div className="font-bold text-red-50 text-lg">1724</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-400/30">
            <Phone className="w-5 h-5 text-red-100" />
            <div>
              <div className="text-red-100 text-xs opacity-90">โทรศัพท์</div>
              <div className="font-bold text-red-50 text-lg">+66 2310 3000</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}