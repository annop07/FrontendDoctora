"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stethoscope, ArrowRight, ArrowLeft, Heart, Activity, Brain, Zap, Baby, UserCheck, Scissors, Shield, Waves, Bone, HeartHandshake, Users, Ear, Sparkles, HeartPulse, User, Radiation } from "lucide-react";

// Interface for backend specialty data
interface Specialty {
  id: number;
  name: string;
  description: string;
  doctorCount?: number;
  createdAt?: string;
}

// API Service for specialties
class SpecialtyApiService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

  async getSpecialtiesWithCount(): Promise<{ specialties: Specialty[] }> {
    const response = await fetch(`${this.baseUrl}/api/specialties/with-count`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch specialties: ${response.status}`);
    }
    
    return response.json();
  }
}

// Icon mapping for different specialties
const iconMapping: Record<string, any> = {
  "กระดูกและข้อ": Bone,
  "กุมารเวชกรรม": Baby,
  "นรีเวชกรรม": UserCheck,
  "ผิวหนัง": Sparkles,
  "ศัลยกรรมตกแต่ง": Scissors,
  "ศัลยกรรมทั่วไป": Activity,
  "สุขภาพเพศชาย": Shield,
  "สมองและไขสันหลัง": Brain,
  "หลอดเลือด": Waves,
  "หัวใจและทรวงอก": Heart,
  "ศัลยกรรมเด็ก": HeartHandshake,
  "มะเร็งเต้านม": Radiation,
  "สุขภาพจิต": Users,
  "บุคคลข้ามเพศ": User,
  "หู คอ จมูก": Ear,
  "เวชศาสตร์นิวเคลียร์": Zap,
  "โรคหัวใจ": HeartPulse,
  // English names (from backend)
  "Cardiology": Heart,
  "Pediatrics": Baby,
  "Internal Medicine": Activity,
  "Surgery": Activity,
  "Emergency Medicine": Zap,
  // Default fallback
  "default": Stethoscope
};

// Color mapping for different specialties
const colorMapping: Record<string, string> = {
  "กระดูกและข้อ": "from-emerald-500 to-teal-600",
  "กุมารเวชกรรม": "from-green-500 to-emerald-600",
  "นรีเวชกรรม": "from-teal-500 to-cyan-600",
  "ผิวหนัง": "from-emerald-600 to-green-700",
  "ศัลยกรรมตกแต่ง": "from-cyan-500 to-teal-600",
  "ศัลยกรรมทั่วไป": "from-green-600 to-emerald-700",
  "สุขภาพเพศชาย": "from-teal-600 to-emerald-700",
  "สมองและไขสันหลัง": "from-emerald-500 to-green-600",
  "หลอดเลือด": "from-green-500 to-teal-600",
  "หัวใจและทรวงอก": "from-emerald-600 to-teal-700",
  "ศัลยกรรมเด็ก": "from-teal-500 to-green-600",
  "มะเร็งเต้านม": "from-emerald-500 to-teal-600",
  "สุขภาพจิต": "from-green-500 to-emerald-600",
  "บุคคลข้ามเพศ": "from-emerald-700 to-green-800",
  "หู คอ จมูก": "from-emerald-600 to-green-700",
  "เวชศาสตร์นิวเคลียร์": "from-green-600 to-teal-700",
  "โรคหัวใจ": "from-emerald-500 to-teal-600",
  // English names
  "Cardiology": "from-red-500 to-pink-600",
  "Pediatrics": "from-blue-500 to-indigo-600",
  "Internal Medicine": "from-green-500 to-emerald-600",
  "Surgery": "from-orange-500 to-red-600",
  "Emergency Medicine": "from-red-600 to-rose-700",
  // Default
  "default": "from-emerald-500 to-teal-600"
};

export default function DepartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [userSelection, setUserSelection] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const apiService = new SpecialtyApiService();

  // Load specialties from backend
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        setLoading(true);
        const response = await apiService.getSpecialtiesWithCount();
        setSpecialties(response.specialties);
        
        // Set first specialty as default if none selected
        if (response.specialties.length > 0 && !selected) {
          setSelected(response.specialties[0].name);
        }
      } catch (error) {
        console.error('Failed to load specialties:', error);
        setError(error instanceof Error ? error.message : 'Failed to load specialties');
      } finally {
        setLoading(false);
      }
    };

    loadSpecialties();
  }, []);

  // Get selection from URL + sync to sessionStorage
  useEffect(() => {
    const selection = searchParams.get("selection") || "";
    if (selection) {
      setUserSelection(selection);
      const draft = JSON.parse(sessionStorage.getItem("bookingDraft") || "{}");
      draft.illness = selection;
      sessionStorage.setItem("bookingDraft", JSON.stringify(draft));
    }
  }, [searchParams]);

  // Load previous department selection
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
      // Let system choose doctor -> go to booking
      router.push(`/booking?depart=${encodeURIComponent(selected)}&selection=${userSelection}`);
    } else if (userSelection === "manual") {
      // User wants to choose doctor -> go to AllDoctor
      router.push(`/AllDoctor?depart=${encodeURIComponent(selected)}&selection=${userSelection}`);
    } else {
      // Fallback
      router.push(`/booking?depart=${encodeURIComponent(selected)}`);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  // Get icon for specialty
  const getSpecialtyIcon = (specialtyName: string) => {
    return iconMapping[specialtyName] || iconMapping["default"];
  };

  // Get color for specialty
  const getSpecialtyColor = (specialtyName: string) => {
    return colorMapping[specialtyName] || colorMapping["default"];
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <main className="container mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
              <Stethoscope className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">
              เลือกแผนกที่ต้องการ
            </h1>
          </div>
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
              <p className="text-emerald-700 font-medium">กำลังโหลดข้อมูลแผนก...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <main className="container mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
              <Stethoscope className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">
              เลือกแผนกที่ต้องการ
            </h1>
          </div>
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-red-800 font-medium mb-2">เกิดข้อผิดพลาด</h3>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
          {specialties.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {specialties.map((specialty) => {
                const isActive = selected === specialty.name;
                const IconComponent = getSpecialtyIcon(specialty.name);
                const colorClass = getSpecialtyColor(specialty.name);
                
                return (
                  <button
                    key={specialty.id}
                    onClick={() => setSelected(specialty.name)}
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
                      <div className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-5`}></div>
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
                        {specialty.name}
                      </span>
                      {specialty.doctorCount !== undefined && (
                        <span className="text-xs text-emerald-600 mt-1">
                          ({specialty.doctorCount} หมอ)
                        </span>
                      )}
                    </div>
                    
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-600">ไม่พบข้อมูลแผนก</p>
            </div>
          )}
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
              disabled={!selected}
              className={`relative z-10 flex items-center gap-2 px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg font-semibold ${
                selected
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl transform hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
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
                  {(() => {
                    const selectedSpecialty = specialties.find(s => s.name === selected);
                    return selectedSpecialty?.doctorCount !== undefined && (
                      <p className="text-emerald-600 text-sm">มีแพทย์ {selectedSpecialty.doctorCount} ท่าน</p>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backend Integration Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <h4 className="text-blue-800 font-medium mb-2">🔗 Backend Integration Status</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>✅ <strong>Connected:</strong> Specialty data loaded from backend API</p>
            <p>✅ <strong>Connected:</strong> Doctor counts per specialty</p>
            <p>📝 <strong>Note:</strong> Icons and colors are mapped from specialty names</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}