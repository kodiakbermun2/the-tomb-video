export type MoneyV2 = {
  amount: string;
  currencyCode: string;
};

export type ShopifyImage = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  price: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  availableForSale?: boolean;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  featuredImage: ShopifyImage | null;
  images: {
    nodes: ShopifyImage[];
  };
  priceRange: {
    minVariantPrice: MoneyV2;
    maxVariantPrice?: MoneyV2;
  };
  variants: {
    nodes: ProductVariant[];
  };
  tags?: string[];
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  products?: {
    nodes: Product[];
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines?: {
    nodes: Array<{
      id: string;
      quantity: number;
      merchandise: {
        id: string;
      };
    }>;
  };
};

export type ShopifyResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};
