'use client'
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { patientAction } from "@/utils/action";
import { useRouter } from "next/navigation";
import { User, Phone, Mail, Calendar, CreditCard, Globe, ArrowLeft, ArrowRight, UserCheck, AlertTriangle, Shield } from "lucide-react";

const PatientForm = () => {

    const router = useRouter();
    const [consentChecked, setConsentChecked] = useState(false); // state สำหรับเช็ค checkbox

    const backButton = () => {
        router.push("/booking");
    }

    const handleNext = () => {
    const form = document.querySelector("form") as HTMLFormElement;
        if (!form) return;

        // ตรวจสอบว่า form ครบทุก required field
        if (!form.checkValidity()) {
            form.reportValidity(); // แสดงข้อความเตือน
            return;
        }

        const formData = new FormData(form);
        const data: Record<string, string> = {};

        formData.forEach((value, key) => {
            data[key] = value.toString();
        });

        // แปลงวันเกิดจาก พ.ศ. เป็น format yyyy-MM-dd (ค.ศ.)
        if (data.birthDay && data.birthMonth && data.birthYear) {
            const day = data.birthDay.padStart(2, '0');
            const month = data.birthMonth.padStart(2, '0');
            const yearAD = parseInt(data.birthYear) - 543; // แปลง พ.ศ. เป็น ค.ศ.
            data.dob = `${yearAD}-${month}-${day}`;

            // ลบ field แยกออก
            delete data.birthDay;
            delete data.birthMonth;
            delete data.birthYear;
        }

        // เก็บลง sessionStorage
        sessionStorage.setItem("patientData", JSON.stringify(data));

    // ไปหน้าคอนเฟิร์ม
        router.push("/confirmbooking");
  };

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-3">
            <UserCheck className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">ข้อมูลผู้ป่วย</h1>
              <p className="text-green-100 mt-1">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อการจองนัดหมาย</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-emerald-100 p-8">
          <form>
            {/* Personal Information Section */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-6">
                <User className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-800">ข้อมูลส่วนตัว</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* คำนำหน้าและชื่อ */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
                  <div className="flex gap-3">
                    <input 
                      name="prefix" 
                      className="w-32 rounded-xl border-2 border-emerald-200 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" 
                      placeholder="คำนำหน้า" 
                      required 
                    />
                    <input 
                      name="firstName" 
                      placeholder="ชื่อ" 
                      className="flex-1 rounded-xl border-2 border-emerald-200 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" 
                      required 
                      autoComplete="given-name" 
                    />
                    <input 
                      name="lastName" 
                      placeholder="นามสกุล" 
                      className="flex-1 rounded-xl border-2 border-emerald-200 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" 
                      required 
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                {/* เพศ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เพศ</label>
                  <select 
                    name="gender" 
                    className="w-full rounded-xl border-2 border-emerald-200 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" 
                    defaultValue="" 
                    required
                  >
                    <option value="" disabled>เลือกเพศ</option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                {/* วันเกิด */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">วันเกิด (พ.ศ.)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      name="birthDay"
                      className="rounded-xl border-2 border-emerald-200 px-3 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>วัน</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <select
                      name="birthMonth"
                      className="rounded-xl border-2 border-emerald-200 px-3 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>เดือน</option>
                      <option value="1">มกราคม</option>
                      <option value="2">กุมภาพันธ์</option>
                      <option value="3">มีนาคม</option>
                      <option value="4">เมษายน</option>
                      <option value="5">พฤษภาคม</option>
                      <option value="6">มิถุนายน</option>
                      <option value="7">กรกฎาคม</option>
                      <option value="8">สิงหาคม</option>
                      <option value="9">กันยายน</option>
                      <option value="10">ตุลาคม</option>
                      <option value="11">พฤศจิกายน</option>
                      <option value="12">ธันวาคม</option>
                    </select>
                    <select
                      name="birthYear"
                      className="rounded-xl border-2 border-emerald-200 px-3 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>ปี พ.ศ.</option>
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() + 543 - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* สัญชาติ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">สัญชาติ</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-600" />
                    <input 
                      name="nationality" 
                      placeholder="สัญชาติ" 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" 
                      required 
                    />
                  </div>
                </div>

                {/* เลขบัตรประชาชน */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เลขบัตรประชาชน</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-600" />
                    <input 
                      name="citizenId" 
                      placeholder="เลขบัตรประชาชน 13 หลัก" 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" 
                      inputMode="numeric" 
                      pattern="[0-9]{13}" 
                      title="กรอกตัวเลข 13 หลัก" 
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-6">
                <Phone className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-800">ข้อมูลติดต่อ</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* เบอร์โทร */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-600" />
                    <input 
                      name="phone" 
                      placeholder="เบอร์โทรศัพท์" 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" 
                      inputMode="tel" 
                      pattern="[0-9]{9,10}" 
                      title="กรอกตัวเลข 9-10 หลัก" 
                      autoComplete="tel" 
                      required 
                    />
                  </div>
                </div>

                {/* อีเมล */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-600" />
                    <input 
                      name="email" 
                      type="email" 
                      placeholder="อีเมล" 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200" 
                      autoComplete="email" 
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Consent Section */}
            <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-800">ความยินยอม</h3>
              </div>
              
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="consent"
                  className="mt-1 w-5 h-5 text-emerald-600 bg-gray-100 border-emerald-300 rounded focus:ring-emerald-500 focus:ring-2"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  อนุญาตให้มีการเก็บประวัติข้อมูลส่วนตัวและเชื่อมถึงสิทธิการดูแลรักษา
                </span>
              </label>
            </div>

            {/* Warning Section */}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <button 
                type="button"
                onClick={backButton}
                className="flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
              >
                <ArrowLeft className="w-5 h-5" />
                กลับ
              </button>
              
              <button
                type="button"
                disabled={!consentChecked}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg font-semibold ${
                  consentChecked 
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl transform hover:-translate-y-0.5" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                onClick={handleNext}
              >
                ต่อไป
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default PatientForm
