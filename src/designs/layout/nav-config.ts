import {
  LayoutDashboard,
  Package,
  Tag,
  Layers,
  Palette,
  Ruler,
  type LucideIcon,
  ShoppingBag,
  Heart,
  Megaphone,
  Image,
  Sparkles,
  Truck,
  Shapes,
} from 'lucide-react';
import { ROUTES } from '@/config/constants';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard }],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', to: ROUTES.products, icon: Package },
      { label: 'Categories', to: ROUTES.categories, icon: Tag },
      { label: 'Category Icons', to: ROUTES.categoryIcons, icon: Shapes },
      { label: 'Sub-Categories', to: ROUTES.subCategories, icon: Layers },
      { label: 'Colors', to: ROUTES.colors, icon: Palette },
      { label: 'Groups', to: ROUTES.groups, icon: Layers },
      { label: 'Sizes', to: ROUTES.sizes, icon: Ruler },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Orders', to: ROUTES.orders, icon: ShoppingBag },
      { label: 'Wishlist', to: ROUTES.wishlist, icon: Heart },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Offers', to: ROUTES.offers, icon: Megaphone },
      { label: 'Hero Slider', to: ROUTES.hero, icon: Image },
      { label: 'Social Reviews', to: ROUTES.socialReviews, icon: Sparkles },
      { label: 'Shipping', to: ROUTES.shipping, icon: Truck },
    ],
  },
];

export const BREADCRUMB_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/products/new': 'New Product',
  '/products/$productId': 'Edit Product',
  '/products/$productId/variants': 'Variants',
  '/catalog/categories': 'Categories',
  '/catalog/icons': 'Category Icons',
  '/catalog/sub-categories': 'Sub-Categories',
  '/catalog/colors': 'Colors',
  '/catalog/groups': 'Groups',
  '/catalog/sizes': 'Sizes',
  '/orders': 'Orders',
  '/orders/$orderId': 'Order Detail',
  '/wishlist': 'Wishlist',
  '/offers': 'Offers',
  '/content/hero': 'Hero Slider',
  '/content/social-reviews': 'Social Reviews',
  '/shipping': 'Shipping',
};
