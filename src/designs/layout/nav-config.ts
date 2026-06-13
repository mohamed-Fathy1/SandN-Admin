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
  DatabaseBackup,
  BarChart3,
} from 'lucide-react';
import { ROUTES } from '@/config/constants';

export interface NavItem {
  labelKey: string;
  to: string;
  icon: LucideIcon;
}

export interface NavGroup {
  labelKey?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { labelKey: 'items.dashboard', to: ROUTES.dashboard, icon: LayoutDashboard },
      { labelKey: 'items.analytics', to: ROUTES.analytics, icon: BarChart3 },
    ],
  },
  {
    labelKey: 'groups.catalog',
    items: [
      { labelKey: 'items.products', to: ROUTES.products, icon: Package },
      { labelKey: 'items.categories', to: ROUTES.categories, icon: Tag },
      { labelKey: 'items.categoryIcons', to: ROUTES.categoryIcons, icon: Shapes },
      { labelKey: 'items.subCategories', to: ROUTES.subCategories, icon: Layers },
      { labelKey: 'items.colors', to: ROUTES.colors, icon: Palette },
      { labelKey: 'items.groups', to: ROUTES.groups, icon: Layers },
      { labelKey: 'items.sizes', to: ROUTES.sizes, icon: Ruler },
    ],
  },
  {
    labelKey: 'groups.operations',
    items: [
      { labelKey: 'items.orders', to: ROUTES.orders, icon: ShoppingBag },
      { labelKey: 'items.wishlist', to: ROUTES.wishlist, icon: Heart },
    ],
  },
  {
    labelKey: 'groups.marketing',
    items: [
      { labelKey: 'items.offers', to: ROUTES.offers, icon: Megaphone },
      { labelKey: 'items.heroSlider', to: ROUTES.hero, icon: Image },
      { labelKey: 'items.socialReviews', to: ROUTES.socialReviews, icon: Sparkles },
      { labelKey: 'items.shipping', to: ROUTES.shipping, icon: Truck },
    ],
  },
  {
    labelKey: 'groups.maintenance',
    items: [{ labelKey: 'items.backups', to: ROUTES.backups, icon: DatabaseBackup }],
  },
];

export const BREADCRUMB_TITLE_KEYS: Record<string, string> = {
  '/': 'breadcrumb.dashboard',
  '/analytics': 'breadcrumb.analytics',
  '/products': 'breadcrumb.products',
  '/products/new': 'breadcrumb.productNew',
  '/products/$productId': 'breadcrumb.productEdit',
  '/products/$productId/variants': 'breadcrumb.productVariants',
  '/catalog/categories': 'breadcrumb.categories',
  '/catalog/icons': 'breadcrumb.categoryIcons',
  '/catalog/sub-categories': 'breadcrumb.subCategories',
  '/catalog/colors': 'breadcrumb.colors',
  '/catalog/groups': 'breadcrumb.groups',
  '/catalog/sizes': 'breadcrumb.sizes',
  '/orders': 'breadcrumb.orders',
  '/orders/$orderId': 'breadcrumb.orderDetail',
  '/wishlist': 'breadcrumb.wishlist',
  '/offers': 'breadcrumb.offers',
  '/content/hero': 'breadcrumb.heroSlider',
  '/content/social-reviews': 'breadcrumb.socialReviews',
  '/shipping': 'breadcrumb.shipping',
  '/maintenance/backups': 'breadcrumb.backups',
};
