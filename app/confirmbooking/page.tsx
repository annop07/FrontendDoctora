'use client';
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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

export default function ConfirmPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientData>({});
  const [depart, setDepart] = useState("");
  const [illness, setIllness] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");
  const [queue, setQueue] = useState("001");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const patientData = JSON.parse(sessionStorage.getItem("patientData") || "{}");
    const bookingData = JSON.parse(sessionStorage.getItem("bookingDraft") || "{}");

    setPatient(patientData);
    setDepart(bookingData.depart || "");
    setIllness(bookingData.illness || "");
    if (bookingData.selectedDate) {
      setSelectedDate(new Date(bookingData.selectedDate).toLocaleDateString("th-TH"));
    }
    setSelectedTime(bookingData.selectedTime || "");
  }, []);

  const getNextQueue = () => {
    const lastQueue = parseInt(localStorage.getItem("lastQueue") || "0", 10);
    const nextQueue = lastQueue + 1;
    localStorage.setItem("lastQueue", String(nextQueue));
    return String(nextQueue).padStart(3, "0");
  };

  const exportPDF = async (queueNumber: string) => {
    try {
      setIsLoading(true);
      console.log("เริ่มสร้าง PDF...");
      
      const originalElement = document.getElementById("booking-confirm");
      if (!originalElement) {
        console.error("ไม่พบ element ที่มี id booking-confirm");
        alert("ไม่พบข้อมูลที่จะสร้าง PDF");
        return false;
      }
  
      // สร้างสำเนาของ element สำหรับ PDF โดยไม่กระทบหน้าจอเดิม
      const element = originalElement.cloneNode(true) as HTMLElement;
      
      // เพิ่มโลโก้ลงในสำเนา
      const logoDiv = document.createElement('div');
      logoDiv.innerHTML = '<div style="text-align: center; font-size: 28px; font-weight: bold; color: #286B81; margin-bottom: 20px;">doctora</div>';
      element.insertBefore(logoDiv, element.firstChild);
  
      // ลบปุ่มออกจากสำเนา
      const buttons = element.querySelector('.button-container') as HTMLElement;
      if (buttons) buttons.remove();
  
      // วางสำเนาในตำแหน่งที่มองไม่เห็น
      element.style.position = 'absolute';
      element.style.top = '-9999px';
      element.style.left = '-9999px';
      element.style.width = originalElement.offsetWidth + 'px';
      element.style.backgroundColor = 'white';
      element.style.padding = '20px';
      
      document.body.appendChild(element);
  
      // รอให้ DOM อัพเดท
      await new Promise(resolve => setTimeout(resolve, 500));
  
      console.log("กำลังแคปหน้าเว็บ...");
  
      // วิธีที่ 1: ลองใช้ html2canvas แบบปรับปรุง
      try {
        const canvas = await html2canvas(element, { 
          scale: 2,
          useCORS: false,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: true,
          width: element.scrollWidth,
          height: element.scrollHeight,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        });
        
        console.log("แคปเสร็จแล้ว (วิธีที่ 1) - ใช้ html2canvas");
        
        // ลบสำเนาออก
        document.body.removeChild(element);
        
        return await createPDFFromCanvas(canvas, queueNumber);
        
      } catch (error1) {
        console.log("วิธีที่ 1 ล้มเหลว ลองวิธีที่ 2...", error1);
        
        // ลบสำเนาออก
        document.body.removeChild(element);
        
        // วิธีที่ 2: ใช้ dom-to-image แบบง่าย
        try {
          // ดึงข้อมูลจาก DOM และสร้าง canvas เอง
          const rect = originalElement.getBoundingClientRect();
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = Math.max(800, rect.width) * 2;
          canvas.height = Math.max(600, rect.height) * 2;
          
          if (ctx) {
            ctx.scale(2, 2);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
            
            // วาดข้อมูลลงใน canvas
            await drawElementToCanvas(ctx, originalElement);
            
            console.log("แคปเสร็จแล้ว (วิธีที่ 2) - ใช้ manual drawing");
            
            return await createPDFFromCanvas(canvas, queueNumber);
          }
          
        } catch (error2) {
          console.log("วิธีที่ 2 ล้มเหลว ลองวิธีที่ 3...", error2);
          
          // วิธีที่ 3: สร้าง PDF แบบ text ที่มีภาษาไทยและอังกฤษ
          return createTextBasedPDF(queueNumber);
        }
      }
      
    } catch (error) {
      console.error("เกิดข้อผิดพลาดทั่วไป:", error);
      return createTextBasedPDF(queueNumber);
    } finally {
      // ไม่ต้องทำอะไรเพิ่มเติม เพราะใช้สำเนาแยกต่างหาก
      setIsLoading(false);
    }
  };

  const drawElementToCanvas = async (ctx: CanvasRenderingContext2D, element: HTMLElement) => {
    // ดึงข้อมูลจาก DOM มาวาดเอง
    const rect = element.getBoundingClientRect();
    
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#286B81';
    ctx.textAlign = 'center';
    ctx.fillText('ยืนยันการนัด', rect.width / 2, 40);
    
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    
    let y = 80;
    
    // หมายเลขคิว
    ctx.fillStyle = '#286B81';
    ctx.fillText('หมายเลขคิว', 20, y);
    ctx.fillStyle = '#000000';
    ctx.fillText(queue, 20, y + 20);
    y += 60;
    
    // ข้อมูลผู้ป่วย
    ctx.fillStyle = '#286B81';
    ctx.fillText('ข้อมูลผู้ป่วย', 20, y);
    y += 30;
    
    ctx.fillStyle = '#000000';
    ctx.font = '12px system-ui, sans-serif';
    
    const patientInfo = [
      `คำนำหน้า : ${patient.prefix || "-"}`,
      `ชื่อ : ${patient.firstName || "-"}`,
      `นามสกุล : ${patient.lastName || "-"}`,
      `เพศ : ${patient.gender || "-"}`,
      `วัน/เดือน/ปีเกิด : ${patient.dob || "-"}`,
      `สัญชาติ : ${patient.nationality || "-"}`,
      `เลขบัตรประชาชน : ${patient.citizenId || "-"}`,
      `เบอร์ติดต่อ : ${patient.phone || "-"}`,
      `Email : ${patient.email || "-"}`
    ];
    
    let col1Y = y;
    let col2Y = y;
    
    patientInfo.forEach((info, index) => {
      if (index % 2 === 0) {
        ctx.fillText(info, 20, col1Y);
        col1Y += 25;
      } else {
        ctx.fillText(info, rect.width / 2, col2Y);
        col2Y += 25;
      }
    });
    
    y = Math.max(col1Y, col2Y) + 20;
    
    // รายละเอียดการทำนัด
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#286B81';
    ctx.fillText('รายละเอียดการทำนัด', 20, y);
    y += 30;
    
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(`แผนก : ${depart || "-"}`, 20, y);
    y += 25;
    ctx.fillText(`ประเภท : ${illness || "-"}`, 20, y);
    y += 25;
    ctx.fillText(`วันและเวลา : ${selectedDate} ${selectedTime}`, 20, y);
  };

  const createPDFFromCanvas = async (canvas: HTMLCanvasElement, queueNumber: string) => {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      
      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2);
      
      // คำนวณขนาดให้พอดีหน้ากระดาษ
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const widthRatio = maxWidth / (imgWidth * 0.264583);
      const heightRatio = maxHeight / (imgHeight * 0.264583);
      const ratio = Math.min(widthRatio, heightRatio);
      
      const scaledWidth = imgWidth * 0.264583 * ratio;
      const scaledHeight = imgHeight * 0.264583 * ratio;
      
      const x = (pageWidth - scaledWidth) / 2;
      const y = margin;

      const imgData = canvas.toDataURL("image/png", 0.9);
      pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);
      
      const fileName = `Booking_${queueNumber}.pdf`;
      pdf.save(fileName);
      
      console.log(`PDF ${fileName} ถูกสร้างเรียบร้อยแล้ว`);
      return true;
      
    } catch (error) {
      console.error("Error creating PDF from canvas:", error);
      return false;
    }
  };

  const createTextBasedPDF = (queueNumber: string) => {
    try {
      console.log("ใช้วิธีสร้าง PDF แบบ text...");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      pdf.setFont("helvetica", "normal");
      
      let y = 20;
      
      // หัวข้อ
      pdf.setFontSize(18);
      pdf.text("APPOINTMENT CONFIRMATION", 105, y, { align: "center" });
      y += 7;
      pdf.text("(ยืนยันการนัด)", 105, y, { align: "center" });
      y += 20;
      
      pdf.setFontSize(12);
      
      // หมายเลขคิว
      pdf.text(`Queue Number (หมายเลขคิว): ${queue}`, 20, y);
      y += 15;
      
      // ข้อมูลผู้ป่วย
      pdf.setFontSize(14);
      pdf.text("PATIENT INFORMATION (ข้อมูลผู้ป่วย)", 20, y);
      y += 10;
      pdf.setFontSize(10);
      
      const patientFields = [
        [`Prefix (คำนำหน้า)`, patient.prefix || "-"],
        [`First Name (ชื่อ)`, patient.firstName || "-"],
        [`Last Name (นามสกุล)`, patient.lastName || "-"],
        [`Gender (เพศ)`, patient.gender || "-"],
        [`Date of Birth (วัน/เดือน/ปีเกิด)`, patient.dob || "-"],
        [`Nationality (สัญชาติ)`, patient.nationality || "-"],
        [`ID Number (เลขบัตรประชาชน)`, patient.citizenId || "-"],
        [`Phone (เบอร์ติดต่อ)`, patient.phone || "-"],
        [`Email`, patient.email || "-"]
      ];
      
      patientFields.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, 20, y);
        y += 6;
      });
      
      y += 10;
      
      // รายละเอียดการทำนัด
      pdf.setFontSize(14);
      pdf.text("APPOINTMENT DETAILS (รายละเอียดการทำนัด)", 20, y);
      y += 10;
      pdf.setFontSize(10);
      
      pdf.text(`Department (แผนก): ${depart || "-"}`, 20, y);
      y += 6;
      pdf.text(`Type (ประเภท): ${illness || "-"}`, 20, y);
      y += 6;
      pdf.text(`Date & Time (วันและเวลา): ${selectedDate} ${selectedTime}`, 20, y);
      
      const fileName = `Booking_${queueNumber}.pdf`;
      pdf.save(fileName);
      
      console.log(`PDF ${fileName} ถูกสร้างเรียบร้อยแล้ว (text-based)`);
      return true;
      
    } catch (error) {
      console.error("Error creating text-based PDF:", error);
      return false;
    }
  };

  const handleConfirm = async () => {
    console.log("กดปุ่มยืนยันแล้ว", patient, depart, illness);
    
    const nextQueue = getNextQueue();
    setQueue(nextQueue);
    
    // รอให้ state อัพเดทเสร็จก่อน
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const success = await exportPDF(nextQueue);
    
    if (success) {
      // รอให้ PDF ดาวน์โหลดเสร็จก่อนไปหน้าถัดไป
      setTimeout(() => {
        router.push("/finishbooking");
      }, 1000);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6 mt-10 rounded-md shadow-2xl bg-white" id="booking-confirm">
        <h2 className="text-center text-2xl font-bold mb-6 text-[#286B81]">
          ยืนยันการนัด
        </h2>

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
              <p>ประเภท : {illness || "-"}</p>
              <p>หมอ : {illness || "-"}</p>
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