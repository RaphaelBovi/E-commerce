import React, { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBoxes, FaSearch, FaSyncAlt } from 'react-icons/fa';
import AdminNavbar from '../components/AdminNavbar';
import {
  createProduct,
  deleteProductById,
  fetchProducts,
  updateProductByRef,
} from '../services/productsApi';
import './DashboardHome.css';
import './GestaoPedidos.css';
import './GestaoProdutos.css';

const EMPTY_FORM = {
  name: '',
  ref: '',
  price: '',
  qnt: '',
  marca: '',
  category: 'geral',
  image: '',
};

const ACCEPTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'];
const IMAGE_MIN_WIDTH = 600;
const IMAGE_MIN_HEIGHT = 600;
const IMAGE_RATIO_TOLERANCE = 0.03;

const categoryLabel = {
  'mais-vendidos': 'Mais vendidos',
  novidades: 'Lançamento',
  geral: 'Geral',
};

const getBadgeType = (product) => {
  if (product.qnt <= 0) return { label: 'Sem estoque', className: 'badge-danger' };
  if (product.category === 'novidades') return { label: 'Lançamento', className: 'badge-info' };
  if (product.price <= 2000) return { label: 'Promoção', className: 'badge-warning' };
  return { label: 'Ativo', className: 'badge-success' };
};

const getImageMimeFromDataUrl = (value) => {
  const match = String(value || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match?.[1]?.toLowerCase() || '';
};

const loadImageDimensions = (imageUrl) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
    img.src = imageUrl;
  });

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });

