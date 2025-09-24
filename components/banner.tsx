'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Banner slides data - simplified to only images
const bannerSlides = [
  {
    id: 1,
    bgImage: "/images/banners/banner1.png",
    backgroundPosition: "center"
  },
  {
    id: 2,
    bgImage: "/images/banners/banner2.png",
    backgroundPosition: "center"
  },
  {
    id: 3,
    bgImage: "/images/banners/banner3.png",
    backgroundPosition: "center"
  },
  {
    id: 4,
    bgImage: "/images/banners/banner4.png",
    backgroundPosition: "center"
  },
  {
    id: 5,
    bgImage: "/images/banners/banner5.png",
    backgroundPosition: "center top"
  }
];

export default function Banner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-slide every 3 seconds
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div 
      className="relative overflow-hidden rounded-2xl shadow-xl h-96 mb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Container - using transform for smooth sliding */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`
        }}
      >
        {bannerSlides.map((slide) => (
          <div
            key={slide.id}
            className="min-w-full h-full relative"
            style={{
              backgroundImage: `url("${slide.bgImage}")`,
              backgroundSize: 'cover',
              backgroundPosition: slide.backgroundPosition || 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 text-white" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 text-white" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {bannerSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 w-3 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-white w-8' 
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 px-3 py-1 bg-black/30 backdrop-blur-sm rounded-lg text-white text-sm z-10">
        {currentSlide + 1} / {bannerSlides.length}
      </div>
    </div>
  );
}