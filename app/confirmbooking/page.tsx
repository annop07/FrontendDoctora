'use client';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { AppointmentService } from "@/lib/appointment-service";
import { useAuth } from "@/context/auth-context";
import {
  CheckCircle, User, Calendar, Clock, Stethoscope,
  FileCheck, ArrowLeft, Download, Phone, Mail, CreditCard, Globe, FileText
} from "lucide-react";

// Add Thai font support
import "jspdf/dist/polyfills.es.js";

interface PatientData {
  prefix?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dob?: string;
  nationality?: string;
  citizenId?: string;
  phone?: string;
  email?: string;
}

// ✅ แก้ไขฟังก์ชันนี้ให้แสดงข้อความที่ถูกต้อง
function mapBookingTypeLabel(val?: string) {
  if (!val) return "-";
  const map: Record<string, string> = {
    auto: "เลือกแพทย์ให้ฉัน",
    manual: "ฉันต้องการเลือกแพทย์เอง",
  };
  return map[val] || val;
}

// 🔑 คีย์กลางของ draft ใน sessionStorage
const DRAFT_KEY = "bookingDraft";

export default function ConfirmPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientData>({});
  const [depart, setDepart] = useState("");
  
  // ✅ แยกเป็น 2 ตัวแปร
  const [bookingType, setBookingType] = useState("");  // 'auto' หรือ 'manual'
  const [symptoms, setSymptoms] = useState("");  // อาการจริงๆ
  
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");
  const [doctor, setDoctor] = useState("");
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [queue, setQueue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  
  // ✅ เพิ่ม state สำหรับเก็บข้อมูลแพทย์ที่ดึงมา
  const [loadingDoctor, setLoadingDoctor] = useState(false);

  const getNextQueue = () => {
    const lastQueue = parseInt(localStorage.getItem("lastQueue") || "0", 10);
    const nextQueue = lastQueue + 1;
    localStorage.setItem("lastQueue", String(nextQueue));
    return String(nextQueue).padStart(3, "0");
  };

  // ✅ โหลดค่าทั้งหมดจาก sessionStorage
  useEffect(() => {
    const patientData = JSON.parse(sessionStorage.getItem("patientData") || "{}");
    const bookingData = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}");

    setPatient(patientData);
    setDepart(bookingData.depart || "");

    // ✅ โหลด bookingType และ symptoms แยกกัน
    setBookingType(bookingData.bookingType || "");
    setSymptoms(bookingData.symptoms || "");

    setDoctor(bookingData.selectedDoctor || "");
    setDoctorId(bookingData.selectedDoctorId || null);

    if (bookingData.selectedDate) {
      const d = new Date(bookingData.selectedDate);
      setSelectedDate(isNaN(+d) ? String(bookingData.selectedDate) : d.toLocaleDateString("th-TH"));
    }
    setSelectedTime(bookingData.selectedTime || "");

    setQueue(getNextQueue());
    
    // ✅ ถ้าเป็นโหมด auto ให้ดึงข้อมูลแพทย์มาแสดง
    if (bookingData.bookingType === 'auto' && bookingData.depart && bookingData.selectedDate) {
      fetchDoctorForAutoMode(bookingData.depart, bookingData.selectedDate);
    }
  }, []);

  // ✅ ฟังก์ชันสำหรับดึงข้อมูลแพทย์ในโหมด auto
  const fetchDoctorForAutoMode = async (specialty: string, date: string) => {
    try {
      setLoadingDoctor(true);
      
      // แปลง date เป็น format YYYY-MM-DD
      let dateStr = date;
      if (date.includes('T')) {
        dateStr = date.split('T')[0];
      }
      
      console.log('🔵 Fetching doctor for auto mode:', { specialty, date: dateStr });
      
      const response = await fetch(
        `http://localhost:8082/api/doctors/smart-select?specialty=${encodeURIComponent(specialty)}&date=${dateStr}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.doctor && data.doctor.doctorName) {
          console.log('✅ Got doctor:', data.doctor.doctorName);
          setDoctor(data.doctor.doctorName);
          setDoctorId(data.doctor.id);
          
          // อัปเดตใน sessionStorage
          const bookingData = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
          bookingData.selectedDoctor = data.doctor.doctorName;
          bookingData.selectedDoctorId = data.doctor.id;
          sessionStorage.setItem(DRAFT_KEY, JSON.stringify(bookingData));
        } else {
          console.warn('⚠️ No doctor available');
          setDoctor('กำลังจัดหาแพทย์...');
        }
      } else {
        console.error('❌ Failed to fetch doctor');
        setDoctor('กำลังจัดหาแพทย์...');
      }
    } catch (error) {
      console.error('❌ Error fetching doctor:', error);
      setDoctor('กำลังจัดหาแพทย์...');
    } finally {
      setLoadingDoctor(false);
    }
  };

  const createPDFFromCanvas = async (canvas: HTMLCanvasElement, queueNumber: string) => {
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      pdf.addFont('/fonts/THSarabunNew.ttf', 'THSarabunNew', 'normal');
      pdf.setFont('THSarabunNew');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2);

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const widthRatio = maxWidth / (imgWidth * 0.264583);
      const heightRatio = maxHeight / (imgHeight * 0.264583);
      const ratio = Math.min(widthRatio, heightRatio);

      const scaledWidth = imgWidth * 0.264583 * ratio;
      const scaledHeight = imgHeight * 0.264583 * ratio;

      const x = (pageWidth - scaledWidth) / 2;
      const y = margin;

      const imgData = canvas.toDataURL("image/png", 1.0);
      pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);

      pdf.save(`Booking_${queueNumber}.pdf`);
      return true;
    } catch (error) {
      console.error('PDF Canvas Error:', error);
      return false;
    }
  };

  const createTextBasedPDF = (queueNumber: string) => {
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

      try {
        pdf.addFont('/fonts/THSarabunNew.ttf', 'THSarabunNew', 'normal');
        pdf.setFont('THSarabunNew');
      } catch {
        pdf.setFont("helvetica", "normal");
      }

      let y = 25;

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(40, 107, 129);
      pdf.text("doctora", 105, y, { align: "center" });
      y += 15;

      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text("ใบยืนยันการนัดหมาย", 105, y, { align: "center" });
      pdf.text("APPOINTMENT CONFIRMATION", 105, y + 7, { align: "center" });
      y += 25;

      // Queue box
      pdf.setFillColor(240, 248, 255);
      pdf.rect(20, y - 8, 170, 15, 'F');
      pdf.setFontSize(14);
      pdf.setTextColor(40, 107, 129);
      pdf.text(`หมายเลขคิว / Queue Number: ${queueNumber}`, 25, y, { align: "left" });
      y += 20;

      // Patient info
      pdf.setFontSize(14);
      pdf.setTextColor(40, 107, 129);
      pdf.text("ข้อมูลผู้ป่วย / PATIENT INFORMATION", 20, y);
      y += 3;
      pdf.setLineWidth(0.5);
      pdf.line(20, y, 190, y);
      y += 10;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);

      const patientFields: [string, string][] = [
        [`คำนำหน้า / Prefix`, patient.prefix || "-"],
        [`ชื่อ / First Name`, patient.firstName || "-"],
        [`นามสกุล / Last Name`, patient.lastName || "-"],
        [`เพศ / Gender`, patient.gender || "-"],
        [`วัน/เดือน/ปีเกิด / Date of Birth`, patient.dob || "-"],
        [`สัญชาติ / Nationality`, patient.nationality || "-"],
        [`เลขบัตรประชาชน / ID Number`, patient.citizenId || "-"],
        [`เบอร์ติดต่อ / Phone`, patient.phone || "-"],
        [`อีเมล / Email`, patient.email || "-"]
      ];

      patientFields.forEach(([label, value]) => {
        const text = `${label}: ${value}`;
        const lines = pdf.splitTextToSize(text, 170);
        pdf.text(lines, 25, y);
        y += lines.length * 6;
      });

      y += 10;

      // Appointment details
      pdf.setFontSize(14);
      pdf.setTextColor(40, 107, 129);
      pdf.text("รายละเอียดการนัดหมาย / APPOINTMENT DETAILS", 20, y);
      y += 3;
      pdf.line(20, y, 190, y);
      y += 10;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);

      const appointmentFields: [string, string][] = [
        [`แผนก / Department`, depart || "-"],
        [`ประเภทการจอง / Booking Type`, mapBookingTypeLabel(bookingType)],
        [`แพทย์ / Doctor`, doctor || "-"],
        [`วันที่และเวลา / Date & Time`, `${selectedDate} ${selectedTime}`]
      ];

      // ✅ เพิ่มอาการถ้ามี
      if (symptoms) {
        appointmentFields.push([`อาการ / Symptoms`, symptoms]);
      }

      appointmentFields.forEach(([label, value]) => {
        const text = `${label}: ${value}`;
        const lines = pdf.splitTextToSize(text, 170);
        pdf.text(lines, 25, y);
        y += lines.length * 6;
      });

      // Footer
      y += 20;
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text("กรุณานำใบยืนยันนี้มาแสดงในวันนัดหมาย", 105, y, { align: "center" });
      pdf.text("Please bring this confirmation on your appointment date", 105, y + 5, { align: "center" });

      pdf.save(`Booking_${queueNumber}.pdf`);
      return true;
    } catch (error) {
      console.error('PDF Text Error:', error);
      return false;
    }
  };

  const exportPDF = async (queueNumber: string) => {
    try {
      setIsLoading(true);

      const originalElement = document.getElementById("booking-confirm");
      if (!originalElement) {
        alert("ไม่พบข้อมูลที่จะสร้าง PDF");
        return false;
      }

      const element = originalElement.cloneNode(true) as HTMLElement;

      // add logo
      const logoDiv = document.createElement('div');
      logoDiv.innerHTML = `
        <div style="text-align: center; font-size: 28px; font-weight: bold; color: #286B81; margin-bottom: 20px; font-family: 'Sarabun', Arial, sans-serif;">
          doctora
        </div>
      `;
      element.insertBefore(logoDiv, element.firstChild);

      // remove buttons
      const buttons = element.querySelector('.button-container') as HTMLElement;
      if (buttons) buttons.remove();

      // style for canvas
      element.style.position = 'absolute';
      element.style.top = '-9999px';
      element.style.left = '-9999px';
      element.style.width = (originalElement as HTMLElement).offsetWidth + 'px';
      element.style.backgroundColor = 'white';
      element.style.padding = '30px';
      element.style.fontFamily = "'Sarabun', 'Noto Sans Thai', Arial, sans-serif";
      element.style.fontSize = '14px';
      element.style.lineHeight = '1.6';
      document.body.appendChild(element);

      await new Promise(r => setTimeout(r, 500));

      try {
        const canvas = await html2canvas(element, {
          scale: 3,
          backgroundColor: '#ffffff',
          width: element.scrollWidth,
          height: element.scrollHeight,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: true
        });

        document.body.removeChild(element);
        return await createPDFFromCanvas(canvas, queueNumber);
      } catch (canvasError) {
        console.error('Canvas Error:', canvasError);
        document.body.removeChild(element);
        return createTextBasedPDF(queueNumber);
      }
    } catch (error) {
      console.error('Export Error:', error);
      return createTextBasedPDF(queueNumber);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      setBookingError("");

      // Check authentication
      if (!user) {
        setBookingError("กรุณาเข้าสู่ระบบก่อนทำการจอง");
        return;
      }

      // Get booking data
      const bookingData = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
      let finalDoctorId = doctorId;

      // ✅ Validate และจัดการ doctorId สำหรับทั้ง 2 โหมด
      if (!finalDoctorId || finalDoctorId === -1) {
        if (bookingData.bookingType === 'auto') {
          // ✅ โหมด auto: เรียก smart-select API พร้อมวันที่ที่เลือก
          console.log('🔵 Auto mode: Getting doctor via smart-select with date');
          
          try {
            const specialty = bookingData.depart;
            const dateStr = bookingData.selectedDate?.split('T')[0] || 
                            new Date(bookingData.selectedDate).toISOString().split('T')[0];
            
            // ✅ เรียก smart-select พร้อมวันที่
            const apiUrl = `http://localhost:8082/api/doctors/smart-select?specialty=${encodeURIComponent(specialty)}&date=${dateStr}`;
            
            console.log('🔍 Smart-select URL:', apiUrl);
            
            const response = await fetch(apiUrl);
            
            if (response.ok) {
              const data = await response.json();
              if (data.doctor && data.doctor.id) {
                finalDoctorId = data.doctor.id;
                console.log('✅ Got doctor from smart-select:', finalDoctorId, data.doctor.doctorName);
                console.log('📊 Available time:', data.availableHours, 'hours');
                
                // อัปเดต doctor name เป็นชื่อจริงที่ได้จาก API
                setDoctor(data.doctor.doctorName);
              } else {
                setBookingError("ขออภัย ไม่มีแพทย์ว่างในวันที่เลือก กรุณาเลือกวันอื่น");
                return;
              }
            } else {
              setBookingError("ไม่สามารถเลือกแพทย์ได้ กรุณาลองใหม่อีกครั้ง");
              return;
            }
          } catch (error) {
            console.error('Error calling smart-select:', error);
            setBookingError("เกิดข้อผิดพลาดในการเลือกแพทย์");
            return;
          }
        } else {
          // ✅ โหมด manual: ต้องมี doctorId
          setBookingError("ข้อมูลแพทย์ไม่ครบถ้วน กรุณาเริ่มการจองใหม่");
          return;
        }
      }

      // Validate patient data
      if (!patient.firstName || !patient.lastName) {
        setBookingError("ข้อมูลผู้ป่วยไม่ครบถ้วน");
        return;
      }

      // Get patient data from sessionStorage
      const patientData = JSON.parse(sessionStorage.getItem("patientData") || '{}');

      // Final validation to ensure finalDoctorId is not null
      if (!finalDoctorId) {
        setBookingError("ไม่พบข้อมูลแพทย์ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      // Prepare API request
      const appointmentRequest = AppointmentService.convertBookingDataToRequest(
        bookingData,
        patientData,
        finalDoctorId  // ✅ ใช้ finalDoctorId ที่ได้จาก smart-select (ถ้าเป็นโหมด auto)
      );

      console.log('Sending appointment request:', appointmentRequest);

      // Call API to create appointment
      const response = await AppointmentService.createAppointmentWithPatientInfo(appointmentRequest);

      console.log('Appointment created:', response);

      // Update queue number from server response
      if (response.patientInfo?.queueNumber) {
        setQueue(response.patientInfo.queueNumber);
      }

      // Save booking history locally (optional - for offline viewing)
      if (user.email) {
        const bookingRecord = {
          id: response.appointment.id,
          queueNumber: response.patientInfo?.queueNumber || queue,
          patientName: `${patient.prefix} ${patient.firstName} ${patient.lastName}`,
          doctorName: doctor || response.appointment.doctor.doctorName,
          department: depart || response.appointment.doctor.specialty.name,
          bookingType: mapBookingTypeLabel(bookingType),
          symptoms: symptoms,
          date: selectedDate,
          time: selectedTime,
          status: AppointmentService.getStatusText(response.appointment.status),
          statusColor: AppointmentService.getStatusColor(response.appointment.status),
          createdAt: response.appointment.createdAt,
          userEmail: user.email,
          appointmentId: response.appointment.id
        };

        const historyKey = `bookingHistory_${user.email}`;
        const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
        existingHistory.push(bookingRecord);
        localStorage.setItem(historyKey, JSON.stringify(existingHistory));
      }

      // Generate and download PDF
      await new Promise(resolve => setTimeout(resolve, 500));
      const success = await exportPDF(response.patientInfo?.queueNumber || queue);

      if (success) {
        // Clear session data
        sessionStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem("patientData");

        // Redirect to finish page
        setTimeout(() => router.push("/finishbooking"), 1000);
      }

    } catch (error: any) {
      console.error('Booking error:', error);
      setBookingError(error.message || "เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />

      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">ยืนยันการนัดหมาย</h1>
              <p className="text-green-100 mt-1">กรุณาตรวจสอบข้อมูลของคุณก่อนยืนยัน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden"
          id="booking-confirm"
        >
          {/* Queue Number Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-6">
            <div className="flex items-center justify-center space-x-3">
              <FileCheck className="w-8 h-8 text-white" />
              <div className="text-center">
                <h2 className="text-white text-lg font-medium">หมายเลขคิว</h2>
                <p className="text-white text-3xl font-bold">{queue}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Patient Information */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-6">
                <User className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-gray-800">ข้อมูลผู้ป่วย</h3>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">ชื่อ-นามสกุล</p>
                      <p className="font-semibold text-gray-800">
                        {patient.prefix} {patient.firstName || "-"} {patient.lastName || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">เพศ</p>
                      <p className="font-semibold text-gray-800">{patient.gender || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">วันเกิด</p>
                      <p className="font-semibold text-gray-800">{patient.dob || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">สัญชาติ</p>
                      <p className="font-semibold text-gray-800">{patient.nationality || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">เลขบัตรประชาชน</p>
                      <p className="font-semibold text-gray-800">{patient.citizenId || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">เบอร์ติดต่อ</p>
                      <p className="font-semibold text-gray-800">{patient.phone || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 md:col-span-2">
                    <Mail className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">อีเมล</p>
                      <p className="font-semibold text-gray-800">{patient.email || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-6">
                <Stethoscope className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-gray-800">รายละเอียดการนัดหมาย</h3>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-6 border border-emerald-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Stethoscope className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">แผนก</p>
                      <p className="font-semibold text-gray-800">{depart || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FileCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">ประเภทการจอง</p>
                      <p className="font-semibold text-gray-800">{mapBookingTypeLabel(bookingType)}</p>
                    </div>
                  </div>

                  {/* ✅ แสดงชื่อแพทย์จริง หรือ loading state */}
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">แพทย์</p>
                      {loadingDoctor ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent"></div>
                          <p className="font-semibold text-gray-600">กำลังค้นหาแพทย์...</p>
                        </div>
                      ) : (
                        <p className="font-semibold text-gray-800">
                          {doctor || "-"}
                        </p>
                      )}
                      {bookingType === 'auto' && !loadingDoctor && doctor && doctor !== 'กำลังจัดหาแพทย์...' && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          ✓ แพทย์ที่มีเวลาว่างมากที่สุด
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">วันและเวลา</p>
                      <p className="font-semibold text-gray-800">{selectedDate} {selectedTime}</p>
                    </div>
                  </div>

                  {/* ✅ แสดงอาการ (ถ้ามี) */}
                  {symptoms && (
                    <div className="flex items-start space-x-3 md:col-span-2">
                      <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">อาการและปัญหาสุขภาพ</p>
                        <p className="font-semibold text-gray-800">{symptoms}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {bookingError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm font-medium">{bookingError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-emerald-100 button-container">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                disabled={isLoading}
              >
                <ArrowLeft className="w-5 h-5" />
                กลับ
              </button>

              <button
                onClick={handleConfirm}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg font-semibold ${
                  isLoading || loadingDoctor
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
                disabled={isLoading || loadingDoctor}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    กำลังสร้าง PDF...
                  </>
                ) : loadingDoctor ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    กำลังค้นหาแพทย์...
                  </>
                ) : (
                  <>
                    ยืนยัน
                    <Download className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}