export default function GestaoProdutos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODOS');
  const [stockFilter, setStockFilter] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRef, setEditingRef] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedImageName, setSelectedImageName] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const searchTarget = `${product.name} ${product.ref} ${product.marca}`.toLowerCase();
      const matchesQuery = normalizedQuery ? searchTarget.includes(normalizedQuery) : true;
      const matchesCategory = categoryFilter === 'TODOS' ? true : product.category === categoryFilter;
      const matchesStock =
        stockFilter === 'TODOS'
          ? true
          : stockFilter === 'SEM_ESTOQUE'
            ? Number(product.qnt) <= 0
            : Number(product.qnt) > 0;

      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [products, query, categoryFilter, stockFilter]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingRef(null);
    setSelectedImageName('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
    setFeedback('');
    setError('');
  };

  const openEditModal = (product) => {
    setEditingRef(product.ref);
    setFormData({
      name: product.name || '',
      ref: product.ref || '',
      price: String(product.price ?? ''),
      qnt: String(product.qnt ?? ''),
      marca: product.marca || '',
      category: product.category || 'geral',
      image: product.image || '',
    });
    setSelectedImageName('');
    setIsModalOpen(true);
    setFeedback('');
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    const hasValidType = allowedMimeTypes.includes(file.type) || ACCEPTED_IMAGE_EXTENSIONS.includes(extension);
    if (!hasValidType) {
      setError('Arquivo inválido. Envie apenas imagem JPG ou PNG.');
      event.target.value = '';
      return;
    }

    try {
      setError('');
      const dataUrl = await readFileAsDataUrl(file);
      const { width, height } = await loadImageDimensions(dataUrl);
      if (width < IMAGE_MIN_WIDTH || height < IMAGE_MIN_HEIGHT) {
        setError(`A imagem precisa ter no mínimo ${IMAGE_MIN_WIDTH}x${IMAGE_MIN_HEIGHT}px.`);
        event.target.value = '';
        return;
      }

      const ratio = width / height;
      if (Math.abs(ratio - 1) > IMAGE_RATIO_TOLERANCE) {
        setError('Use imagem em formato quadrado (proporção 1:1) para manter o padrão visual.');
        event.target.value = '';
        return;
      }

      setFormData((prev) => ({ ...prev, image: dataUrl }));
      setSelectedImageName(file.name);
    } catch (err) {
      setError(err.message || 'Não foi possível processar o arquivo de imagem.');
      event.target.value = '';
    }
  };

  const validateForm = async () => {
    const requiredFields = ['name', 'ref', 'price', 'qnt', 'category'];
    const hasMissingRequired = requiredFields.some((field) => String(formData[field]).trim() === '');
    if (hasMissingRequired) {
      return 'Preencha todos os campos obrigatórios do produto.';
    }
    if (Number(formData.price) < 0) return 'Preço não pode ser negativo.';
    if (Number(formData.qnt) < 0) return 'Quantidade em estoque não pode ser negativa.';

    const imageValue = String(formData.image || '');
    if (!imageValue) {
      return 'Envie uma imagem em JPG ou PNG para o produto.';
    }

    const isDataUrl = imageValue.startsWith('data:image/');
    if (!isDataUrl) {
      return 'A imagem deve ser enviada por upload (JPG ou PNG).';
    }

    const mimeType = getImageMimeFromDataUrl(imageValue);
    if (!['image/jpeg', 'image/png'].includes(mimeType)) {
      return 'A imagem deve ser no formato JPG ou PNG.';
    }

    try {
      const { width, height } = await loadImageDimensions(formData.image);
      if (width < IMAGE_MIN_WIDTH || height < IMAGE_MIN_HEIGHT) {
        return `A imagem precisa ter no mínimo ${IMAGE_MIN_WIDTH}x${IMAGE_MIN_HEIGHT}px.`;
      }

      const ratio = width / height;
      if (Math.abs(ratio - 1) > IMAGE_RATIO_TOLERANCE) {
        return 'Use imagem em formato quadrado (proporção 1:1) para manter o padrão visual.';
      }
    } catch (err) {
      return err.message || 'Não foi possível validar a imagem informada.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = await validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const payload = {
      ...formData,
      price: Number(formData.price),
      qnt: Number(formData.qnt),
    };

    try {
      setSaving(true);
      setError('');
      setFeedback('');

      if (editingRef) {
        await updateProductByRef(editingRef, payload);
        setFeedback('Produto atualizado com sucesso.');
      } else {
        await createProduct(payload);
        setFeedback('Produto cadastrado com sucesso.');
      }

      closeModal();
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmDelete = window.confirm(
      `Deseja remover o produto ${product.name} (${product.ref})? Esta ação não pode ser desfeita.`
    );
    if (!confirmDelete) return;

    try {
      setError('');
      setFeedback('');
      await deleteProductById(product.id);
      setFeedback('Produto removido com sucesso.');
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Erro ao remover produto.');
    }
  };

  return (
    <div className="admin-layout">
      <AdminNavbar />

      <main className="dashboard-content">
        <div className="admin-header">
          <h1>Gestão de <span className="highlight-text">Produtos</span></h1>
          <p>Cadastre, edite e remova itens do catálogo integrando diretamente com o back-end.</p>
        </div>

        {feedback ? <div className="products-feedback success">{feedback}</div> : null}
        {error ? <div className="products-feedback error">{error}</div> : null}

        <section className="widget-box products-toolbar">
          <div className="products-search-group">
            <div className="products-search-input">
              <FaSearch />
              <input
                type="text"
                placeholder="Buscar por nome, referência ou marca..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="TODOS">Todas categorias</option>
              <option value="mais-vendidos">Mais vendidos</option>
              <option value="novidades">Lançamentos</option>
              <option value="geral">Geral</option>
            </select>

            <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
              <option value="TODOS">Todos os estoques</option>
              <option value="COM_ESTOQUE">Com estoque</option>
              <option value="SEM_ESTOQUE">Sem estoque</option>
            </select>
          </div>

          <div className="products-toolbar-actions">
            <button type="button" className="btn-refresh" onClick={loadProducts}>
              <FaSyncAlt /> Atualizar
            </button>
            <button type="button" className="btn-gold btn-create-product" onClick={openCreateModal}>
              <FaPlus /> Novo Produto
            </button>
          </div>
        </section>

        <section className="widget-box">
          {loading ? (
            <p className="text-center products-loading">Carregando produtos...</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Ref</th>
                    <th>Marca</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center">Nenhum produto encontrado para os filtros aplicados.</td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const badge = getBadgeType(product);
                      return (
                        <tr key={product.id || product.ref}>
                          <td className="product-cell">
                            <img src={product.image} alt={product.name} className="product-thumb" />
                            <div>
                              <strong>{product.name}</strong>
                            </div>
                          </td>
                          <td>{product.ref}</td>
                          <td>{product.marca || 'N/I'}</td>
                          <td>{categoryLabel[product.category] || product.category}</td>
                          <td>
                            {Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td>{product.qnt}</td>
                          <td><span className={`badge ${badge.className}`}>{badge.label}</span></td>
                          <td className="actions-cell">
                            <button className="btn-action btn-view" title="Editar" onClick={() => openEditModal(product)}>
                              <FaEdit />
                            </button>
                            <button className="btn-action btn-cancel" title="Remover" onClick={() => handleDelete(product)}>
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="widget-box products-footnote">
          <h3><FaBoxes /> Regras de integração com o site</h3>
          <ul>
            <li>Categoria <strong>novidades</strong>: produto aparece na página de Lançamentos.</li>
            <li>Categoria <strong>mais-vendidos</strong> e <strong>geral</strong>: produto aparece em Peças e Home.</li>
            <li>Preço até <strong>R$ 2.000,00</strong>: também entra na página de Promoções.</li>
            <li>Estoque <strong>0</strong>: produto permanece cadastrado, porém sinalizado como sem estoque.</li>
          </ul>
        </section>
      </main>

      {isModalOpen ? (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content product-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
            <h2 className="modal-title">
              {editingRef ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h2>

            <form className="product-form" onSubmit={handleSubmit}>
              <div className="product-form-grid">
                <label>
                  Nome do produto *
                  <input name="name" value={formData.name} onChange={handleFormChange} required />
                </label>

                <label>
                  Referência (ref) *
                  <input name="ref" value={formData.ref} onChange={handleFormChange} required />
                </label>

                <label>
                  Marca
                  <input name="marca" value={formData.marca} onChange={handleFormChange} placeholder="Ex.: BOSCH" />
                </label>

                <label>
                  Categoria *
                  <select name="category" value={formData.category} onChange={handleFormChange} required>
                    <option value="geral">Geral</option>
                    <option value="novidades">Lançamentos</option>
                    <option value="mais-vendidos">Mais vendidos</option>
                  </select>
                </label>

                <label>
                  Preço *
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <label>
                  Quantidade em estoque *
                  <input
                    type="number"
                    name="qnt"
                    value={formData.qnt}
                    onChange={handleFormChange}
                    min="0"
                    step="1"
                    required
                  />
                </label>
              </div>

              <label>
                Upload da imagem (JPG/PNG) *
                <input
                  key={editingRef || 'new-product-image'}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={handleImageFileChange}
                />
                <small className="image-field-help">
                  Selecione um arquivo JPG ou PNG. Tamanho mínimo: {IMAGE_MIN_WIDTH}x{IMAGE_MIN_HEIGHT}px e proporção 1:1.
                </small>
              </label>

              {selectedImageName ? (
                <p className="image-upload-name">Arquivo selecionado: {selectedImageName}</p>
              ) : null}

              {formData.image ? (
                <div className="image-preview-box">
                  <img src={formData.image} alt="Prévia do produto" />
                </div>
              ) : null}

              <div className="product-form-actions">
                <button type="button" className="btn-modal-cancel" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-modal-approve" disabled={saving}>
                  {saving ? 'Salvando...' : editingRef ? 'Atualizar produto' : 'Cadastrar produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
