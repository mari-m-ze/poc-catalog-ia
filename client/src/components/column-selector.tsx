import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface ColumnOption {
  id: string;
  label: string;
  defaultChecked: boolean;
}

interface ColumnSelectorProps {
  options: ColumnOption[];
  selectedColumns: string[];
  onChange: (selectedColumns: string[]) => void;
}

export function ColumnSelector({ options, selectedColumns, onChange }: ColumnSelectorProps) {
  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedColumns, id]);
    } else {
      onChange(selectedColumns.filter(columnId => columnId !== id));
    }
  };
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={`column-${option.id}`}
            checked={selectedColumns.includes(option.id)}
            onCheckedChange={(checked) => handleCheckboxChange(option.id, checked as boolean)}
            className="h-4 w-4 rounded border-gray-300 data-[state=checked]:bg-beer-gold data-[state=checked]:text-white hover:border-beer-gold"
          />
          <label
            htmlFor={`column-${option.id}`}
            className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900"
          >
            {option.label}
          </label>
        </div>
      ))}
    </div>
  );
}
