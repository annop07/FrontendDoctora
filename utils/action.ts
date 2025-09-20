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