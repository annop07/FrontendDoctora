"use client";
import Navbar from "@/components/Navbar";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react"; 
import Schedule from "@/components/Schedule";
import UploadBox from "@/components/UploadBox";
import { bookingAction } from "@/utils/action";
import { useRouter } from "next/navigation";

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
    if (d.illness) setIllness(d.illness);
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
    "w-full h-12 rounded-md shadow p-2 text-left transition-colors duration-150 cursor-pointer";
  const active = "bg-sky-100 border border-sky-400 ring-1 ring-sky-400";
  const normal = "hover:bg-sky-200";

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
    
    <>
    
      <Navbar />
      <div className="inline-flex h-12 items-center justify-center rounded-full bg-sky-400 px-6 mt-6 ml-8 shadow whitespace-nowrap">
        <p className="font-extrabold text-white drop-shadow-md">{depart}</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 mt-10 rounded-md shadow-2xl bg-white">
        <div className="grid grid-cols-2 gap-6">
          {/* ซ้าย */}
          <div>
            <p className="text-sm text-gray-600 mb-2">วันเวลาที่ต้องการนัด</p>
            <div className="inline-block rounded-md shadow bg-white p-3 ml-[15px]" >
            <Schedule onChange={(d)=> setSelectedDate(d ?? null)}></Schedule>
            </div>
          </div>

          {/* ขวา */}
          <div className="space-y-6 ">
            {/* ก่อนเที่ยง */}
            <div>
              <p className="mb-2 font-semibold mt-18">ก่อนเที่ยง</p>
              <div className="grid grid-cols-3 gap-4">
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

            {/* หลังเที่ยง */}
            <div>
              <p className="mb-2 font-semibold">หลังเที่ยง</p>
              <div className="grid grid-cols-3 gap-4">
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
        <form action={bookingAction}  className="space-y-4">

        <input type="hidden" name="depart" value={depart}></input>
        <input type="hidden" name="time" value={selectedTime ?? ""}></input>
        <input type="hidden" name="date" value={selectedDate?.toISOString() ?? ""}></input>

        <input name="illness" value={illness} 
        onChange={(e) => setIllness(e.target.value)}
        className="w-full h-25 mt-10 border border-gray-300 rounded-md" placeholder=" ระบุอาการและปัญหาสุขภาพของคุณ"></input>
        
        <UploadBox name="attachments" accept="image/*,.pdf" multiple onChange={(files) => console.log("ไฟล์ที่อัพโหลด:",files)}></UploadBox>
        <div className="flex justify-between mt-8">
        <button type="button" className=" w-40 h-10 bg-sky-200 justify-center items-center flex rounded-md mt-10 mx-auto cursor-pointer hover:bg-sky-300 transition-colors duration-150"
          onClick={backButton}>
       <p className="text-center font-extrabold text-cyan-700 text-xl">กลับ</p> 
        </button>
        <button type="submit" className=" w-50 h-10 bg-cyan-600 justify-center items-center flex rounded-md mt-10 mx-auto cursor-pointer hover:bg-cyan-700 transition-colors duration-150">
       <p className="text-center font-extrabold text-white text-xl">ต่อไป</p> 
        </button>
        </div>
        </form>

      </div>
    </>
  );
}
