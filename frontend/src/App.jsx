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

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
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
import Login from './pages/Login';
import MinhaConta from './pages/MinhaConta';

function App() {
  // Lista de itens atualmente no carrinho; cada item é { ...produto, quantity }
  const [cartItems, setCartItems] = useState([]);

  // Controla se o drawer lateral do carrinho está visível
  const [isCartOpen, setIsCartOpen] = useState(false);

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
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);

      if (existingItem) {
        // Produto já no carrinho: soma a quantidade nova à existente
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // Produto novo: adiciona ao final da lista com a quantidade informada
      return [...prevItems, { ...product, quantity }];
    });

    // Abre o drawer do carrinho para feedback visual imediato
    setIsCartOpen(true);
  };

  // ─── Atualizar quantidade de um item ────────────────────────────
  // Recebe o id do produto e a nova quantidade desejada.
  // Impede quantidade abaixo de 1 (para remover, use handleRemoveItem).
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // ─── Remover item do carrinho ────────────────────────────────────
  // Filtra o item com o id informado, removendo-o da lista.
  const handleRemoveItem = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // Soma total de unidades no carrinho (exibida no badge da Navbar)
  const totalCartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    // BrowserRouter habilita roteamento baseado em URL (history API)
    <BrowserRouter>
      {/* AuthProvider fornece contexto de autenticação para toda a árvore */}
      <AuthProvider>
      <div className="app">
        {/* Navbar fixa no topo; recebe contagem do carrinho e callback para abrir o drawer */}
        <Navbar
          cartCount={totalCartItemsCount}
          onOpenCart={() => setIsCartOpen(true)}
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
          {/* Checkout: recebe itens do carrinho e callback para limpar após pedido */}
          <Route path="/checkout" element={<Checkout cartItems={cartItems} onClearCart={() => setCartItems([])} />} />
          {/* Página de login e cadastro */}
          <Route path="/login" element={<Login />} />
          {/* Painel do usuário */}
          <Route path="/minha-conta" element={<MinhaConta />} />
        </Routes>

        {/* Rodapé exibido em todas as páginas */}
        <Footer />
        {/* Botão flutuante de WhatsApp fixo no canto inferior direito */}
        <WhatsAppButton />
      </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
