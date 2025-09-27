"use client";
import { useRef, useState } from "react";

type UploadBoxProps = {
    name?: string;
  accept?: string;        // เช่น "image/*,.pdf"
  multiple?: boolean;     // เลือกหลายไฟล์ได้ไหม
  onChange?: (files: File[]) => void;
};

export default function UploadBox({
  accept = "image/*,.pdf",
  multiple = true,
  onChange,
}: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList);
    setFiles(arr);
    onChange?.(arr);
  };

  return (
    <div className="space-y-3">
      {/* กล่องอัปโหลด */}
      <div
        className={[
          "w-full rounded-md border-2 border-dashed mt-5",
          dragOver ? "border-sky-400 bg-sky-50/50" : "border-gray-300",
          "h-16 flex items-center justify-center cursor-pointer select-none",
        ].join(" ")}
        onClick={handlePick}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <span className="text-gray-500 text-sm">
          <span className="mr-1 text-lg">＋</span>
          แนบไฟล์รูปภาพหรือเอกสารประกอบแผล (ไม่บังคับ)
        </span>
        <input
          ref={inputRef}
          type="file"
          name="attachments"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* รายชื่อไฟล์ที่เลือก */}
      {files.length > 0 && (
        <ul className="text-sm text-gray-700 space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="truncate">{f.name}</span>
              <span className="text-gray-400 ml-2">
                {(f.size / 1024).toFixed(0)} KB
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
