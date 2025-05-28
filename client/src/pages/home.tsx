import React, { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { ImportExportPanel } from '@/components/import-export-panel';
import { ProductTable } from '@/components/product-table';
import { ProductDetails } from '@/components/product-details';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { BeerProduct } from '@shared/schema';

export default function Home() {
  const { products, selectedProduct, setSelectedProduct } = useProducts();
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'all' | 'needs-enhancement' | 'enhanced' | 'recent'>('all');
  
  const handleEditProduct = (product: BeerProduct) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };
  
  const closeProductModal = () => {
    setProductModalOpen(false);
    setSelectedProduct(null);
  };

  const handleProductUpdate = (updatedProduct: BeerProduct) => {
    setSelectedProduct(updatedProduct);
  };
  
  // Filter products based on selected tab
  const filteredProducts = React.useMemo(() => {
    switch (currentTab) {
      case 'needs-enhancement':
        return products.filter(p => !p.ai_enhanced);
      case 'enhanced':
        return products.filter(p => p.ai_enhanced);
      case 'recent':
        // In a real application, we'd sort by updated_at
        return [...products].sort((a, b) => b.id - a.id);
      default:
        return products;
    }
  }, [products, currentTab]);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold font-inter text-dark-gray">Products</h1>
              <p className="text-sm text-gray-500">Manage your beer product catalog</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="py-2 pl-10 pr-4 w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-beer-gold focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              
              <Button className="bg-beer-gold hover:bg-amber-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        </div>
        
        {/* Import/Export Panel */}
        <ImportExportPanel />
        
        {/* Product Table */}
        <ProductTable onEditProduct={handleEditProduct} />
        
        {/* Product Modal */}
        <ProductDetails
          product={selectedProduct}
          isOpen={isProductModalOpen}
          onClose={closeProductModal}
          onProductUpdate={handleProductUpdate}
        />
      </main>
    </div>
  );
}
