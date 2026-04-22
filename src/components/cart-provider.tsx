"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CartItem = {
  merchandiseId: string;
  productHandle: string;
  title: string;
  variantTitle: string;
  imageUrl?: string;
  priceAmount: string;
  currencyCode: string;
  quantity: number;
  maxQuantity: number;
};

type CartState = {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  totalItems: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => Promise<void>;
  increaseItemQuantity: (merchandiseId: string) => Promise<void>;
  decreaseItemQuantity: (merchandiseId: string) => Promise<void>;
  removeItem: (merchandiseId: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CART_STORAGE_KEY = "tomb-video-cart";

const clampQuantity = (nextQuantity: number, maxQuantity: number) =>
  Math.max(1, Math.min(nextQuantity, Math.max(1, maxQuantity)));

const CartContext = createContext<CartState | null>(null);

type StoredCart = {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
};

type CartSyncResponse = {
  cartId: string;
  checkoutUrl: string;
  totalQuantity: number;
};

function readStoredCart(): StoredCart {
  if (typeof window === "undefined") {
    return { items: [], cartId: null, checkoutUrl: null };
  }

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return { items: [], cartId: null, checkoutUrl: null };
    }

    const parsed = JSON.parse(raw) as StoredCart;
    const parsedItems = (parsed.items ?? []).map((item) => ({
      ...item,
      maxQuantity: Math.max(1, item.maxQuantity ?? 99),
    }));

    return {
      items: parsedItems,
      cartId: parsed.cartId ?? null,
      checkoutUrl: parsed.checkoutUrl ?? null,
    };
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return { items: [], cartId: null, checkoutUrl: null };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [storedCart, setStoredCart] = useState<StoredCart>(readStoredCart);
  const { items, cartId, checkoutUrl } = storedCart;

  const syncCartAction = useCallback(
    async (
      payload:
        | { action: "setQuantity"; merchandiseId: string; quantity: number }
        | { action: "remove"; merchandiseId: string }
        | { action: "clear" },
    ) => {
      if (!cartId) {
        return;
      }

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          cartId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to synchronize cart.");
      }

      const data = (await response.json()) as CartSyncResponse;
      setStoredCart((previous) => ({
        ...previous,
        cartId: data.cartId,
        checkoutUrl: data.checkoutUrl,
      }));
    },
    [cartId],
  );

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        items,
        cartId,
        checkoutUrl,
      }),
    );
  }, [items, cartId, checkoutUrl]);

  const addItem = useCallback(
    async (item: Omit<CartItem, "quantity">, quantity = 1) => {
      const existingItem = items.find((entry) => entry.merchandiseId === item.merchandiseId);
      const allowedToAdd = existingItem
        ? Math.max(0, item.maxQuantity - existingItem.quantity)
        : clampQuantity(quantity, item.maxQuantity);

      if (allowedToAdd <= 0) {
        return;
      }

      setStoredCart((previous) => {
        const existingIndex = previous.items.findIndex(
          (entry) => entry.merchandiseId === item.merchandiseId,
        );
        if (existingIndex === -1) {
          const clampedQuantity = clampQuantity(allowedToAdd, item.maxQuantity);
          return {
            ...previous,
            items: [...previous.items, { ...item, quantity: clampedQuantity }],
          };
        }

        const clone = [...previous.items];
        const existingItem = clone[existingIndex];
        const mergedMaxQuantity = Math.max(existingItem.maxQuantity, item.maxQuantity);
        clone[existingIndex] = {
          ...existingItem,
          maxQuantity: mergedMaxQuantity,
          quantity: clampQuantity(existingItem.quantity + quantity, mergedMaxQuantity),
        };

        return {
          ...previous,
          items: clone,
        };
      });

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add",
          cartId,
          merchandiseId: item.merchandiseId,
          quantity: allowedToAdd,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update cart.");
      }

      const data = (await response.json()) as {
        cartId: string;
        checkoutUrl: string;
      };

      setStoredCart((previous) => ({
        ...previous,
        cartId: data.cartId,
        checkoutUrl: data.checkoutUrl,
      }));
    },
    [cartId, items],
  );

  const increaseItemQuantity = useCallback(
    async (merchandiseId: string) => {
      const targetItem = items.find((item) => item.merchandiseId === merchandiseId);
      if (!targetItem) {
        return;
      }

      const nextQuantity = clampQuantity(targetItem.quantity + 1, targetItem.maxQuantity);
      if (nextQuantity === targetItem.quantity) {
        return;
      }

      setStoredCart((previous) => ({
        ...previous,
        items: previous.items.map((item) =>
          item.merchandiseId === merchandiseId
            ? {
                ...item,
                quantity: nextQuantity,
              }
            : item,
        ),
      }));

      try {
        await syncCartAction({
          action: "setQuantity",
          merchandiseId,
          quantity: nextQuantity,
        });
      } catch (error) {
        setStoredCart((previous) => ({
          ...previous,
          items: previous.items.map((item) =>
            item.merchandiseId === merchandiseId
              ? {
                  ...item,
                  quantity: targetItem.quantity,
                }
              : item,
          ),
        }));
        throw error;
      }
    },
    [items, syncCartAction],
  );

  const decreaseItemQuantity = useCallback(
    async (merchandiseId: string) => {
      const previousItems = items;
      const targetItem = items.find((item) => item.merchandiseId === merchandiseId);
      if (!targetItem) {
        return;
      }

      const nextQuantity = targetItem.quantity - 1;
      const removeInstead = nextQuantity <= 0;

      setStoredCart((previous) => ({
        ...previous,
        items: previous.items.flatMap((item) => {
          if (item.merchandiseId !== merchandiseId) {
            return [item];
          }

          if (removeInstead) {
            return [];
          }

          return [
            {
              ...item,
              quantity: nextQuantity,
            },
          ];
        }),
      }));

      try {
        if (removeInstead) {
          await syncCartAction({ action: "remove", merchandiseId });
          return;
        }

        await syncCartAction({
          action: "setQuantity",
          merchandiseId,
          quantity: nextQuantity,
        });
      } catch (error) {
        setStoredCart((previous) => ({
          ...previous,
          items: previousItems,
        }));
        throw error;
      }
    },
    [items, syncCartAction],
  );

  const removeItem = useCallback(
    async (merchandiseId: string) => {
      const previousItems = items;
      const targetItem = items.find((item) => item.merchandiseId === merchandiseId);
      if (!targetItem) {
        return;
      }

      setStoredCart((previous) => ({
        ...previous,
        items: previous.items.filter((item) => item.merchandiseId !== merchandiseId),
      }));

      try {
        await syncCartAction({ action: "remove", merchandiseId });
      } catch (error) {
        setStoredCart((previous) => ({
          ...previous,
          items: previousItems,
        }));
        throw error;
      }
    },
    [items, syncCartAction],
  );

  const clearCart = useCallback(async () => {
    const previousState = storedCart;

    setStoredCart((previous) => ({
      ...previous,
      items: [],
    }));

    try {
      await syncCartAction({ action: "clear" });
    } catch (error) {
      setStoredCart(previousState);
      throw error;
    }
  }, [storedCart, syncCartAction]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      cartId,
      checkoutUrl,
      totalItems,
      addItem,
      increaseItemQuantity,
      decreaseItemQuantity,
      removeItem,
      clearCart,
    }),
    [
      items,
      cartId,
      checkoutUrl,
      totalItems,
      addItem,
      increaseItemQuantity,
      decreaseItemQuantity,
      removeItem,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
