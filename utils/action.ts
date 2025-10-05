'use server'
import { redirect } from "next/navigation"

export async function registerAction(formData : FormData){
    const email = formData.get("email") as string;
    const pass = formData.get("password") as string;

    const rawData = Object.fromEntries(formData);
    console.log(rawData); 
    
    await new Promise (r => setTimeout(r,2000));
    
    // ไม่บันทึกข้อมูลผู้ใช้ลง localStorage ให้ผู้ใช้ล็อกอินเอง
    
    redirect('/login');
}

export async function bookingAction(formData : FormData){
    const obj = Object.fromEntries(formData.entries());

    const files = formData.getAll('attachments') as File[];

    console.log('Booking data:',obj);
    console.log('Attached files:',files.map(f => ({name : f.name, size : f.size})));

    // Server actions run on server, cannot access window/sessionStorage
    // Data will be passed via URL params or handled differently

    redirect('/patientForm');
}

export async function patientAction(formData : FormData){
    const rawData = Object.fromEntries(formData);
    console.log(rawData); 
}