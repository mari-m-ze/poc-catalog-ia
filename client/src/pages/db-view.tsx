import React from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from '../components/sidebar';
import { ProductTable } from '../components/db-table';
import { BeerProduct } from '@shared/schema';

export function AllProductsPage() {
  const [, setLocation] = useLocation();

  const handleEditProduct = (product: BeerProduct) => {
    // Nesta página não precisamos da funcionalidade de edição
    return;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold font-inter text-dark-gray">Database Management</h1>
                <p className="text-sm text-gray-500">Manage products in the database</p>
              </div>
            </div>
          </div>
        </div>

        <ProductTable 
          onEditProduct={handleEditProduct}
        />
      </main>
    </div>
  );
} 