import React, { useRef } from 'react';
import { Upload as UploadIcon, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils/cn';

interface UploadProps {
  onImageSelected: (dataUrl: string) => void;
  className?: string;
}

export function Upload({ onImageSelected, className }: UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageSelected(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className={cn(
        "border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors",
        className
      )}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/jpeg, image/png, image/webp" 
        onChange={handleFileChange}
      />
      <div className="flex justify-center mb-4 text-blue-500">
        <UploadIcon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Photo</h3>
      <p className="text-sm text-gray-500 mb-6">
        Supported formats: JPG, PNG, WEBP
      </p>
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mx-auto">
        <ImageIcon size={18} />
        Browse Files
      </button>
    </div>
  );
}
