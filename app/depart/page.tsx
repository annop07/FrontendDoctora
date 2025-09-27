"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stethoscope, ArrowRight, ArrowLeft, Heart, Activity, Brain, Zap, Baby, UserCheck, Scissors, Shield, Waves, Bone, HeartHandshake, Users, Ear, Sparkles, HeartPulse, User, Radiation } from "lucide-react";

const departmentData = [
  { name: "กระดูกและข้อ", icon: Bone, color: "from-emerald-500 to-teal-600" },
  { name: "กุมารเวชกรรม", icon: Baby, color: "from-green-500 to-emerald-600" },
  { name: "นรีเวชกรรม", icon: UserCheck, color: "from-teal-500 to-cyan-600" },
  { name: "ผิวหนัง", icon: Sparkles, color: "from-emerald-600 to-green-700" },
  { name: "ศัลยกรรมตกแต่ง", icon: Scissors, color: "from-cyan-500 to-teal-600" },
  { name: "ศัลยกรรมทั่วไป", icon: Activity, color: "from-green-600 to-emerald-700" },
  { name: "สุขภาพเพศชาย", icon: Shield, color: "from-teal-600 to-emerald-700" },
  { name: "สมองและไขสันหลัง", icon: Brain, color: "from-emerald-500 to-green-600" },
  { name: "หลอดเลือด", icon: Waves, color: "from-green-500 to-teal-600" },
  { name: "หัวใจและทรวงอก", icon: Heart, color: "from-emerald-600 to-teal-700" },
  { name: "ศัลยกรรมเด็ก", icon: HeartHandshake, color: "from-teal-500 to-green-600" },
  { name: "มะเร็งเต้านม", icon: Radiation, color: "from-emerald-500 to-teal-600" },
  { name: "สุขภาพจิต", icon: Users, color: "from-green-500 to-emerald-600" },
  { name: "บุคคลข้ามเพศ", icon: User, color: "from-emerald-700 to-green-800" },
  { name: "หู คอ จมูก", icon: Ear, color: "from-emerald-600 to-green-700" },
  { name: "เวชศาสตร์นิวเคลียร์", icon: Zap, color: "from-green-600 to-teal-700" },
  { name: "โรคหัวใจ", icon: HeartPulse, color: "from-emerald-500 to-teal-600" }
];

export default function DepartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selected, setSelected] = useState<string>("กระดูกและข้อ");
  const [userSelection, setUserSelection] = useState<string>("");

  // รับ selection จาก URL + sync เข้า sessionStorage.bookingDraft
  useEffect(() => {
    const selection = searchParams.get("selection") || "";
    if (selection) {
      setUserSelection(selection);
      const draft = JSON.parse(sessionStorage.getItem("bookingDraft") || "{}");
      draft.illness = selection;
      sessionStorage.setItem("bookingDraft", JSON.stringify(draft));
    }
  }, [searchParams]);

  // โหลด depart เดิมถ้ามี
  useEffect(() => {
    const draft = JSON.parse(sessionStorage.getItem("bookingDraft") || "{}");
    if (draft.depart && typeof draft.depart === "string") {
      setSelected(draft.depart);
    }
  }, []);

  const handleNext = () => {
    const draft = JSON.parse(sessionStorage.getItem("bookingDraft") || "{}");
    draft.depart = selected;
    if (userSelection) draft.illness = userSelection;
    sessionStorage.setItem("bookingDraft", JSON.stringify(draft));

    if (userSelection === "auto") {
      // เลือกแพทย์ให้ฉัน -> ไปหน้า booking
      router.push(`/booking?depart=${encodeURIComponent(selected)}&selection=${userSelection}`);
    } else if (userSelection === "manual") {
      // ฉันต้องการเลือกแพทย์เอง -> ไปหน้า AllDoctor
      router.push(`/AllDoctor?depart=${encodeURIComponent(selected)}&selection=${userSelection}`);
    } else {
      // กรณีไม่มี selection (fallback)
      router.push(`/booking?depart=${encodeURIComponent(selected)}`);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />

      <main className="container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
            <Stethoscope className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-emerald-900 mb-4">
            เลือกแผนกที่ต้องการ
          </h1>
          <p className="text-xl text-emerald-700 max-w-2xl mx-auto leading-relaxed">
            เลือกแผนกที่เหมาะสมกับอาการหรือความต้องการของคุณ
          </p>
        </div>

        {/* Selection Info */}
        {userSelection && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-emerald-100 border border-emerald-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <p className="text-emerald-800 font-medium">
                  ตัวเลือกของคุณ: <span className="font-bold">
                    {userSelection === "auto" ? "เลือกแพทย์ให้ฉัน" : "ฉันต้องการเลือกแพทย์เอง"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Department Grid */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {departmentData.map((dept, index) => {
              const isActive = selected === dept.name;
              const IconComponent = dept.icon;
              return (
                <button
                  key={index}
                  onClick={() => setSelected(dept.name)}
                  className={`
                    group relative overflow-hidden rounded-2xl p-4 h-24 transition-all duration-300 border-2
                    ${isActive 
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-105' 
                      : 'border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-md hover:-translate-y-1'
                    }
                  `}
                >
                  {/* Background Gradient */}
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${dept.color} opacity-5`}></div>
                  )}
                  
                  <div className="relative flex flex-col items-center justify-center h-full">
                    <div className={`mb-2 transition-colors ${
                      isActive ? 'text-emerald-600' : 'text-emerald-500 group-hover:text-emerald-600'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-medium text-center leading-tight transition-colors ${
                      isActive ? 'text-emerald-800' : 'text-emerald-700 group-hover:text-emerald-800'
                    }`}>
                      {dept.name}
                    </span>
                  </div>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative">
          {/* Background line */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-0.5 bg-emerald-200 -z-10"></div>
          
          <div className="flex items-center justify-center gap-150">
            <button
              type="button"
              onClick={handleBack}
              className="relative z-10 flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-25 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              กลับ
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="relative z-10 flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              ต่อไป
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected Department Display */}
        {selected && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-emerald-600 text-sm font-medium">แผนกที่เลือก</p>
                  <p className="text-emerald-900 text-lg font-bold">{selected}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}