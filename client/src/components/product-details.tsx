import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BeerProduct } from '@shared/schema';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { Beer, X, Zap, Tag, PlusCircle, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductDetailsProps {
  product: BeerProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdate: (product: BeerProduct) => void;
}

export function ProductDetails({ product, isOpen, onClose, onProductUpdate }: ProductDetailsProps) {
  const { updateProduct, enhanceProduct } = useProducts();
  const { toast } = useToast();
  
  const [originalProduct, setOriginalProduct] = useState<BeerProduct | null>(null);
  const [formData, setFormData] = useState<Partial<BeerProduct>>({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementType, setEnhancementType] = useState<'description' | 'tags' | 'fields' | 'all' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    if (product) {
      // Store the original product data when the modal opens
      setOriginalProduct(product);
      setFormData({ ...product });
      setIsEditing(false);
    } else {
      setOriginalProduct(null);
      setFormData({});
    }
  }, [product]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsEditing(true);
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    if (originalProduct) {
      // Reset form data back to original product data
      setFormData({ ...originalProduct });
      // Reset editing state
      setIsEditing(false);
      // Reset enhancement states
      setIsEnhancing(false);
      setEnhancementType(null);
      // Update the parent component with the original data
      onProductUpdate(originalProduct);
      
      toast({
        title: 'Changes Discarded',
        description: 'All changes have been reset to the original values',
      });
    }
    // Always close the modal
    onClose();
  };
  
  const handleSave = async () => {
    if (!product?.product_id || !formData) {
      toast({
        title: 'Error',
        description: 'Invalid product data',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Remove product_id from the update data
      const { product_id, ...updateData } = formData;
      
      await updateProduct({
        productId: product.product_id,
        updates: {
          ...updateData,
          ai_enhanced: updateData.ai_enhanced ?? false
        }
      });
      
      // Update the original product data after successful save
      setOriginalProduct({ ...formData as BeerProduct });
      // Update the parent component
      onProductUpdate(formData as BeerProduct);
      
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      setIsEditing(false);
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
  
  const handleEnhance = async (type: 'description' | 'tags' | 'fields' | 'all') => {
    if (!product?.product_id) return;
    
    setIsEnhancing(true);
    setEnhancementType(type === 'all' ? null : type);
    
    try {
      // Map UI type to API type
      const apiType = type === 'all' ? 'complete' : type === 'fields' ? 'fields' : type;
      
      const enhanced = await enhanceProduct({
        productId: product.product_id,
        enhancementType: apiType
      });
      
      if (enhanced) {
        console.log(`Enhanced data received for ${type}:`, enhanced);
        
        if (type === 'all') {
          setFormData(prev => ({
            ...prev,
            ...enhanced,
            ai_enhanced: true
          }));
        } else if (type === 'description' && enhanced.descricao_sku) {
          setFormData(prev => ({
            ...prev,
            descricao_sku: enhanced.descricao_sku,
            ai_enhanced: true
          }));
        } else if (type === 'tags' && enhanced.tags) {
          setFormData(prev => ({
            ...prev,
            tags: enhanced.tags,
            ai_enhanced: true
          }));
        } else if (type === 'fields') {
          // Verifica quais campos foram realmente retornados da API
          const updatedFields: Partial<BeerProduct> = {
            ai_enhanced: true
          };
          
          // Somente atualiza os campos que foram realmente retornados
          if (enhanced.marca) updatedFields.marca = enhanced.marca;
          if (enhanced.tipo) updatedFields.tipo = enhanced.tipo;
          if (enhanced.tamanho) updatedFields.tamanho = enhanced.tamanho;
          if (enhanced.embalagem) updatedFields.embalagem = enhanced.embalagem;
          if (enhanced.teor_alcoolico) updatedFields.teor_alcoolico = enhanced.teor_alcoolico;
          if (enhanced.origem) updatedFields.origem = enhanced.origem;
          
          setFormData(prev => ({
            ...prev,
            ...updatedFields
          }));
        }
        
        setIsEditing(true);
        toast({
          title: 'Success',
          description: `${type === 'all' ? 'Product' : type} enhanced successfully`,
        });
      }
    } catch (error) {
      console.error('Error enhancing product:', error);
      toast({
        title: 'Error',
        description: `Failed to enhance ${type === 'all' ? 'product' : type}`,
        variant: 'destructive',
      });
    } finally {
      setIsEnhancing(false);
      setEnhancementType(null);
    }
  };
  
  if (!product) return null;
  
  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()} side="right">
      <SheetContent className="!p-0 !max-w-none w-[100vw] md:w-[60vw] lg:w-[45vw] flex flex-col">
        {/* Header - Fixed */}
        <div className="shrink-0">
          {/* Status bar */}
          <div className="flex items-center justify-between h-[48px] px-6">
            <div className="flex items-center gap-3">
              {formData.ai_enhanced !== undefined && (
                <Badge variant="outline" className={cn(
                  "h-[32px] px-3 py-1.5 text-xs font-medium",
                  formData.ai_enhanced 
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                )}>
                  {formData.ai_enhanced ? "AI Enhanced" : "Not Enhanced"}
                </Badge>
              )}
              <span className="text-sm text-gray-400">
                at 07/04/2024 às 11:32
              </span>
            </div>
          </div>

          {/* Product Title and ID */}
          <div className="px-6 py-4 border-b">
            <h1 className="text-[24px] leading-[32px] font-semibold text-gray-900 break-words">
              {formData.nome_sku}
            </h1>
            <p className="text-sm text-gray-500 mt-1 break-words">Product ID: {formData.product_id}</p>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 space-y-8">
            {/* Product Image */}
            <div className="h-[316px] bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="w-32 h-32 bg-amber-50/50 rounded-full flex items-center justify-center">
                <Beer className="w-16 h-16 text-amber-400" />
              </div>
            </div>

            {/* Attributes Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Attributes</h2>
                <Button 
                  variant="outline" 
                  className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                  onClick={() => handleEnhance('fields')}
                  disabled={isEnhancing}
                >
                  {isEnhancing && enhancementType === 'fields' ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Gen AI Attributes
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Brand</label>
                  <Input 
                    value={formData.marca || ''} 
                    onChange={handleChange}
                    name="marca"
                    className="border-gray-200 focus:ring-0 focus:border-gray-300" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Beer Type</label>
                  <Input 
                    value={formData.tipo || ''} 
                    onChange={handleChange}
                    name="tipo"
                    className="border-gray-200 focus:ring-0 focus:border-gray-300" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Size</label>
                  <Input 
                    value={formData.tamanho || ''} 
                    onChange={handleChange}
                    name="tamanho"
                    className="border-gray-200 focus:ring-0 focus:border-gray-300" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Volume (hl)</label>
                  <Input 
                    value={formData.volume_hectolitros || ''} 
                    onChange={handleChange}
                    name="volume_hectolitros"
                    className="border-gray-200 focus:ring-0 focus:border-gray-300" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Packaging</label>
                  <Input 
                    value={formData.embalagem || ''} 
                    onChange={handleChange}
                    name="embalagem"
                    className="border-gray-200 focus:ring-0 focus:border-gray-300" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Alcohol Content</label>
                  <Input 
                    value={formData.teor_alcoolico || ''} 
                    onChange={handleChange}
                    name="teor_alcoolico"
                    className="border-gray-200 focus:ring-0 focus:border-gray-300" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Origin</label>
                  <Input 
                    value={formData.origem || ''} 
                    onChange={handleChange}
                    name="origem"
                    className="border-gray-200 focus:ring-0 focus:border-gray-300" 
                  />
                </div>
              </div>
            </div>

            {/* Divider with proper spacing */}
            <div className="h-[1px]" />
            <div className="border-t" />
            <div className="h-[1px]" />

            {/* Additional Information Section */}
            <div className="space-y-6 pb-[40px]">
              <h2 className="text-xl font-semibold mb-[32px]">Additional information</h2>
              
              <div className="space-y-[32px]">
                {/* Product Description */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Product description</label>
                    <Button 
                      variant="outline" 
                      className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                      onClick={() => handleEnhance('description')}
                      disabled={isEnhancing}
                    >
                      {isEnhancing && enhancementType === 'description' ? (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Gen AI Description
                    </Button>
                  </div>
                  <Textarea
                    value={formData.descricao_sku || ''}
                    onChange={handleChange}
                    name="descricao_sku"
                    className="min-h-[128px] border-gray-200 focus:ring-0 focus:border-gray-300 resize-none"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Tags</label>
                    <Button 
                      variant="outline" 
                      className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                      onClick={() => handleEnhance('tags')}
                      disabled={isEnhancing}
                    >
                      {isEnhancing && enhancementType === 'tags' ? (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Gen AI Tags
                    </Button>
                  </div>
                  <Textarea
                    value={formData.tags || ''}
                    onChange={handleChange}
                    name="tags"
                    className="min-h-[85px] border-gray-200 focus:ring-0 focus:border-gray-300 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="border-t bg-white p-6 flex justify-between items-center shrink-0">
          <div>
            <Button
              variant="outline"
              className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
              onClick={() => handleEnhance('all')}
              disabled={isEnhancing}
            >
              {isEnhancing && enhancementType === null ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Enhance All
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!isEditing || isEnhancing}
              className={cn(
                "text-white",
                isEditing 
                  ? "bg-amber-500 hover:bg-amber-600" 
                  : "bg-amber-300 cursor-not-allowed"
              )}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
