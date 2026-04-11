import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import Lancamentos from './pages/Lancamentos';
import Promocoes from './pages/Promocoes';
import Institucional from './pages/Institucional';
import { products as fallbackProducts } from './data/mockData';
import { fetchProducts } from './services/productsApi';
import Checkout from './pages/Checkout';

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState(fallbackProducts);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const apiProducts = await fetchProducts();
        if (isMounted && apiProducts.length > 0) {
          setProducts(apiProducts);
          setProductsError('');
        }
      } catch (error) {
        if (isMounted) {
          console.error("Erro na API:", error); 
          setProductsError('Não foi possível carregar produtos da API. Exibindo catálogo local.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);

      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { ...product, quantity }];
    });

    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };
  const totalCartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar
          cartCount={totalCartItemsCount}
          onOpenCart={() => setIsCartOpen(true)}
        />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />

        <Routes>
          <Route
            path="/"
            element={
              <Home
                onAddToCart={handleAddToCart}
                products={products}
                isLoadingProducts={isLoadingProducts}
                productsError={productsError}
              />
            }
          />
          <Route
            path="/catalogo"
            element={
              <Catalog
                onAddToCart={handleAddToCart}
                products={products}
                isLoadingProducts={isLoadingProducts}
                productsError={productsError}
              />
            }
          />
          <Route
            path="/lancamentos"
            element={
              <Lancamentos
                onAddToCart={handleAddToCart}
                products={products}
                isLoadingProducts={isLoadingProducts}
                productsError={productsError}
              />
            }
          />
          <Route
            path="/promocoes"
            element={
              <Promocoes
                onAddToCart={handleAddToCart}
                products={products}
                isLoadingProducts={isLoadingProducts}
                productsError={productsError}
              />
            }
          />
          <Route path="/institucional" element={<Institucional />} />
          <Route
            path="/produto/:id"
            element={
              <ProductDetails
                onAddToCart={handleAddToCart}
                products={products}
                isLoadingProducts={isLoadingProducts}
              />
            }
          />
          <Route path="/checkout" element={<Checkout cartItems={cartItems} onClearCart={() => setCartItems([])} />} />
        </Routes>

        <Footer />
        <WhatsAppButton />
      </div>
    </BrowserRouter>
  );
}

export default App;