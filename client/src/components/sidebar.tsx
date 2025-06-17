import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Home, Settings, FileSpreadsheet, LayoutGrid, Wine, Database, TrendingUp, Target } from 'lucide-react';
import zeExtension from '@/assets/images/ze_extension.png';

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
      name: 'Histórico de Enriquecimento',
      icon: Database,
      path: '/wine-enrichment',
    },
    {
      name: 'Comparação de Atributos',
      icon: TrendingUp,
      path: '/wine-comparison',
    },
    {
      name: 'Análise de Acurácia',
      icon: Target,
      path: '/wine-accuracy',
    },
    {
      name: 'Configurações',
      icon: Settings,
      path: '/settings',
    },
  ];

  return (
    <div className="w-64 bg-black border-r border-gray-800 flex flex-col h-full">
      <div className="p-6 flex flex-col items-center">
        <h2 className="text-xl font-bold text-white flex items-center">
          <img  src={zeExtension} alt="ZE Extension"/>
        </h2>
        <h1 className="text-2xl text-white font-semibold">Catálogo</h1>
        <h2 className="text-sm text-center text-white">Catalog - IA</h2>
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
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon className="w-6 h-6 mr-3" />
                  {item.name}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <FileSpreadsheet className="w-6 h-6 text-gray-400" />
          <div className="ml-3">
            <p className="text-xs font-medium text-white">Catalog - IA</p>
{/*             <p className="text-xs text-gray-400">Gerenciador de Dados</p>*/}          </div>
        </div>
      </div>
    </div>
  );
}