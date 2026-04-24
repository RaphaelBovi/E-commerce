import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { fetchFavorites, toggleFavorite } from "../services/favoritesApi";

const FavoritesContext = createContext({ isFavorited: () => false, toggleFav: async () => {} });

export function useFavorites() {
  return useContext(FavoritesContext);
}

export default function FavoritesProvider({ children }) {
  const { isAuthenticated } = useAuth();
  // Set of product ID strings that the user has favorited
  const [favIds, setFavIds] = useState(new Set());
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavIds(new Set());
      loadedRef.current = false;
      return;
    }
    if (loadedRef.current) return;
    loadedRef.current = true;

    fetchFavorites()
      .then((products) => {
        setFavIds(new Set(products.map((p) => String(p.id))));
      })
      .catch(() => {
        loadedRef.current = false;
      });
  }, [isAuthenticated]);

  const isFavorited = useCallback((id) => favIds.has(String(id)), [favIds]);

  const toggleFav = useCallback(async (productId) => {
    const id = String(productId);
    // Optimistic update
    setFavIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    try {
      const res = await toggleFavorite(productId);
      // Sync with server response
      setFavIds((prev) => {
        const next = new Set(prev);
        if (res.favorited) next.add(id); else next.delete(id);
        return next;
      });
    } catch {
      // Revert optimistic update on error
      setFavIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  }, []);

  return (
    <FavoritesContext.Provider value={{ isFavorited, toggleFav }}>
      {children}
    </FavoritesContext.Provider>
  );
}
