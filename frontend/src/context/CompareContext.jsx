import { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext(null);
const COMPARE_KEY = 'compare_products';
const MAX_COMPARE = 3;

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState(() => {
    try {
      const saved = localStorage.getItem(COMPARE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(COMPARE_KEY, JSON.stringify(compareList)); } catch {}
  }, [compareList]);

  const addToCompare = (product) => {
    if (compareList.length >= MAX_COMPARE) return 'max';
    if (compareList.some((p) => p.id === product.id)) return 'exists';
    setCompareList((prev) => [...prev, product]);
    return 'added';
  };

  const removeFromCompare = (productId) => {
    setCompareList((prev) => prev.filter((p) => p.id !== productId));
  };

  const isComparing = (productId) => compareList.some((p) => p.id === productId);

  const clearCompare = () => setCompareList([]);

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, isComparing, clearCompare, MAX_COMPARE }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
