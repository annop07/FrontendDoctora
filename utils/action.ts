'use server'
import { redirect } from "next/navigation"

export async function registerAction(formData : FormData){
    const pass = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    const rawData = Object.fromEntries(formData);
    console.log(rawData); 
    
    await new Promise (r => setTimeout(r,2000));
    redirect('/');
}

export async function bookingAction(formData : FormData){
    const obj = Object.fromEntries(formData.entries());

    const files = formData.getAll('attachments') as File[];

    console.log('data:',obj);
    console.log('files:',files.map(f => ({name : f.name, size : f.size})));

    
    redirect('/patientForm');
}

export async function patientAction(formData : FormData){
    const rawData = Object.fromEntries(formData);
    console.log(rawData); 
}