import React, { useState } from 'react';
import { Sidebar } from '../components/sidebar';
import { FileInput } from '../components/ui/file-input';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { Download, FileDown, Loader2 } from 'lucide-react';

export function WineAttributesPage() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum arquivo selecionado',
        variant: 'destructive',
      });
      return;
    }

    const file = files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: 'Erro',
        description: 'Por favor, faça upload de um arquivo CSV',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/wines/attributes/process-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao processar arquivo');
      }

      const data = await response.json();
      setDownloadUrl(data.downloadUrl);
      toast({
        title: 'Sucesso',
        description: `${data.totalProcessed} produtos processados com sucesso`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao processar arquivo',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-semibold font-inter text-dark-gray">
              Processamento de Vinhos
            </h1>
            <p className="text-sm text-gray-500">
              Upload de CSV para processamento de atributos de vinhos
            </p>
          </div>
        </div>

        <div className="p-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Upload Section */}
              <div>
                <h2 className="text-lg font-medium font-inter text-dark-gray mb-4">
                  Upload de CSV
                </h2>
                <FileInput
                  accept=".csv"
                  onChange={handleFileUpload}
                  isDragActive={isProcessing}
                  disabled={isProcessing}
                />
                {isProcessing && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-forest-green">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processando arquivo...</span>
                  </div>
                )}
              </div>

              {/* Download Section */}
              {downloadUrl && (
                <div className="pt-4 border-t">
                  <h2 className="text-lg font-medium font-inter text-dark-gray mb-4">
                    Download do Resultado
                  </h2>
                  <Button
                    className="w-full !bg-forest-green hover:!bg-green-700 !text-white font-medium"
                    onClick={() => window.location.href = downloadUrl}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Baixar CSV Processado
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
