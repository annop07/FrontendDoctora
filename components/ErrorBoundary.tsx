'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-600 p-6 text-white text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <h2 className="text-xl font-bold">เกิดข้อผิดพลาด</h2>
              <p className="text-red-100 text-sm mt-1">แอปพลิเคชันพบปัญหาที่ไม่คาดคิด</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  ขออภัย เกิดข้อผิดพลาดในการโหลดหน้านี้ กรุณาลองรีเฟรชหน้าหรือกลับไปหน้าหลัก
                </p>

                {/* Error details for development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-left bg-gray-50 rounded-lg p-4 mb-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                      รายละเอียดข้อผิดพลาด (Development)
                    </summary>
                    <pre className="text-xs text-red-600 overflow-auto max-h-32">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  รีเฟรชหน้า
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <Home className="w-4 h-4" />
                  หน้าหลัก
                </button>
              </div>

              {/* Help text */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  หากปัญหายังคงอยู่ กรุณาติดต่อทีมสนับสนุน
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;