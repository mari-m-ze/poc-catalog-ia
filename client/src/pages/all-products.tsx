import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Sidebar } from '../components/sidebar';

interface CategoryStats {
  name: string;
  totalProducts: number;
  enhancedProducts: number;
  needsEnhancement: number;
}

export function AllProductsPage() {
  const [, setLocation] = useLocation();
  const { data: categoryStats, isLoading, error } = useQuery<CategoryStats[]>({
    queryKey: ['categoryStats'],
    queryFn: async () => {
      console.log('Fetching category stats...');
      const response = await fetch('/api/categories/stats');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', { status: response.status, data: errorData });
        throw new Error(errorData.error || 'Failed to fetch category statistics');
      }
      const data = await response.json();
      console.log('Category stats data:', data);
      
      // Convert string numbers to actual numbers
      return data.map((item: any) => ({
        name: item.name,
        totalProducts: parseInt(item.totalProducts, 10),
        enhancedProducts: parseInt(item.enhancedProducts, 10),
        needsEnhancement: parseInt(item.needsEnhancement, 10),
      }));
    },
  });

  const handleCategoryClick = (categoryName: string) => {
    // Encode the category name for URL safety
    const encodedCategory = encodeURIComponent(categoryName);
    setLocation(`/products?category=${encodedCategory}`);
  };

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium">Error loading data</h3>
              <p className="text-red-600 text-sm mt-1">Please try again later</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-semibold font-inter text-dark-gray">All Products</h1>
            <p className="text-sm text-gray-500">Overview of products by category</p>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryStats?.map((category: CategoryStats) => (
              <div
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:border-beer-gold transition-colors cursor-pointer hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.name}</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Products</span>
                    <span className="font-medium text-gray-900">{category.totalProducts.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Enhanced Products</span>
                    <span className="font-medium text-forest-green">{category.enhancedProducts.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Need Enhancement</span>
                    <span className="font-medium text-beer-brown">{category.needsEnhancement.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 