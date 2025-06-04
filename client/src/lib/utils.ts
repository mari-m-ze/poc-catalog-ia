import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function truncate(str: string, length: number): string {
  if (!str) return "";
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function downloadCSV(data: any[], filename: string): void {
  const csvContent = convertToCSV(data);
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  
  link.click();
  
  document.body.removeChild(link);
}

export function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return '';
  }
  
  const headers = Object.keys(data[0]);
  
  const headerRow = headers.join(',');
  
  const rows = data.map(obj => {
    return headers.map(header => {
      const value = obj[header];
      
      if (value === null || value === undefined) {
        return '';
      }
      
      // Special handling for volume_hectolitros
      if (header === 'volume_hectolitros') {
        // If it's a number, format it with proper decimal places
        if (typeof value === 'number') {
          // Remove trailing zeros after decimal point but keep at least 5 decimal places
          return Number(value).toFixed(5).replace(/\.?0+$/, '');
        }
        // If it's already a string, return as is
        return value;
      }
      
      // Handle other numbers to preserve exact decimal places
      if (typeof value === 'number') {
        // Convert to string without scientific notation and preserve decimal places
        return value.toString().includes('e') ? value.toFixed(20) : value.toString();
      }
      
      // Convert to string and handle special characters
      const cellStr = value.toString();
      
      // If the cell contains commas, quotes, or newlines, wrap in quotes and escape existing quotes
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') || cellStr.includes('\r')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      
      return cellStr;
    }).join(',');
  });
  
  // Combine header row and data rows
  return [headerRow, ...rows].join('\n');
}

export function getColorForBrand(brand: string): string {
  const brands: Record<string, string> = {
    "Brahma": "yellow-400",
    "Skol": "yellow-300",
    "Antarctica": "blue-400",
    "Stella Artois": "red-600",
    "Budweiser": "red-500",
    "Corona": "yellow-200",
    "Bohemia": "amber-700",
    "Colorado": "amber-600",
    "Beck's": "green-600",
    "Caracu": "brown-700",
    "Eisenbahn": "amber-800",
    "Original": "amber-500",
    "Goose Island": "blue-600",
    "Hoegaarden": "yellow-100",
    "Leffe": "amber-400",
    "Michelob Ultra": "blue-300",
    "Patagonia": "teal-500",
    "Serra Malte": "amber-300",
    "Spaten": "red-700",
    "Wäls": "purple-600"
  };
  
  return brands[brand] || "gray-400";
}

export function getColorForClassification(classification: string): string {
  const colors: Record<string, string> = {
    "Populares": "yellow-400",
    "Artesanais": "amber-700",
    "Sem álcool": "blue-400",
    "Sem glútem": "green-400",
    "Retornáveis": "orange-400",
    "Chopp": "red-400"
  };
  
  return colors[classification] || "gray-400";
}
