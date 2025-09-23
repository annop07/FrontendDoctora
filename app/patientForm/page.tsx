'use client'
import { useState } from "react";
import Navbar from "@/components/Navbar"
import { patientAction } from "@/utils/action";
import { useRouter } from "next/navigation"

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
    
        // เก็บลง sessionStorage
        sessionStorage.setItem("patientData", JSON.stringify(data));
    
    // ไปหน้าคอนเฟิร์ม
        router.push("/confirmbooking");
  };

  
  return (
    <>
            <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-6 mt-10 rounded-md shadow-2xl bg-white">
          <h2 className="text-center text-2xl font-bold mb-4">ข้อมูลผู้ป่วย</h2>
              <form>
            <fieldset className="mt-6 rounded-md border border-gray-200 p-4">
              <legend className="px-2 text-sm font-semibold text-gray-700">ข้อมูลผู้ป่วย</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* คำนำหน้า และชื่อ */}
          <div className="flex gap-2">
            <input name="prefix" className="w-28 rounded-md border border-gray-300 px-3 py-2" placeholder="คำนำหน้า" required/>
                                <input name="firstName" placeholder="ชื่อ" className="flex-1 rounded-md border border-gray-300 px-3 py-2" required autoComplete="given-name" /> 
        </div>
<input name="lastName" placeholder="นามสกุล" className="rounded-md border border-gray-300 px-3 py-2" required autoComplete="family-name"/>
                            <select name="gender" className="rounded-md border border-gray-300 px-3 py-2" defaultValue="" required>
                                <option value="" disabled>เพศ</option>
                                <option value="ชาย">ชาย</option>
                                <option value="หญิง">หญิง</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                            </select>
                            <input name="dob" type="date" max={new Date(Date.now() - 86400000).toISOString().split("T")[0]}  placeholder="วัน/เดือน/ปีเกิด" className="rounded-md border border-gray-300 px-3 py-2" required />
                            <input name="nationality" placeholder="สัญชาติ" className="rounded-md border border-gray-300 px-3 py-2" required/>
            <input name="citizenId" placeholder="เลขบัตรประชาชน" className="rounded-md border border-gray-300 px-3 py-2" inputMode="numeric" pattern="[0-9]{13}" title="กรอกตัวเลข 13 หลัก" required/>
                            <input name="phone" placeholder="เบอร์โทรศัพท์" className="rounded-md border border-gray-300 px-3 py-2" inputMode="tel" pattern="[0-9]{9,10}" title="กรอกตัวเลข 9-10 หลัก" autoComplete="tel" required />
                            <input name="email" type="email" placeholder="email" className="rounded-md border border-gray-300 px-3 py-2" autoComplete="email" required/>
          </div>

          {/* Checkbox */}
                        <label className="mt-4 flex items-start gap-2">
                <input
                  type="checkbox"
                                name="consent"
                                className="mt-1"
                                checked={consentChecked}
                                onChange={(e) => setConsentChecked(e.target.checked)}
                            />
                  <span className="text-sm text-gray-600">
                                อนุญาตให้มีการเก็บประวัติข้อมูลส่วนตัวและเชื่อมถึงสิทธิการดูแลรักษา
                  </span>
</label>

                        <p className="mt-3 text-xs font-semibold text-red-600">
                            การนัดหมายนี้อาจมีการใช้ข้อมูลส่วนตัว หรือจัดหมายแพทย์ในวันเดียวกัน
                            สำหรับกรณีฉุกเฉินทางการแพทย์ กรุณาติดต่อ 1669
                        </p>

                        <div className="flex justify-between">
                  <button 
                    type="button"
                    className="w-40 h-10 bg-sky-200 justify-center items-center flex rounded-md mt-10 cursor-pointer hover:bg-sky-300 transition-colors duration-150"
                                onClick={backButton}
                  >
                    <p className="text-center font-extrabold text-cyan-700 text-xl">กลับ</p>
                  </button>
                
                                <button
                                  type="button"
                                  disabled={!consentChecked}
                                  className={`w-50 h-10 justify-center items-center flex rounded-md mt-10 cursor-pointer transition-colors duration-150
                                    ${consentChecked ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}
                                `}
                                onClick={handleNext}
                            >
                                <p className="text-center font-extrabold text-xl">ต่อไป</p>
                                </button>
                                                      </div>
                      </fieldset>
              </form>
            </div>
</>
    )
}

export default PatientForm
