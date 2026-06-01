import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE } from '@/config/constants';
import { getStoredLocale } from '@/shared/stores/locale-store';

import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enAuth from './locales/en/auth.json';
import enValidation from './locales/en/validation.json';
import enDashboard from './locales/en/dashboard.json';
import enProducts from './locales/en/products.json';
import enCatalog from './locales/en/catalog.json';
import enOrders from './locales/en/orders.json';
import enWishlist from './locales/en/wishlist.json';
import enMarketing from './locales/en/marketing.json';

import arCommon from './locales/ar/common.json';
import arNav from './locales/ar/nav.json';
import arAuth from './locales/ar/auth.json';
import arValidation from './locales/ar/validation.json';
import arDashboard from './locales/ar/dashboard.json';
import arProducts from './locales/ar/products.json';
import arCatalog from './locales/ar/catalog.json';
import arOrders from './locales/ar/orders.json';
import arWishlist from './locales/ar/wishlist.json';
import arMarketing from './locales/ar/marketing.json';

export const NAMESPACES = [
  'common',
  'nav',
  'auth',
  'validation',
  'dashboard',
  'products',
  'catalog',
  'orders',
  'wishlist',
  'marketing',
] as const;

const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    auth: enAuth,
    validation: enValidation,
    dashboard: enDashboard,
    products: enProducts,
    catalog: enCatalog,
    orders: enOrders,
    wishlist: enWishlist,
    marketing: enMarketing,
  },
  ar: {
    common: arCommon,
    nav: arNav,
    auth: arAuth,
    validation: arValidation,
    dashboard: arDashboard,
    products: arProducts,
    catalog: arCatalog,
    orders: arOrders,
    wishlist: arWishlist,
    marketing: arMarketing,
  },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLocale(),
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: 'common',
  ns: NAMESPACES as unknown as string[],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
