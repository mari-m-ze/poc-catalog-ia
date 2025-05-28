import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from '../components/sidebar';
import { ProductTable } from '../components/product-table';
import { ProductDetails } from '../components/product-details';
import { BeerProduct } from '@shared/schema';

export function ProductsPage() {
  const [location] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<BeerProduct | null>(null);
  
  // Get the category from URL query parameters
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const category = searchParams.get('category');
  
  const handleEditProduct = (product: BeerProduct) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  const handleProductUpdate = (updatedProduct: BeerProduct) => {
    // Update the product in the parent state if needed
    setSelectedProduct(updatedProduct);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-semibold font-inter text-dark-gray">
              {category ? `All Products - ${decodeURIComponent(category)}` : 'All Products'}
            </h1>
            <p className="text-sm text-gray-500">
              {category ? `Showing all products in the ${decodeURIComponent(category)} category` : 'Showing all products'}
            </p>
          </div>
        </div>

        <div className="p-8">
          <ProductTable 
            onEditProduct={handleEditProduct}
            initialCategory={category ? decodeURIComponent(category) : undefined}
          />
        </div>
      </main>

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={handleCloseModal}
          isOpen={selectedProduct !== null}
          onProductUpdate={handleProductUpdate}
        />
      )}
    </div>
  );
} 