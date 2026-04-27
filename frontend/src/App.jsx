// ─────────────────────────────────────────────────────────────────
// App.jsx — Componente raiz da aplicação
//
// Responsável por:
//  - Gerenciar o estado global do carrinho (itens, quantidade, abertura)
//  - Buscar os produtos da API ao inicializar e manter fallback local
//  - Definir todas as rotas da aplicação via React Router
//  - Renderizar Navbar, Footer, CartDrawer e WhatsAppButton em todas as páginas
//
// Para adicionar uma nova rota, importe a página e adicione um <Route>
// dentro do bloco <Routes>. Para novo estado global, considere usar
// Context API ou Zustand.
// ─────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from './context/useAuth';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AuthProvider from './context/AuthProvider';
import FavoritesProvider from './context/FavoritesProvider';
import { CompareProvider } from './context/CompareContext';
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
import { syncCart, clearCartSync } from './services/cartSyncApi';
import { fetchProducts } from './services/productsApi';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import MinhaConta from './pages/MinhaConta';
import RecuperarSenha from './pages/RecuperarSenha';
import Favoritos from './pages/Favoritos';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
import TermosDeUso from './pages/TermosDeUso';
import CookieBanner from './components/CookieBanner';
import NotFound from './pages/NotFound';
import Comparar from './pages/Comparar';
import CompareBar from './components/CompareBar';

// Debounced cart sync — must live inside AuthProvider to access useAuth
function CartSyncEffect({ cartItems }) {
  const { isAuthenticated } = useAuth();
  const timerRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!isAuthenticated) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (cartItems.length > 0) {
        syncCart(cartItems).catch(() => {});
      } else {
        clearCartSync().catch(() => {});
      }
    }, 5000);
    return () => clearTimeout(timerRef.current);
  }, [cartItems, isAuthenticated]);

  return null;
}

// Redirects unauthenticated users to /login, preserving the intended destination
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

const CART_KEY = 'ecommerce_cart';

