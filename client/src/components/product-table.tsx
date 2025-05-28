import React, { useState, useMemo, useCallback } from 'react';
import { 
  BeerProduct, 
  marcas, 
  classificacoes 
} from '@shared/schema';
import { 
  Check, 
  Edit, 
  Beer, 
  Sparkles,
  AlertCircle,
  Tag,
  FileText,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { getColorForBrand } from '@/lib/utils';
import { ProductDetails } from './product-details';

interface ProductTableProps {
  onEditProduct: (product: BeerProduct) => void;
  initialCategory?: string;
}

export function ProductTable({ onEditProduct, initialCategory }: ProductTableProps) {
  const { toast } = useToast();
  const { products, isLoading, enhanceProduct, isEnhancing, deleteProducts, isDeleting } = useProducts();
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedAiStatus, setSelectedAiStatus] = useState('');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<BeerProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<BeerProduct | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const pageSize = 10;
  
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesBrand = (!selectedBrand || selectedBrand === 'all') ? true : product.marca === selectedBrand;
      const matchesAiStatus = (!selectedAiStatus || selectedAiStatus === 'all') 
        ? true 
        : selectedAiStatus === 'enhanced' ? product.ai_enhanced : !product.ai_enhanced;
      const matchesSearch = !searchTerm 
        ? true 
        : product.nome_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.marca.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesBrand && matchesAiStatus && matchesSearch;
    });
  }, [products, selectedBrand, selectedAiStatus, searchTerm]);
  
  const paginatedProducts = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, page, pageSize]);
  
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  
  const brandOptions = useMemo(() => {
    return marcas.map(marca => ({
      label: marca,
      value: marca
    }));
  }, []);
  
  const aiStatusOptions = useMemo(() => {
    return [
      { label: "AI Enhanced", value: "enhanced" },
      { label: "Needs Enhancement", value: "not_enhanced" }
    ];
  }, []);

  const handleSelectedItemsChange = useCallback((items: BeerProduct[]) => {
    setSelectedItems(items);
  }, []);
  
  const handleEnhanceProducts = async () => {
    // Filtramos para pegar apenas produtos que não foram aprimorados
    const productsToEnhance = selectedItems.filter(product => !product.ai_enhanced);
    
    if (productsToEnhance.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione produtos que ainda não foram aprimorados.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Iniciando aprimoramento",
      description: `Aprimorando ${productsToEnhance.length} produtos... Isso pode levar alguns minutos.`,
    });
    
    try {
      // Primeiro aprimoramos as descrições
      for (const product of productsToEnhance) {
        await enhanceProduct({ productId: product.product_id, enhancementType: "description" });
      }
      
      toast({
        title: "Descrições aprimoradas",
        description: "Aprimorando campos de informações...",
      });
      
      // Depois aprimoramos os campos de informação
      for (const product of productsToEnhance) {
        await enhanceProduct({ productId: product.product_id, enhancementType: "fields" });
      }
      
      toast({
        title: "Informações aprimoradas",
        description: "Aprimorando tags...",
      });
      
      // Por fim, aprimoramos as tags
      for (const product of productsToEnhance) {
        await enhanceProduct({ productId: product.product_id, enhancementType: "tags" });
      }
      
      toast({
        title: "Aprimoramento concluído",
        description: `${productsToEnhance.length} produtos foram aprimorados com sucesso!`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao aprimorar produtos:", error);
      toast({
        title: "Erro no aprimoramento",
        description: error instanceof Error ? error.message : "Ocorreu um erro durante o aprimoramento dos produtos.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteProducts = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione os produtos que deseja excluir.",
        variant: "destructive",
      });
      return;
    }

    try {
      const productIds = selectedItems.map(item => item.product_id);
      await deleteProducts(productIds);
      
      toast({
        title: "Produtos excluídos",
        description: `${selectedItems.length} produtos foram excluídos com sucesso!`,
      });

      // Limpar seleção após exclusão
      setSelectedItems([]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir os produtos selecionados.",
        variant: "destructive",
      });
    }
  };
  
  const columns = [
    {
      id: 'product',
      header: 'Product',
      sortable: true,
      cell: (product: BeerProduct) => (
        <div className="flex items-center">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center`}>
            <Beer className="h-6 w-6 text-beer-gold" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{product.nome_sku}</div>
            <div className="text-sm text-gray-500">{product.product_id}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'brand',
      header: 'Brand',
      sortable: true,
      cell: (product: BeerProduct) => (
        <div>
          <div className="text-sm text-gray-900">{product.marca}</div>
          <div className="text-sm text-gray-500">{product.classificacao}</div>
        </div>
      ),
    },
    {
      id: 'packaging',
      header: 'Packaging',
      sortable: true,
      cell: (product: BeerProduct) => (
        <div>
          <div className="text-sm text-gray-900">{product.embalagem}</div>
          <div className="text-sm text-gray-500">
            <span>{product.retornavel === 'Sim' ? 'Retornável' : 'Não retornável'}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'size',
      header: 'Size',
      sortable: true,
      cell: (product: BeerProduct) => (
        <div>
          <div className="text-sm text-gray-900">{product.tamanho}</div>
          <div className="text-sm text-gray-500">{product.volume_hectolitros} hl</div>
        </div>
      ),
    },
    {
      id: 'ai_status',
      header: 'AI Status',
      sortable: true,
      cell: (product: BeerProduct) => (
        <Badge
          variant={product.ai_enhanced ? 'success' : 'warning'}
        >
          {product.ai_enhanced ? 'AI Enhanced' : 'Needs Enhancement'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (product: BeerProduct) => (
        <div className="text-right space-x-2">
          <Button
            variant="outline"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setSelectedProduct(product);
              setIsDetailsOpen(true);
            }}
            className="text-beer-gold hover:bg-beer-gold/10"
          >
            <FileText size={16} className="mr-1" />
            View details
          </Button>
        </div>
      ),
    },
  ];
  
  const filters = [
    {
      id: 'brand',
      label: 'Brands',
      options: brandOptions,
      value: selectedBrand,
      onChange: setSelectedBrand,
    },
    {
      id: 'ai_status',
      label: 'AI Status',
      options: aiStatusOptions,
      value: selectedAiStatus,
      onChange: setSelectedAiStatus,
    },
  ];
  
  const pagination = {
    currentPage: page,
    totalPages,
    totalItems: filteredProducts.length,
    pageSize,
    onPageChange: setPage,
  };
  
  return (
    <div className="px-8 pb-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-medium font-inter text-dark-gray">Product Catalog</h2>
          
          <div className="flex items-center space-x-3">
            {/* Botão para aprimorar produtos selecionados */}
            <Button 
              variant="default" 
              className="bg-beer-gold hover:bg-amber-600 flex items-center"
              onClick={handleEnhanceProducts}
              disabled={isEnhancing || selectedItems.filter(item => !item.ai_enhanced).length === 0}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Aprimorar Selecionados
            </Button>
            
            
            
            
          </div>
        </div>
        
        {isEnhancing && (
          <div className="bg-amber-50 p-3 flex items-center justify-center border-b border-amber-200">
            <Sparkles className="h-5 w-5 text-amber-600 animate-pulse mr-2" />
            <span className="text-amber-800">Aprimorando produtos com IA... Isso pode levar alguns minutos.</span>
          </div>
        )}
        
        <DataTable
          data={paginatedProducts}
          columns={columns}
          onRowClick={onEditProduct}
          selectable
          onSelectedItemsChange={handleSelectedItemsChange}
          filters={filters}
          pagination={pagination}
          searchable
          onSearch={setSearchTerm}
        />
        
        {selectedItems.length > 0 && (
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                <b>{selectedItems.length}</b> produtos selecionados 
                <span className="ml-2 text-gray-500">
                  ({selectedItems.filter(item => !item.ai_enhanced).length} não aprimorados)
                </span>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => setSelectedItems([])}
                >
                  Limpar Seleção
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={handleEnhanceProducts}
                  disabled={isEnhancing || selectedItems.filter(item => !item.ai_enhanced).length === 0}
                >
                  <span className="flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    <span className="mr-1">→</span>
                    <Tag className="h-3 w-3" />
                  </span>
                </Button>

                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="text-xs"
                  onClick={handleDeleteProducts}
                >
                  <span className="flex items-center">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir ({selectedItems.length})
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ProductDetails
        product={selectedProduct}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedProduct(null);
        }}
        onProductUpdate={(updatedProduct) => {
          // Update the selected product in the table
          setSelectedProduct(updatedProduct);
        }}
      />
    </div>
  );
}
