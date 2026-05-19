/**
 * CartContext — mirrors the server-side bag and exposes add / update /
 * remove / clear, refreshing whenever the signed-in user changes.
 *
 * @author Frontend (teammate — TBD)
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import api, { describeError } from "../api";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const CartContext = createContext(null);

const EMPTY_CART = { items: [], total: 0, item_count: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [pendingItemIds, setPendingItemIds] = useState([]);
  const [addingItemId, setAddingItemId] = useState("");

  const startPending = (productId) =>
    setPendingItemIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  const stopPending = (productId) =>
    setPendingItemIds((prev) => prev.filter((id) => id !== productId));

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(EMPTY_CART);
      setPendingItemIds([]);
      setAddingItemId("");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      setCart(data);
    } catch {
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId, quantity = 1) => {
      if (!user) {
        showToast("Please log in first.", "warning");
        return false;
      }
      setAddingItemId(productId);
      try {
        const { data } = await api.post("/cart/items", { product_id: productId, quantity });
        setCart(data);
        showToast("Added to bag.");
        return { ok: true, cart: data };
      } catch (error) {
        showToast(describeError(error, "Could not add item."), "error");
        return { ok: false };
      } finally {
        setAddingItemId("");
      }
    },
    [user, showToast]
  );

  const updateItem = useCallback(
    async (productId, quantity) => {
      startPending(productId);
      try {
        const { data } = await api.put(`/cart/items/${productId}`, { quantity });
        setCart(data);
        return { ok: true };
      } catch (error) {
        showToast(describeError(error, "Update failed."), "error");
        return { ok: false };
      } finally {
        stopPending(productId);
      }
    },
    [showToast]
  );

  const removeItem = useCallback(
    async (productId) => {
      startPending(productId);
      try {
        const { data } = await api.delete(`/cart/items/${productId}`);
        setCart(data);
        showToast("Removed from bag.");
        return { ok: true };
      } catch (error) {
        showToast(describeError(error, "Remove failed."), "error");
        return { ok: false };
      } finally {
        stopPending(productId);
      }
    },
    [showToast]
  );

  const clear = useCallback(async () => {
    try {
      await api.delete("/cart");
      setCart(EMPTY_CART);
    } catch (error) {
      showToast(describeError(error, "Clear failed."), "error");
    }
  }, [showToast]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      pendingItemIds,
      addingItemId,
      refresh,
      addItem,
      updateItem,
      removeItem,
      clear,
    }),
    [cart, loading, pendingItemIds, addingItemId, refresh, addItem, updateItem, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
