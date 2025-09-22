'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";

export default function LandingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');

  const bannerImages = [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1000&q=80',
      alt: 'Medical Banner 1',
      title: 'การดูแลสุขภาพที่ดีที่สุด'
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1000&q=80',
      alt: 'Medical Banner 2',
      title: 'แพทย์ผู้เชี่ยวชาญ'
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1000&q=80',
      alt: 'Medical Banner 3',
      title: 'เทคนโลยีทางการแพทย์'
    }
  ];

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [bannerImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const handleNext = () => {
    if (!selectedOption) {
      alert('กรุณาเลือกตัวเลือกก่อนดำเนินการต่อ');
      return;
    }
    
    // ส่งข้อมูลตัวเลือกไปยังหน้า /depart ผ่าน URL parameter
    router.push(`/depart?selection=${selectedOption}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header + Log in/Register */}
      <div className="relative">
        <Navbar />
        <div className="absolute right-6 top-3 flex gap-3">
          <a
            href="/login"
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Log in
          </a>
          <a
            href="/register"
            className="px-6 py-2 bg-[#286B81] text-white rounded-lg hover:bg-[#1e5468] transition-colors"
          >
            Register
          </a>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Banner Section */}
        <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
          <div className="relative h-64 bg-gray-400">
            {bannerImages.map((image, index) => (
              <div
                key={image.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <h2 className="text-white text-4xl font-bold">{image.title}</h2>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Appointment Section */}
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            เริ่มทำการนัดหมายแพทย์
          </h1>

          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-[#286B81]" />
            </div>

            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="px-3 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white w-95 text-lg focus:outline-none focus:ring-2 focus:ring-[#286B81] focus:border-[#286B81]"
            >
              <option value="" disabled>
                เลือกแพทย์ให้ฉัน
              </option>
              <option value="auto">
                เลือกแพทย์ให้ฉัน
              </option>
              <option value="manual">
                ฉันต้องการเลือกแพทย์เอง
              </option>
            </select>
          </div>

          <div className="text-red-500 text-sm mb-4">
            <a href="/login" className="hover:text-red-700 transition-colors">
              จำเป็นต้องมีการลงทะเบียนเพื่อทำการนัดหมาย คลิกที่นี่เพื่อเข้าสู่ระบบ
            </a>
          </div>

          <button
            onClick={handleNext}
            className="w-full max-w-sm bg-[#286B81] hover:bg-[#1e5468] text-white text-lg font-bold py-3 px-6 rounded-lg transition-colors"
          >
            ต่อไป &gt;
          </button>
        </div>
      </main>
      <footer className="bg-white border-t mt-12">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-3">Footer website</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-800 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-gray-800 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-gray-800 transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-gray-800 transition-colors">Terms of service</a></li>
                <li><a href="#" className="hover:text-gray-800 transition-colors">privacy policy</a></li>
              </ul>
            </div>
    </div>
        </div>
      </footer>
    </div>
  );
}