import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Home, Settings, Database, FileSpreadsheet, LayoutGrid, Wine } from 'lucide-react';

export function Sidebar() {
  const [location] = useLocation();

  const navigationItems = [
    // {
    //   name: 'Início',
    //   icon: Home,
    //   path: '/',
    // },
    // {
    //   name: 'Produtos por Categoria',
    //   icon: LayoutGrid,
    //   path: '/all-products',
    // },
    {
      name: 'Atributos de Vinhos',
      icon: Wine,
      path: '/wine-attributes',
    },
    {
      name: 'Configurações',
      icon: Settings,
      path: '/settings',
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold text-beer-gold flex items-center">
          <Database className="w-6 h-6 mr-2" />
          Catalog - IA - POC
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Sistema de Gestão de Informações de Produtos
        </p>
      </div>

      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                    location === item.path
                      ? "bg-amber-50 text-beer-gold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <FileSpreadsheet className="w-6 h-6 text-gray-400" />
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-900">Catalog - IA - POC</p>
            <p className="text-xs text-gray-500">Gerenciador de Dados</p>
          </div>
        </div>
      </div>
    </div>
  );
}