'use client'
import React from "react"
import { Calendar } from "@/components/ui/calendar"

const Schedule = ({ onChange }: { onChange?: (d: Date | undefined) => void }) => {
  const [date, setDate] = React.useState<Date | undefined>()

  // วันพรุ่งนี้
  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const handleSelect = (d: Date | undefined) => {
    setDate(d)
    onChange?.(d)
  }

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleSelect}
      // ✅ disable วันก่อนหน้าและวันนี้
      disabled={{ before: tomorrow }}
      className="rounded-lg border"
    />
  )
}

export default Schedule
