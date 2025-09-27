import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AuthProvider } from '@/context/auth-context'

export const metadata = {
  title: 'Doctora - ระบบจองนัดหมายแพทย์',
  description: 'ระบบจองนัดหมายแพทย์ออนไลน์ที่ทันสมัย ปลอดภัย และใช้งานง่าย',
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="th">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}