function App() {
  // Inicializa o carrinho a partir do localStorage (persiste entre recarregamentos)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Controla se o drawer lateral do carrinho está visível
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persiste o carrinho no localStorage a cada mudança
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    } catch { /* ignore quota errors */ }
  }, [cartItems]);

  // Limpa o carrinho do estado e do localStorage (chamado no logout e no pós-checkout)
  const clearCart = useCallback(() => {
    setCartItems([]);
    try { localStorage.removeItem(CART_KEY); } catch { /* ignore */ }
    clearCartSync().catch(() => {});
  }, []);

  // Lista de produtos: começa com dados locais (mockData) e é substituída
  // pelos dados da API assim que a requisição termina com sucesso
  const [products, setProducts] = useState(fallbackProducts);

  // true enquanto a chamada à API ainda não terminou
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Mensagem de erro exibida quando a API falha (usa dados locais como fallback)
  const [productsError, setProductsError] = useState('');

  // ─── Busca de produtos ───────────────────────────────────────────
  // Executa uma vez ao montar o componente.
  // Usa a flag isMounted para evitar atualizações de estado após
  // o componente ser desmontado (previne memory leaks).
  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const apiProducts = await fetchProducts();
        // Só atualiza o estado se o componente ainda estiver montado
        // e se a API retornou ao menos um produto
        if (isMounted && apiProducts.length > 0) {
          setProducts(apiProducts);
          setProductsError('');
        }
      } catch (error) {
        if (isMounted) {
          console.error("Erro na API:", error);
          // Mantém os produtos locais e exibe um aviso ao usuário
          setProductsError('Não foi possível carregar o catálogo pela API. Exibindo dados locais de exemplo.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    };

    loadProducts();

    // Cleanup: cancela atualizações de estado se o componente desmontar antes
    return () => {
      isMounted = false;
    };
  }, []);

  // ─── Adicionar ao carrinho ───────────────────────────────────────
  // Recebe um produto e uma quantidade (padrão = 1).
  // Se o produto já existe no carrinho, incrementa a quantidade;
  // caso contrário, adiciona um novo item.
  // Também abre o drawer automaticamente após adicionar.
  const handleAddToCart = (product, quantity = 1) => {
    const maxQty = product.qnt ?? Infinity;
    const existing = cartItems.find(item => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + quantity > maxQty) {
      toast.error(
        maxQty === 0
          ? 'Produto fora de estoque.'
          : `Estoque insuficiente! Disponível: ${maxQty} unidade${maxQty !== 1 ? 's' : ''}.`,
        { duration: 2500, position: 'top-right' }
      );
      return;
    }

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

    toast.success('Adicionado ao carrinho!', { duration: 2000, position: 'top-right' });
    setIsCartOpen(true);
  };

  // ─── Atualizar quantidade de um item ────────────────────────────
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setCartItems(prevItems => {
      const item = prevItems.find(i => i.id === productId);
      if (!item) return prevItems;
      const maxQty = item.qnt ?? Infinity;
      const clamped = Math.min(newQuantity, maxQty);
      if (clamped === item.quantity) return prevItems;
      return prevItems.map(i => i.id === productId ? { ...i, quantity: clamped } : i);
    });
  };

  // ─── Remover item do carrinho ────────────────────────────────────
  // Filtra o item com o id informado, removendo-o da lista.
  const handleRemoveItem = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // Soma total de unidades no carrinho (exibida no badge da Navbar)
  const totalCartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
    <BrowserRouter>
      <AuthProvider onLogout={clearCart}>
      <FavoritesProvider>
      <CompareProvider>
      <div className="app">
        {/* Navbar fixa no topo; recebe contagem do carrinho e callback para abrir o drawer */}
        <CartSyncEffect cartItems={cartItems} />
        <Navbar
          cartCount={totalCartItemsCount}
          onOpenCart={() => setIsCartOpen(true)}
          products={products}
        />

        {/* Drawer lateral do carrinho; controlado pelo estado isCartOpen */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />

        {/* Definição de todas as rotas da aplicação */}
        <Routes>
          {/* Página inicial: recebe produtos e handlers do carrinho */}
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
          {/* Catálogo completo com filtros e paginação */}
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
          {/* Página de lançamentos (filtra category="novidades") */}
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
          {/* Página de promoções (filtra preço máximo R$2000) */}
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
          {/* Página institucional estática (Missão, Visão, Valores) */}
          <Route path="/institucional" element={<Institucional />} />
          {/* Detalhes de um produto pelo id dinâmico na URL (/produto/123) */}
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
          {/* Checkout: público — suporta compra como convidado */}
          <Route path="/checkout" element={
            <Checkout cartItems={cartItems} onClearCart={clearCart} />
          } />
          {/* Página de login e cadastro */}
          <Route path="/login" element={<Login />} />
          {/* Recuperação de senha */}
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          {/* Painel do usuário */}
          <Route path="/minha-conta" element={<MinhaConta />} />
          {/* Favoritos — protegido */}
          <Route path="/favoritos" element={
            <ProtectedRoute>
              <Favoritos onAddToCart={handleAddToCart} />
            </ProtectedRoute>
          } />
          {/* LGPD */}
          <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/termos-de-uso" element={<TermosDeUso />} />
          {/* Comparação de produtos */}
          <Route path="/comparar" element={<Comparar onAddToCart={handleAddToCart} />} />
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Rodapé exibido em todas as páginas */}
        <Footer />
        {/* Botão flutuante de WhatsApp fixo no canto inferior direito */}
        <WhatsAppButton />
        {/* Banner de consentimento de cookies — LGPD */}
        <CookieBanner />
        {/* Barra de comparação de produtos */}
        <CompareBar />
        <Toaster toastOptions={{ style: { fontFamily: 'inherit', fontSize: '0.875rem' } }} />
      </div>
      </CompareProvider>
      </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
