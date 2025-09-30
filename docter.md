📊 Doctor Profile Management:

  - GET /api/doctors/me - ดูโปรไฟล์ตนเอง (แต่ยังไม่ได้ map @GetMapping)
  - PUT /api/doctors/me - อัพเดทโปรไฟล์

  📅 Appointment Management:

  - GET /api/appointments/my - ผู้ป่วยดูนัดหมายตนเอง
  - POST /api/appointments/with-patient-info - จองนัดหมาย
  - PUT /api/appointments/{id}/cancel - ยกเลิกนัดหมาย

  👥 Doctor Information (Public):

  - GET /api/doctors - ค้นหาหมอ (แบบ advanced search)
  - GET /api/doctors/{id} - ดูโปรไฟล์หมอ
  - GET /api/doctors/stats - สถิติหมอ
  - GET /api/doctors/by-specialty - หมอตาม specialty

  ❌ API ที่ยังขาดหายไป:

  1. GET /api/appointments/doctor/my - แพทย์ดูนัดหมายตนเอง
  2. PUT /api/appointments/{id}/confirm - ยืนยันนัดหมาย
  3. PUT /api/appointments/{id}/complete - ทำเครื่องหมายเสร็จ
  4. PUT /api/appointments/{id}/add-notes - เพิ่มหมายเหตุแพทย์

  🎯 หน้า Doctor ที่ควรสร้าง (เรียงตามความสำคัญ):

  1. Doctor Dashboard - หน้าหลัก ✅ สร้างได้เลย

  - แสดงสถิติจาก GET /api/doctors/stats
  - แสดงนัดหมายใหม่ (เมื่อมี API)
  - แสดงโปรไฟล์พื้นฐานจาก GET /api/doctors/me

  2. Doctor Profile Management ✅ สร้างได้เลย

  - ดูโปรไฟล์จาก GET /api/doctors/me
  - แก้ไขโปรไฟล์ด้วย PUT /api/doctors/me

  3. Appointment Management ⚠️ ต้องเพิ่ม API ก่อน

  - ต้องสร้าง API ใหม่สำหรับแพทย์
  - จัดการสถานะนัดหมาย
  - เพิ่มหมายเหตุแพทย์