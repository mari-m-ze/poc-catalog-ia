import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (files: FileList | null) => void;
  onFileDrop?: (files: FileList) => void;
  accept?: string;
  isDragActive?: boolean;
  isError?: boolean;
  errorMessage?: string;
  helpText?: string;
  className?: string;
  children?: React.ReactNode;
}

export function FileInput({
  onChange,
  onFileDrop,
  accept = '',
  isDragActive: externalIsDragActive,
  isError,
  errorMessage,
  helpText,
  className,
  children,
  ...props
}: FileInputProps) {
  const [internalIsDragActive, setInternalIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isDragActive = externalIsDragActive !== undefined ? externalIsDragActive : internalIsDragActive;

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setInternalIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setInternalIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setInternalIsDragActive(false);
    
    if (e.dataTransfer.files.length > 0) {
      if (onChange) {
        onChange(e.dataTransfer.files);
      }
      
      if (onFileDrop) {
        onFileDrop(e.dataTransfer.files);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
      }
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg cursor-pointer",
          isDragActive ? "bg-amber-50" : "bg-gray-50",
          isError ? "border-red-500" : "border-beer-gold",
          "border-2 border-dashed p-8 transition-colors duration-150",
          className
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {children || (
          <>
            <svg 
              className="w-12 h-12 text-beer-gold mb-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <p className="text-sm text-gray-500">
              Drag & drop your CSV file here or <span className="text-beer-gold font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">Supported format: CSV</p>
          </>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          className="hidden"
          accept={accept}
          {...props}
        />
      </div>
      
      {isError && errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
      
      {helpText && !isError && (
        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
