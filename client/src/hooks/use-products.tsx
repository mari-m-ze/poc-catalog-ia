import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { BeerProduct, CSVBeerProduct, AIEnhancementType } from '@shared/schema';

export function useProducts() {
  const [selectedProduct, setSelectedProduct] = useState<BeerProduct | null>(null);
  
  // Fetch all products
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery<BeerProduct[]>({
    queryKey: ['/api/products'],
  });
  
  // Import products mutation
  const importMutation = useMutation({
    mutationFn: async (products: CSVBeerProduct[]) => {
      const res = await apiRequest('POST', '/api/products/import', products);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
  
  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ productId, updates }: { productId: string; updates: Partial<BeerProduct> }) => {
      const res = await apiRequest('PATCH', `/api/products/${productId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
  
  // AI enhancement mutation
  const enhanceMutation = useMutation({
    mutationFn: async ({ productId, enhancementType }: { productId: string; enhancementType: AIEnhancementType }) => {
      const res = await apiRequest('POST', `/api/products/${productId}/enhance`, { enhancementType });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
  
  // Delete products mutation
  const deleteMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const res = await apiRequest('POST', '/api/products/bulk-delete', { productIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
  
  const importProducts = useCallback(async (products: CSVBeerProduct[]) => {
    return importMutation.mutateAsync(products);
  }, [importMutation]);
  
  const updateProduct = useCallback(async (productId: string, updates: Partial<BeerProduct>) => {
    return updateMutation.mutateAsync({ productId, updates });
  }, [updateMutation]);
  
  const enhanceProduct = useCallback(async (productId: string, enhancementType: AIEnhancementType) => {
    return enhanceMutation.mutateAsync({ productId, enhancementType });
  }, [enhanceMutation]);
  
  const exportProducts = useCallback(async (columns: string[]) => {
    try {
      const res = await apiRequest('POST', '/api/products/export', { columns });
      return await res.json();
    } catch (error) {
      console.error('Error exporting products:', error);
      throw error;
    }
  }, []);
  
  return {
    products,
    isLoading,
    isError,
    error,
    selectedProduct,
    setSelectedProduct,
    importProducts: importMutation.mutate,
    isImporting: importMutation.isPending,
    updateProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    enhanceProduct: enhanceMutation.mutateAsync,
    isEnhancing: enhanceMutation.isPending,
    deleteProducts: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    exportProducts,
  };
}
