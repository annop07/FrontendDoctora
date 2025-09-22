"use client";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const items = [
  "กระดูกและข้อ","กุมารเวชกรรม","นรีเวชกรรม","ผิวหนัง",
  "ศัลยกรรมตกแต่ง","ศัลยกรรมทั่วไป","สุขภาพเพศชาย","สมองและไขสันหลัง",
  "หลอดเลือด","หัวใจและทรวงอก","ศัลยกรรมเด็ก","มะเร็งเต้านม","สุขภาพจิต","บุคคลข้ามเพศ","หู คอ จมูก","เวชศาสตร์นิวเคลียร์","โรคหัวใจ"
];

export default function DepartPage() {
  const [selected, setSelected] = useState<string>("กระดูกและข้อ"); // default เลือกอันแรก
  const [userSelection, setUserSelection] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // รับข้อมูลตัวเลือกจาก URL parameter
  useEffect(() => {
    const selection = searchParams.get('selection');
    if (selection) {
      setUserSelection(selection);
    }
  }, [searchParams]);

  const handleNext = () => {
    console.log("แผนกที่เลือก:", selected);
    console.log("ตัวเลือกของผู้ใช้:", userSelection);
    
    // กำหนดเส้นทางตามตัวเลือกที่ผู้ใช้เลือกในหน้าแรก
    if (userSelection === 'auto') {
      // เลือกแพทย์ให้ฉัน -> ไปหน้า /booking
      router.push(`/booking?depart=${encodeURIComponent(selected)}&selection=${userSelection}`);
    } else if (userSelection === 'manual') {
      // ฉันต้องการเลือกแพทย์เอง -> ไปหน้า /AllDoctor
      router.push(`/AllDoctor?depart=${encodeURIComponent(selected)}&selection=${userSelection}`);
    } else {
      // ถ้าไม่มีข้อมูลจากหน้าแรก ให้ไปหน้า /booking เป็นค่าเริ่มต้น
      router.push(`/booking?depart=${encodeURIComponent(selected)}`);
    }
  };

  const handleBack = () => {
    router.push("/#"); // ลิงก์กลับหน้าแรก
  };

  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-6 mt-20 rounded-md shadow-2xl relative pb-20">
        <h2 className="text-center text-2xl font-bold mb-4">เลือกแผนกที่ต้องการ</h2>

        {/* แสดงตัวเลือกที่ผู้ใช้เลือกมา (ถ้ามี) */}
        {userSelection && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm text-blue-700 text-center">
              ตัวเลือกของคุณ : {userSelection === 'auto' ? 'เลือกแพทย์ให้ฉัน' : 'ฉันต้องการเลือกแพทย์เอง'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4">
          {items.map((label, i) => {
            const isActive = selected === label;
            return (
              <button
                key={i}
                onClick={() => setSelected(label)}
                className={[
                  "w-full h-12 px-3 rounded-md flex items-center justify-center",
                  "bg-white shadow hover:shadow-md transition-all hover:-translate-y-0.5",
                  "border cursor-pointer",
                  isActive ? "bg-sky-100 border-sky-400 ring-1 ring-sky-400" : "border-gray-200",
                  "text-gray-800"
                ].join(" ")}
              >
                <span className={isActive ? "font-semibold text-sky-700" : "font-medium"}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ปุ่มต่อไป */}
        <button
          type="button"
          className="absolute -bottom-4 right-24 w-50 h-10 bg-cyan-600 justify-center items-center flex rounded-md cursor-pointer hover:bg-cyan-700 transition-colors duration-150"
          onClick={handleNext}
        >
          <p className="text-center font-extrabold text-white text-xl">ต่อไป</p>
        </button>

        {/* ปุ่มกลับ */}
        <button
          type="button"
          className="absolute -bottom-4 left-24 w-40 h-10 bg-sky-200 justify-center items-center flex rounded-md cursor-pointer hover:bg-sky-300 transition-colors duration-150"
          onClick={handleBack}
        >
          <p className="text-center font-extrabold text-cyan-700 text-xl">กลับ</p>
        </button>
      </div>
    </>
  );
}