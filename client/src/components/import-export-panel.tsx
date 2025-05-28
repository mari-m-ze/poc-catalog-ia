import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FileInput } from '@/components/ui/file-input';
import { Button } from '@/components/ui/button';
import { useCSV } from '@/hooks/use-csv';
import { useProducts } from '@/hooks/use-products';
import { CSVBeerProduct } from '@shared/schema';
import { ColumnSelector } from '@/components/column-selector';
import { downloadCSV } from '@/lib/utils';
import { 
  Cloud, 
  Download, 
  FileDown, 
  Import, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ImportExportPanel() {
  const { toast } = useToast();
  const { parseCSV } = useCSV();
  const { products, importProducts, exportProducts } = useProducts();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const columnOptions = [
    { id: "product_id", label: "product_id", defaultChecked: true },
    { id: "product_variant", label: "product_variant", defaultChecked: true },
    { id: "nome_sku", label: "nome_sku", defaultChecked: true },
    { id: "volume_hectolitros", label: "volume_hectolitros", defaultChecked: true },
    { id: "marca", label: "marca", defaultChecked: true },
    { id: "descricao_sku", label: "descricao_sku", defaultChecked: false },
    { id: "tamanho", label: "tamanho", defaultChecked: true },
    { id: "embalagem", label: "embalagem", defaultChecked: true },
    { id: "retornavel", label: "retornavel", defaultChecked: true },
    { id: "origem", label: "origem", defaultChecked: true },
    { id: "teor_alcoolico", label: "teor_alcoolico", defaultChecked: true },
    { id: "tipo", label: "tipo", defaultChecked: true },
    { id: "tags", label: "tags", defaultChecked: false },
    { id: "classificacao", label: "classificacao", defaultChecked: true },
    { id: "ai_enhanced", label: "ai_enhanced", defaultChecked: false }
  ];

  // Initialize selectedColumns with defaultChecked options
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columnOptions.filter(option => option.defaultChecked).map(option => option.id)
  );
  
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setUploadError('No file selected');
      return;
    }
    
    const file = files[0];
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      const text = await file.text();
      const { data: parsedProducts, errors: csvErrors } = parseCSV<CSVBeerProduct>(text);
      
      if (csvErrors.length > 0) {
        // Exibir erros de forma mais amigável
        const errorMessage = csvErrors.length > 3 
          ? `${csvErrors.length} erros foram encontrados no CSV. Primeiros erros: ${csvErrors.slice(0, 3).map(e => e.message).join(', ')}...` 
          : `Erros no CSV: ${csvErrors.map(e => e.message).join(', ')}`;
          
        setUploadError(errorMessage);
        throw new Error(errorMessage);
      }
      
      if (parsedProducts.length === 0) {
        throw new Error('Nenhum produto válido encontrado no CSV');
      }
      
      await importProducts(parsedProducts);
      
      setUploadSuccess(true);
      toast({
        title: 'Importação bem-sucedida',
        description: `${parsedProducts.length} produtos importados com sucesso.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Import error:', error);
      setUploadError(error instanceof Error ? error.message : 'Erro desconhecido durante a importação');
      toast({
        title: 'Falha na importação',
        description: error instanceof Error ? error.message : 'Erro desconhecido durante a importação',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [parseCSV, importProducts, toast]);
  
  const handleColumnChange = (columns: string[]) => {
    setSelectedColumns(columns);
  };
  
  const handleExportCSV = async () => {
    try {
      if (selectedColumns.length === 0) {
        toast({
          title: 'Export Failed',
          description: 'Please select at least one column to export',
          variant: 'destructive',
        });
        return;
      }
      
      const result = await exportProducts(selectedColumns);
      
      if (result.length === 0) {
        toast({
          title: 'Export Failed',
          description: 'No products to export',
          variant: 'destructive',
        });
        return;
      }
      
      downloadCSV(result, 'beer-products.csv');
      
      toast({
        title: 'Export Successful',
        description: `${result.length} products exported successfully.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error during export',
        variant: 'destructive',
      });
    }
  };
  
  const handleExportSelected = async () => {
    try {
      if (selectedColumns.length === 0) {
        toast({
          title: 'Export Failed',
          description: 'Please select at least one column to export',
          variant: 'destructive',
        });
        return;
      }
      
      // This would typically be adapted to handle selected rows, for now just export all
      const result = await exportProducts(selectedColumns);
      
      if (result.length === 0) {
        toast({
          title: 'Export Failed',
          description: 'No products to export',
          variant: 'destructive',
        });
        return;
      }
      
      downloadCSV(result, 'selected-beer-products.csv');
      
      toast({
        title: 'Export Successful',
        description: `${result.length} products exported successfully.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error during export',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="p-8 space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="import">
            <AccordionTrigger className="px-6 py-4">
              <div className="flex items-center gap-2">
                <Import className="h-5 w-5" />
                <span className="text-lg font-medium font-inter text-dark-gray">Import Products</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <FileInput
                accept=".csv"
                onChange={handleFileUpload}
                isError={!!uploadError}
                errorMessage={uploadError || undefined}
                isDragActive={isUploading}
              />
              
              {uploadSuccess && (
                <div className="mt-4 flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <p className="text-sm">Import successful</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="export">
            <AccordionTrigger className="px-6 py-4">
              <div className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                <span className="text-lg font-medium font-inter text-dark-gray">Export Products</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-500 mb-4">Select columns to include in your export</p>
                
                <ColumnSelector
                  options={columnOptions}
                  selectedColumns={selectedColumns}
                  onChange={setSelectedColumns}
                />
                
                <div className="mt-6 flex space-x-3">
                  <Button 
                    className="flex-1 bg-beer-gold hover:bg-amber-600"
                    onClick={handleExportCSV}
                    disabled={selectedColumns.length === 0}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700"
                    onClick={handleExportSelected}
                    disabled={selectedColumns.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
