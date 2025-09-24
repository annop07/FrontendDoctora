"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react"; 
import Schedule from "@/components/Schedule";
import UploadBox from "@/components/UploadBox";
import { bookingAction } from "@/utils/action";
import { useRouter } from "next/navigation";
import { Clock, Calendar, FileText, Upload, ArrowLeft, ArrowRight, Stethoscope } from "lucide-react";

const DRAFT_KEY = "bookingDraft";


export default function BookingPage() {
  const searchParams = useSearchParams();
  const [depart,setDepart] = useState<string>(searchParams.get("depart") ?? "");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [illness,setIllness] = useState("");

  //เก็บstateตอนกดกลับจากหน้า patientForm
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if(!raw) return;
    const d = JSON.parse(raw);
    if (!depart && d.depart) setDepart(d.depart);
    if (d.selectedTime) setSelectedTime(d.selectedTime);
    if (d.selectedDate) setSelectedDate(new Date(d.selectedDate));
    
    // ไม่ให้ตั้งค่า illness เป็น "auto"
    if (d.illness && d.illness !== "auto") setIllness(d.illness);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
            depart,
            selectedTime,
            selectedDate: selectedDate?.toISOString() ?? null,
            illness,
        })
    );
  }, [depart,selectedTime,selectedDate,illness]);

  const base =
    "w-full h-12 rounded-lg shadow-md p-2 text-left transition-all duration-200 cursor-pointer border-2";
  const active = "bg-emerald-100 border-emerald-500 ring-2 ring-emerald-200 text-emerald-800 font-semibold";
  const normal = "bg-white border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 text-gray-700";

  const morning = ["9:00-10:00", "10:00-11:00", "11:00-12:00"];
  const afternoon = ["12:00-13:00", "13:00-14:00", "14:00-15:00"];

  const handleSelect = (time: string) => {
    setSelectedTime(time);
    console.log("เวลาที่เลือก:", time);
  };

  const router = useRouter();

  const backButton = () =>{
    router.push("/depart");
  }
  
 

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-3">
            <Stethoscope className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">จองนัดหมายแพทย์</h1>
              <p className="text-green-100 mt-1">เลือกวันเวลาที่สะดวกสำหรับคุณ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Badge */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <p className="font-bold text-lg">แผนก{depart}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-emerald-100 p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Calendar Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-800">เลือกวันที่</h2>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6">
                <Schedule onChange={(d)=> setSelectedDate(d ?? null)} />
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-800">เลือกเวลา</h2>
              </div>
              
              {/* Morning Times */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                  ช่วงเช้า
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {morning.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleSelect(time)}
                      className={`${base} ${
                        selectedTime === time ? active : normal
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Afternoon Times */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-6 border border-emerald-100">
                <h3 className="text-lg font-semibold text-teal-800 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-teal-500 rounded-full mr-2"></div>
                  ช่วงบ่าย
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {afternoon.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleSelect(time)}
                      className={`${base} ${
                        selectedTime === time ? active : normal
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form action={bookingAction} className="mt-8 space-y-6">
            <input type="hidden" name="depart" value={depart} />
            <input type="hidden" name="time" value={selectedTime ?? ""} />
            <input type="hidden" name="date" value={selectedDate?.toISOString() ?? ""} />

            {/* Symptom Input */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-800">อาการและปัญหาสุขภาพ</label>
              </div>
              <textarea
                name="illness"
                value={illness === "auto" ? "" : illness}
                onChange={(e) => setIllness(e.target.value)}
                rows={4}
                className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-white/90 backdrop-blur-sm"
                placeholder="กรุณาระบุอาการและปัญหาสุขภาพของคุณโดยละเอียด..."
              />
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-6 h-6 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-800">แนบไฟล์เพิ่มเติม</label>
              </div>
              <div className="bg-emerald-50 rounded-xl border-2 border-dashed border-emerald-300 p-4">
                <UploadBox 
                  name="attachments" 
                  accept="image/*,.pdf" 
                  multiple 
                  onChange={(files) => console.log("ไฟล์ที่อัพโหลด:",files)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-emerald-100">
              <button 
                type="button" 
                onClick={backButton}
                className="flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
              >
                <ArrowLeft className="w-5 h-5" />
                กลับ
              </button>
              
              <button 
                type="submit" 
                className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
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
  );
}
