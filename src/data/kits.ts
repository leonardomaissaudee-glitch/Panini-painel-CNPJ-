export interface Kit {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  image: string;
  badge?: string;
  bestValue?: boolean;
  items: string[];
  savings?: string;
}

export const kits: Kit[] = [
  {
    id: 'kit-1',
    name: 'Kit Iniciante',
    description: '1 Álbum Capa Dura + 30 Pacotes',
    price: 97.00,
    originalPrice: 147.00,
    discount: '-34%',
    image: 'https://pub-c0bfb119504542e0b2e6ebc8f6b3b1df.r2.dev/user-uploads/user_38XNRHxmsUPTGvoK09TMInYrBxw/c98884a1-a6a9-442e-ae46-23a4246f2abb.webp',
    items: [
      '150 figurinhas',
      'Frete Grátis',
    ],
    savings: 'Você economiza R$ 50,00',
  },
  {
    id: 'kit-2',
    name: 'Kit Campeão',
    description: '1 Álbum Capa Dura + 60 Pacotes',
    price: 149.00,
    originalPrice: 227.00,
    discount: '-34%',
    badge: 'MAIS VENDIDO',
    image: 'https://pub-c0bfb119504542e0b2e6ebc8f6b3b1df.r2.dev/user-uploads/user_38XNRHxmsUPTGvoK09TMInYrBxw/c98884a1-a6a9-442e-ae46-23a4246f2abb.webp',
    items: [
      '300 figurinhas',
      'Frete Grátis',
    ],
    savings: 'Você economiza R$ 78,00',
  },
  {
    id: 'kit-3',
    name: 'Kit Colecionador',
    description: '1 Álbum Capa Dura + 90 Pacotes',
    price: 199.00,
    originalPrice: 347.00,
    discount: '-43%',
    badge: 'MELHOR CUSTO',
    bestValue: true,
    image: 'https://pub-c0bfb119504542e0b2e6ebc8f6b3b1df.r2.dev/user-uploads/user_38XNRHxmsUPTGvoK09TMInYrBxw/ac40a943-f325-4ad2-8584-be861cd4c8fd.webp',
    items: [
      '450 figurinhas',
      'Frete Grátis',
    ],
    savings: 'Você economiza R$ 148,00',
  },
];
