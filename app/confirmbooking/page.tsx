'use client';
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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

function mapIllnessLabel(val?: string) {
  if (!val) return "-";
  
  const map: Record<string, string> = {
    "auto": "เลือกแพทย์ให้ฉัน",
    "manual": "ฉันต้องการเลือกแพทย์เอง",
  };
  
  return map[val] || val;
}

export default function ConfirmPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientData>({});
  const [depart, setDepart] = useState("");
  const [illness, setIllness] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");
  const [doctor, setDoctor] = useState("");
  const [queue, setQueue] = useState("001");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const patientData = JSON.parse(sessionStorage.getItem("patientData") || "{}");
    const bookingData = JSON.parse(sessionStorage.getItem("bookingDraft") || "{}");

    setPatient(patientData);
    setDepart(bookingData.depart || "");
    setIllness(bookingData.illness || "");
    setDoctor(bookingData.selectedDoctor || "");
    if (bookingData.selectedDate) {
      const d = new Date(bookingData.selectedDate);
      setSelectedDate(isNaN(+d) ? String(bookingData.selectedDate) : d.toLocaleDateString("th-TH"));
    }
    setSelectedTime(bookingData.selectedTime || "");
  }, []);

  const getNextQueue = () => {
    const lastQueue = parseInt(localStorage.getItem("lastQueue") || "0", 10);
    const nextQueue = lastQueue + 1;
    localStorage.setItem("lastQueue", String(nextQueue));
    return String(nextQueue).padStart(3, "0");
  };

  const createPDFFromCanvas = async (canvas: HTMLCanvasElement, queueNumber: string) => {
    try {
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4",
        compress: true
      });

      // Add Thai font support
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
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4",
        compress: true
      });

      // Try to add Thai font, fallback to default if not available
      try {
        pdf.addFont('/fonts/THSarabunNew.ttf', 'THSarabunNew', 'normal');
        pdf.setFont('THSarabunNew');
      } catch {
        pdf.setFont("helvetica", "normal");
      }

      let y = 25;
      
      // Header with logo
      pdf.setFontSize(24);
      pdf.setTextColor(40, 107, 129); // #286B81
      pdf.text("doctora", 105, y, { align: "center" });
      y += 15;
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text("ใบยืนยันการนัดหมาย", 105, y, { align: "center" });
      pdf.text("APPOINTMENT CONFIRMATION", 105, y + 7, { align: "center" });
      y += 25;

      // Queue number box
      pdf.setFillColor(240, 248, 255);
      pdf.rect(20, y - 8, 170, 15, 'F');
      pdf.setFontSize(14);
      pdf.setTextColor(40, 107, 129);
      pdf.text(`หมายเลขคิว / Queue Number: ${queueNumber}`, 25, y, { align: "left" });
      y += 20;

      // Patient Information Section
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
        // Handle long text wrapping
        const lines = pdf.splitTextToSize(text, 170);
        pdf.text(lines, 25, y);
        y += lines.length * 6;
      });

      y += 10;

      // Appointment Details Section
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
        [`ประเภท / Type`, mapIllnessLabel(illness)],
        [`แพทย์ / Doctor`, doctor || "-"],
        [`วันที่และเวลา / Date & Time`, `${selectedDate} ${selectedTime}`]
      ];

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

      // Add logo and styling
      const logoDiv = document.createElement('div');
      logoDiv.innerHTML = `
        <div style="text-align: center; font-size: 28px; font-weight: bold; color: #286B81; margin-bottom: 20px; font-family: 'Sarabun', Arial, sans-serif;">
          doctora
        </div>
      `;
      element.insertBefore(logoDiv, element.firstChild);

      // Remove buttons
      const buttons = element.querySelector('.button-container') as HTMLElement;
      if (buttons) buttons.remove();

      // Apply Thai font styling
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

      // Wait for fonts to load
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
    const nextQueue = getNextQueue();
    setQueue(nextQueue);
    await new Promise(resolve => setTimeout(resolve, 100));
    const success = await exportPDF(nextQueue);
    if (success) {
      setTimeout(() => router.push("/finishbooking"), 1000);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6 mt-10 rounded-md shadow-2xl bg-white" id="booking-confirm">
        <h2 className="text-center text-2xl font-bold mb-6 text-[#286B81]">ยืนยันการนัด</h2>

        <div className="space-y-6">
          <div>
            <p className="font-semibold text-[#286B81]">หมายเลขคิว</p>
            <p className="text-lg">{queue}</p>
          </div>

          <div>
            <p className="font-semibold text-[#286B81]">ข้อมูลผู้ป่วย</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <p>ชื่อ : {patient.prefix} {patient.firstName || "-"}</p>
              <p>นามสกุล : {patient.lastName || "-"}</p>
              <p>เพศ : {patient.gender || "-"}</p>
              <p>วัน/เดือน/ปีเกิด : {patient.dob || "-"}</p>
              <p>สัญชาติ : {patient.nationality || "-"}</p>
              <p>เลขบัตรประชาชน : {patient.citizenId || "-"}</p>
              <p>เบอร์ติดต่อ : {patient.phone || "-"}</p>
              <p>Email : {patient.email || "-"}</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="font-semibold text-[#286B81]">รายละเอียดการทำนัด</p>
            <div className="mt-4 space-y-2">
              <p>แผนก : {depart || "-"}</p>
              <p>ประเภท : {mapIllnessLabel(illness)}</p>
              <p>หมอ : {doctor || "-"}</p>
              <p>วันและเวลา : {selectedDate} {selectedTime}</p>
            </div>
          </div>

          <div className="flex justify-center mt-6 gap-4 button-container">
            <button
              onClick={() => router.back()}
              className="w-40 h-10 bg-sky-200 text-cyan-700 font-extrabold rounded-md hover:bg-sky-300 transition-colors"
              disabled={isLoading}
            >
              กลับ
            </button>

            <button
              onClick={handleConfirm}
              className="w-40 h-10 bg-cyan-600 text-white font-extrabold rounded-md hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "กำลังสร้าง PDF..." : "ยืนยัน"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
