import { useCallback } from 'react';

export function useCSV() {
  const parseCSV = useCallback(<T,>(csvText: string): {
    data: T[],
    errors: { line: number, message: string }[]
  } => {
    const errors: { line: number, message: string }[] = [];
    
    // Split the CSV text into lines, preserving empty lines that might be part of quoted values
    const lines = csvText.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return { data: [], errors: [{ line: 0, message: 'O arquivo CSV está vazio' }] };
    }
    
    // Extract headers (first line)
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Verificar se os cabeçalhos necessários estão presentes
    const requiredHeaders = ['product_id', 'nome_sku'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return { 
        data: [], 
        errors: [{ 
          line: 0, 
          message: `Cabeçalhos obrigatórios ausentes: ${missingHeaders.join(', ')}` 
        }] 
      };
    }
    
    // Parse CSV rows into objects
    const result: T[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '') {
        continue;
      }
      
      // Parse CSV line handling quoted values
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            // Handle escaped quotes inside quoted values
            currentValue += '"';
            j++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Add the last value
      values.push(currentValue);
      
      if (values.length !== headers.length) {
        errors.push({
          line: i + 1,
          message: `A linha ${i + 1} tem ${values.length} valores, esperados ${headers.length}`
        });
        continue;
      }
      
      // Create object from headers and values
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        let value = values[index].trim();
        
        // Handle special case for volume_hectolitros
        if (header === 'volume_hectolitros' && value) {
          // Validate if it's a valid number
          if (isNaN(Number(value))) {
            errors.push({
              line: i + 1,
              message: `Volume inválido na linha ${i + 1}: ${value}`
            });
          }
        }
        
        // Preserve empty strings but convert "null" and "undefined" to empty string
        obj[header] = value === "null" || value === "undefined" ? "" : value;
      });
      
      // Validações básicas
      let hasError = false;
      if (!obj.product_id) {
        errors.push({ line: i + 1, message: `A linha ${i + 1} não possui um product_id válido` });
        hasError = true;
      }
      
      if (!obj.nome_sku) {
        errors.push({ line: i + 1, message: `A linha ${i + 1} não possui um nome_sku válido` });
        hasError = true;
      }
      
      if (!hasError) {
        result.push(obj as unknown as T);
      }
    }
    
    return { data: result, errors };
  }, []);
  
  return {
    parseCSV,
  };
}
