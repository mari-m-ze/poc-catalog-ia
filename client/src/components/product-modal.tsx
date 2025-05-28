import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BeerProduct, 
  tamanhos, 
  embalagens, 
  marcas, 
  classificacoes, 
  retornaveis, 
  origens, 
  teoresAlcoolicos,
  tipos
} from '@shared/schema';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { Beer, X, Zap, Tag, PlusCircle, Edit } from 'lucide-react';

interface ProductModalProps {
  product: BeerProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { updateProduct, enhanceProduct } = useProducts();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<BeerProduct>>({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementType, setEnhancementType] = useState<'description' | 'tags' | 'fields' | null>(null);
  
  useEffect(() => {
    if (product) {
      setFormData({ ...product });
    } else {
      setFormData({});
    }
  }, [product]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
    if (!product) return;
    
    try {
      await updateProduct(product.product_id, formData);
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    }
  };
  
  const handleEnhance = async (type: 'description' | 'tags' | 'fields' | 'all' | 'complete') => {
    if (!product) return;
    
    setIsEnhancing(true);
    setEnhancementType(type === 'all' || type === 'complete' ? null : type);
    
    try {
      const enhanced = await enhanceProduct({ 
        productId: product.product_id, 
        enhancementType: type 
      });
      
      if (enhanced) {
        setFormData(enhanced);
        toast({
          title: 'Success',
          description: `${type === 'all' || type === 'complete' ? 'Product' : type} enhanced successfully`,
        });
      }
    } catch (error) {
      console.error('Error enhancing product:', error);
      toast({
        title: 'Error',
        description: `Failed to enhance ${type === 'all' || type === 'complete' ? 'product' : type}`,
        variant: 'destructive',
      });
    } finally {
      setIsEnhancing(false);
      setEnhancementType(null);
    }
  };
  
  if (!product) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-beer-gold bg-opacity-20 sm:mx-0 sm:h-10 sm:w-10">
              <Beer className="h-6 w-6 text-beer-gold" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <DialogTitle className="flex justify-between items-center">
                <span>{formData.nome_sku}</span>
                <Badge variant={formData.ai_enhanced ? 'success' : 'warning'}>
                  {formData.ai_enhanced ? 'AI Enhanced' : 'Needs Enhancement'}
                </Badge>
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="border-b border-gray-200 pb-5">
            <div className="flex flex-col sm:flex-row sm:space-x-6">
              <div className="sm:w-1/3 mb-4 sm:mb-0">
                <div className="bg-beer-gold bg-opacity-10 rounded-lg p-4 h-full flex flex-col justify-center items-center">
                  <Beer className="h-24 w-24 text-beer-gold" />
                  <div className="mt-3 text-sm text-center text-gray-500">
                    Product ID: {formData.product_id}
                  </div>
                </div>
              </div>
              
              <div className="sm:w-2/3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Brand</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Select
                        value={formData.marca || ''}
                        onValueChange={(value) => handleSelectChange('marca', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {marcas.map((marca) => (
                            <SelectItem key={marca} value={marca}>
                              {marca}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Classification
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Select
                        value={formData.classificacao || ''}
                        onValueChange={(value) => handleSelectChange('classificacao', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                        <SelectContent>
                          {classificacoes.map((classificacao) => (
                            <SelectItem key={classificacao} value={classificacao}>
                              {classificacao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Size</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Select
                        value={formData.tamanho || ''}
                        onValueChange={(value) => handleSelectChange('tamanho', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {tamanhos.map((tamanho) => (
                            <SelectItem key={tamanho} value={tamanho}>
                              {tamanho}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Packaging</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Select
                        value={formData.embalagem || ''}
                        onValueChange={(value) => handleSelectChange('embalagem', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select packaging" />
                        </SelectTrigger>
                        <SelectContent>
                          {embalagens.map((embalagem) => (
                            <SelectItem key={embalagem} value={embalagem}>
                              {embalagem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Origin</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Select
                        value={formData.origem || ''}
                        onValueChange={(value) => handleSelectChange('origem', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select origin" />
                        </SelectTrigger>
                        <SelectContent>
                          {origens.map((origem) => (
                            <SelectItem key={origem} value={origem}>
                              {origem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Alcohol Content
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Select
                        value={formData.teor_alcoolico || ''}
                        onValueChange={(value) => handleSelectChange('teor_alcoolico', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select alcohol content" />
                        </SelectTrigger>
                        <SelectContent>
                          {teoresAlcoolicos.map((teor) => (
                            <SelectItem key={teor} value={teor}>
                              {teor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Beer Type
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Select
                        value={formData.tipo || ''}
                        onValueChange={(value) => handleSelectChange('tipo', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select beer type" />
                        </SelectTrigger>
                        <SelectContent>
                          {tipos.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Volume (hectolitros)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      type="text"
                      name="volume_hectolitros"
                      value={formData.volume_hectolitros || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <Textarea
                  name="descricao_sku"
                  rows={4}
                  value={formData.descricao_sku || ''}
                  onChange={handleChange}
                  className="focus:ring-beer-gold focus:border-beer-gold"
                />
                {formData.ai_enhanced && (
                  <div className="absolute top-0 right-0 mt-2 mr-2">
                    <Badge variant="ai">
                      <span className="flex items-center">
                        <Zap className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="relative">
                <Input
                  type="text"
                  name="tags"
                  value={formData.tags || ''}
                  onChange={handleChange}
                />
                {formData.ai_enhanced && (
                  <div className="absolute top-0 right-0 mt-2 mr-2">
                    <Badge variant="ai">
                      <span className="flex items-center">
                        <Zap className="h-3 w-3 mr-1" />
                        AI Generated
                      </span>
                    </Badge>
                  </div>
                )}
              </div>
              
              {formData.tags && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.split(',').slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800">
                      {tag.trim()}
                      <button
                        type="button"
                        className="ml-1 inline-flex text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          const tags = formData.tags?.split(',').filter((t, i) => i !== index).join(',');
                          setFormData(prev => ({ ...prev, tags }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {formData.tags.split(',').length > 3 && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                      +{formData.tags.split(',').length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Enhancement Options</h4>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="default"
                className="bg-[#2E8B57] hover:bg-green-700"
                onClick={() => handleEnhance('description')}
                disabled={isEnhancing}
              >
                <Zap className="mr-2 h-4 w-4" />
                {isEnhancing && enhancementType === 'description' ? 'Enhancing...' : 'Enhance Description'}
              </Button>
              
              <Button
                variant="default"
                className="bg-[#2E8B57] hover:bg-green-700"
                onClick={() => handleEnhance('tags')}
                disabled={isEnhancing}
              >
                <Tag className="mr-2 h-4 w-4" />
                {isEnhancing && enhancementType === 'tags' ? 'Generating...' : 'Generate Tags'}
              </Button>
              
              <Button
                variant="default"
                className="bg-[#2E8B57] hover:bg-green-700"
                onClick={() => handleEnhance('fields')}
                disabled={isEnhancing}
              >
                <Edit className="mr-2 h-4 w-4" />
                {isEnhancing && enhancementType === 'fields' ? 'Gerando...' : 'Gerar Campos'}
              </Button>
              
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700"
                onClick={() => handleEnhance('complete')}
                disabled={isEnhancing}
              >
                <Zap className="mr-2 h-4 w-4" />
                {isEnhancing && enhancementType === null ? 'Aprimorando...' : 'Aprimorar Tudo'}
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            className="w-full sm:w-auto bg-beer-gold hover:bg-amber-600"
            onClick={handleSave}
          >
            Save Changes
          </Button>
          <Button
            variant="outline"
            className="mt-3 w-full sm:w-auto sm:mt-0 border-gray-300"
            onClick={onClose}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
