import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.product.groupBy({
      by: ['categoria'],
      _count: {
        _all: true,
      },
      _sum: {
        quantidade: true,
        preco: true,
      },
      _avg: {
        preco: true,
      },
    });

    const formattedCategories = categories.map(category => ({
      name: category.categoria,
      totalProducts: category._count._all,
      totalQuantity: category._sum.quantidade || 0,
      totalValue: category._sum.preco || 0,
      averagePrice: category._avg.preco || 0,
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 