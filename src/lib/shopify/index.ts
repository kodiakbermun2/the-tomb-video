import {
  COLLECTION_BY_HANDLE_QUERY,
  COLLECTIONS_QUERY,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCTS_QUERY,
} from "./queries";
import { shopifyFetch } from "./client";
import { Cart, Collection, Product } from "./types";

type ProductsResponse = {
  products: {
    nodes: Product[];
  };
};

type ProductByHandleResponse = {
  product: Product | null;
};

type CollectionsResponse = {
  collections: {
    nodes: Collection[];
  };
};

type CollectionByHandleResponse = {
  collection: Collection | null;
};

type CartMutationResponse = {
  cartCreate?: {
    cart: Cart | null;
    userErrors: Array<{ message: string }>;
  };
  cartLinesAdd?: {
    cart: Cart | null;
    userErrors: Array<{ message: string }>;
  };
  cartLinesUpdate?: {
    cart: Cart | null;
    userErrors: Array<{ message: string }>;
  };
  cartLinesRemove?: {
    cart: Cart | null;
    userErrors: Array<{ message: string }>;
  };
};

type CartQueryResponse = {
  cart: Cart | null;
};

export async function getProducts(first = 24): Promise<Product[]> {
  const data = await shopifyFetch<ProductsResponse>({
    query: PRODUCTS_QUERY,
    variables: { first },
    cache: "force-cache",
    revalidate: 120,
  });

  return data.products.nodes;
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const data = await shopifyFetch<ProductByHandleResponse>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    cache: "force-cache",
    revalidate: 120,
  });

  return data.product;
}

export async function getCollections(first = 12): Promise<Collection[]> {
  const data = await shopifyFetch<CollectionsResponse>({
    query: COLLECTIONS_QUERY,
    variables: { first },
    cache: "force-cache",
    revalidate: 300,
  });

  return data.collections.nodes;
}

export async function getCollectionByHandle(
  handle: string,
  first = 36,
): Promise<Collection | null> {
  const data = await shopifyFetch<CollectionByHandleResponse>({
    query: COLLECTION_BY_HANDLE_QUERY,
    variables: { handle, first },
    cache: "force-cache",
    revalidate: 300,
  });

  return data.collection;
}

export async function createCart(merchandiseId?: string, quantity = 1): Promise<Cart> {
  const lines = merchandiseId ? [{ merchandiseId, quantity }] : [];

  const data = await shopifyFetch<CartMutationResponse>({
    query: CART_CREATE_MUTATION,
    variables: { lines },
    cache: "no-store",
    revalidate: 0,
  });

  const userErrors = data.cartCreate?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join("; "));
  }

  if (!data.cartCreate?.cart) {
    throw new Error("Unable to create Shopify cart.");
  }

  return data.cartCreate.cart;
}

export async function addCartLines(
  cartId: string,
  merchandiseId: string,
  quantity = 1,
): Promise<Cart> {
  const data = await shopifyFetch<CartMutationResponse>({
    query: CART_LINES_ADD_MUTATION,
    variables: {
      cartId,
      lines: [{ merchandiseId, quantity }],
    },
    cache: "no-store",
    revalidate: 0,
  });

  const userErrors = data.cartLinesAdd?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join("; "));
  }

  if (!data.cartLinesAdd?.cart) {
    throw new Error("Unable to add line item to cart.");
  }

  return data.cartLinesAdd.cart;
}

function getUserErrorMessage(errors: Array<{ message: string }>) {
  return errors.map((error) => error.message).join("; ");
}

async function getCartLineIdByMerchandiseId(
  cartId: string,
  merchandiseId: string,
): Promise<string | null> {
  const cart = await getCart(cartId);
  const line = cart?.lines?.nodes.find((entry) => entry.merchandise.id === merchandiseId);
  return line?.id ?? null;
}

export async function updateCartLineQuantity(
  cartId: string,
  merchandiseId: string,
  quantity: number,
): Promise<Cart> {
  const lineId = await getCartLineIdByMerchandiseId(cartId, merchandiseId);
  if (!lineId) {
    throw new Error("Unable to find Shopify cart line for this item.");
  }

  const data = await shopifyFetch<CartMutationResponse>({
    query: CART_LINES_UPDATE_MUTATION,
    variables: {
      cartId,
      lines: [{ id: lineId, quantity }],
    },
    cache: "no-store",
    revalidate: 0,
  });

  const userErrors = data.cartLinesUpdate?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(getUserErrorMessage(userErrors));
  }

  if (!data.cartLinesUpdate?.cart) {
    throw new Error("Unable to update cart line quantity.");
  }

  return data.cartLinesUpdate.cart;
}

export async function removeCartLine(
  cartId: string,
  merchandiseId: string,
): Promise<Cart> {
  const lineId = await getCartLineIdByMerchandiseId(cartId, merchandiseId);
  if (!lineId) {
    const cart = await getCart(cartId);
    if (!cart) {
      throw new Error("Unable to locate Shopify cart.");
    }
    return cart;
  }

  const data = await shopifyFetch<CartMutationResponse>({
    query: CART_LINES_REMOVE_MUTATION,
    variables: {
      cartId,
      lineIds: [lineId],
    },
    cache: "no-store",
    revalidate: 0,
  });

  const userErrors = data.cartLinesRemove?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(getUserErrorMessage(userErrors));
  }

  if (!data.cartLinesRemove?.cart) {
    throw new Error("Unable to remove cart line.");
  }

  return data.cartLinesRemove.cart;
}

export async function clearCartLines(cartId: string): Promise<Cart> {
  const cart = await getCart(cartId);
  if (!cart) {
    throw new Error("Unable to locate Shopify cart.");
  }

  const lineIds = cart.lines?.nodes.map((line) => line.id) ?? [];
  if (lineIds.length === 0) {
    return cart;
  }

  const data = await shopifyFetch<CartMutationResponse>({
    query: CART_LINES_REMOVE_MUTATION,
    variables: {
      cartId,
      lineIds,
    },
    cache: "no-store",
    revalidate: 0,
  });

  const userErrors = data.cartLinesRemove?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(getUserErrorMessage(userErrors));
  }

  if (!data.cartLinesRemove?.cart) {
    throw new Error("Unable to clear cart.");
  }

  return data.cartLinesRemove.cart;
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyFetch<CartQueryResponse>({
    query: CART_QUERY,
    variables: { cartId },
    cache: "no-store",
    revalidate: 0,
  });

  return data.cart;
}
