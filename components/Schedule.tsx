'use client'
import React from "react"
import { Calendar } from "@/components/ui/calendar"

const Schedule = ({ onChange }: { onChange?: (d: Date | undefined) => void }) => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
  
    const handleSelect = (d: Date | undefined) => {
      setDate(d)
      onChange?.(d)
    }
  
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleSelect}
        className="rounded-lg border"
      />
    )
  }
  
  export default Schedule   
  