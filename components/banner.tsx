// components/Banner.tsx
export default function Banner() {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 rounded-2xl shadow-xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/20"></div>
          <div className="absolute top-8 right-12 h-16 w-16 rounded-full bg-white/10"></div>
          <div className="absolute bottom-6 left-8 h-20 w-20 rounded-full bg-white/15"></div>
          <div className="absolute bottom-12 right-6 h-12 w-12 rounded-full bg-white/20"></div>
        </div>
        
        {/* Content */}
        <div className="relative px-8 py-12 text-center text-white">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          
          <h2 className="mb-3 text-2xl font-bold">Welcome to Doctora</h2>
          <p className="mx-auto max-w-md text-teal-100 leading-relaxed">
            Join thousands of patients who trust us for faster, better healthcare. 
            Get personalized care from certified professionals.
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-teal-100">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-300"></span>
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-300"></span>
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </div>
    );
  }