'use client'
import React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Slot } from "@radix-ui/react-slot"

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
      className="rounded-lg border w-full [--cell-size:3rem] text-base"
    />
  )
}

export default Schedule
