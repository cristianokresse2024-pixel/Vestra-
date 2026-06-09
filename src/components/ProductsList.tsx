import React, { useState } from 'react';
import { useReino } from '../store';
import { Product } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Archive, 
  Filter, 
  AlertTriangle, 
  Search,
  ChevronDown,
  Info,
  DollarSign,
  Scan,
  Camera
} from 'lucide-react';
import { BarcodeCameraScanner } from './BarcodeCameraScanner';
import { ProductImageCapture } from './ProductImageCapture';

export const ProductsList: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, partners } = useReino();
  
  // Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Roupas');
  const [costPrice, setCostPrice] = useState('0');
  const [salePrice, setSalePrice] = useState('0');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [partnerId, setPartnerId] = useState('');
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerType, setPartnerType] = useState<'lucro' | 'venda' | 'fixo' | 'consignado'>('venda');
  const [partnerValue, setPartnerValue] = useState('0');
  const [brand, setBrand] = useState('');
  const [image, setImage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');

  // Categories list
  const categories = ['Roupas', 'Acessórios', 'Perfumes', 'Calçados', 'Diversos'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'Todas' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      setErrorMsg('Por favor, preencha o código e o nome do produto.');
      return;
    }

    // Check if code already exists (duplicates)
    const codeDup = products.find(p => p.code.toLowerCase() === code.trim().toLowerCase() && p.id !== editingId);
    if (codeDup) {
      setErrorMsg(`Erro: Já existe um produto cadastrado com o código "${code.trim()}".`);
      return;
    }

    const numericCost = parseFloat(costPrice) || 0;
    const numericSale = parseFloat(salePrice) || 0;
    const numericStock = parseInt(stock, 10) || 0;
    const numericMinStock = parseInt(minStock, 10) || 0;
    const numericPartnerValue = parseFloat(partnerValue) || 0;

    if (numericSale < numericCost) {
      if (!confirm('Aviso: O preço de venda é inferior ao preço de custo. Deseja prosseguir mesmo assim?')) {
        return;
      }
    }

    const payload = {
      code: code.trim(),
      name: name.trim(),
      brand: brand.trim() || undefined,
      image: image || undefined,
      category,
      costPrice: numericCost,
      salePrice: numericSale,
      stock: numericStock,
      minStock: numericMinStock,
      partnerId: hasPartner && partnerId ? partnerId : undefined,
      hasPartner,
      partnerType: hasPartner ? partnerType : undefined,
      partnerValue: hasPartner ? numericPartnerValue : undefined
    };

    if (editingId) {
      updateProduct(editingId, payload);
    } else {
      addProduct(payload);
    }

    // Reset Form & Close
    resetForm();
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setCode(p.code);
    setName(p.name);
    setCategory(p.category);
    setCostPrice(p.costPrice.toString());
    setSalePrice(p.salePrice.toString());
    setStock(p.stock.toString());
    setMinStock(p.minStock.toString());
    setPartnerId(p.partnerId || '');
    setHasPartner(!!p.hasPartner);
    setPartnerType(p.partnerType || 'venda');
    setPartnerValue((p.partnerValue ?? 0).toString());
    setBrand(p.brand || '');
    setImage(p.image || '');
    setShowAddModal(true);
  };

  const resetForm = () => {
    setCode('');
    setName('');
    setCategory('Roupas');
    setCostPrice('0');
    setSalePrice('0');
    setStock('0');
    setMinStock('5');
    setPartnerId('');
    setHasPartner(false);
    setPartnerType('venda');
    setPartnerValue('0');
    setBrand('');
    setImage('');
    setEditingId(null);
    setShowAddModal(false);
    setErrorMsg('');
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row gap-2">
          {/* Text Search */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por código ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-200"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full sm:w-48 pl-3.5 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:border-purple-500 outline-none appearance-none cursor-pointer"
            >
              <option value="Todas">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs font-sans rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 self-stretch md:self-auto shadow-md shadow-purple-950/45 border border-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* Main Stock Products List Table */}
      <div className="glow-zinc-card rounded-2xl overflow-hidden">
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-zinc-800/80 text-zinc-400 font-medium font-sans uppercase tracking-wider text-[10px]">
                  <th className="p-4">Etiqueta/Cód</th>
                  <th className="p-4">Nome do Produto</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4 text-right">Preço de Custo</th>
                  <th className="p-4 text-right">Preço de Venda</th>
                  <th className="p-4 text-center">Val. Estoque</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {filteredProducts.map(p => {
                  const isStockCritical = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="p-4 font-mono text-purple-400 font-semibold text-[11px]">
                        🏷️ {p.code}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img 
                              src={p.image} 
                              alt={p.name} 
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-800/80 shrink-0 bg-neutral-900"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-550 font-bold uppercase text-[9px] font-mono">
                              {p.name.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-zinc-200 leading-snug">{p.name}</div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              {p.brand && (
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  Marca: <strong className="text-zinc-400 font-semibold font-sans">{p.brand}</strong>
                                </span>
                              )}
                              {p.hasPartner && p.partnerId && (
                                <span className="text-[9px] text-purple-400 font-mono flex items-center gap-1 bg-purple-950/25 px-1.5 py-0.5 rounded border border-purple-500/10">
                                  👤 {partners.find(part => part.id === p.partnerId)?.name || 'Parceiro'} • {' '}
                                  {p.partnerType === 'lucro' ? `${p.partnerValue}% Lucro` :
                                   p.partnerType === 'venda' ? `${p.partnerValue}% Venda` :
                                   p.partnerType === 'fixo' ? `R$ ${p.partnerValue} Fixo` :
                                   `Consignado (Loja: R$ ${p.partnerValue})`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-medium border border-zinc-700/50">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-zinc-400">
                        {p.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-4 text-right font-mono text-purple-300 font-bold">
                        {p.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-4 text-center font-mono">
                        <span className={`font-bold ${isStockCritical ? 'text-red-400' : 'text-zinc-200'}`}>
                          {p.stock}
                        </span>
                        <span className="text-zinc-500 text-[10px]"> / {p.minStock} un</span>
                      </td>
                      <td className="p-4 text-center">
                        {isStockCritical ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            Repor Estoque
                          </span>
                        ) : p.stock === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-rose-500 text-[10px] font-semibold">
                            Esgotado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-semibold">
                            Estável
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => startEdit(p)}
                            title="Editar Produto"
                            className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-purple-400 hover:border-purple-500/30 rounded-lg transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza de que deseja excluir o produto "${p.name}" permanentemente do estoque?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            title="Excluir Produto"
                            className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 px-8 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 bg-purple-900/10 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <Archive className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-semibold text-zinc-200">Nenhum produto correspondente</h3>
            <p className="text-zinc-500 text-xs font-sans leading-relaxed">
              O estoque está vazio. Clique no botão superior <span className="text-purple-400 font-semibold uppercase">Novo Produto</span> para iniciar o cadastro do seu acervo físico de roupas, perfumes ou acessórios.
            </p>
          </div>
        )}
      </div>

      {/* Modern Add / Edit Product Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="glow-zinc-card w-full max-w-lg rounded-3xl p-5 relative space-y-4 my-auto max-h-[95vh] flex flex-col">
            {/* Header line gradient */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 to-indigo-500" />
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-zinc-200 font-sans">
                {editingId ? 'Editar Produto Imperial' : 'Registrar Novo Atributo/Produto'}
              </h3>
              <button
                onClick={resetForm}
                className="text-zinc-500 hover:text-zinc-105 text-xs font-mono"
              >
                [ FECHAR ]
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs text-zinc-300 flex flex-col max-h-[80vh]">
              {errorMsg && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 shrink-0">
                  <Info className="w-4 h-4 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Scrollable Container for inputs */}
              <div className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[55vh] py-1">
                {/* Product Media Snapshot Uploader */}
                <ProductImageCapture 
                  currentValue={image}
                  onChange={(base64) => setImage(base64)}
                  onClear={() => setImage('')}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* 1. Barcode/Code */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="block text-zinc-400 font-semibold uppercase tracking-wide text-[10px]">
                      Código de Barras / SKU *
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ex: 789102392"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        className="flex-1 px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowScannerModal(true)}
                        className="px-3 bg-zinc-900 border border-zinc-800 hover:border-purple-500 hover:text-purple-400 rounded-lg text-zinc-400 flex items-center justify-center transition-all cursor-pointer"
                        title="Efetuar Leitura por Câmera"
                      >
                        <Scan className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 2. Brand / Marca */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="block text-zinc-400 font-semibold uppercase tracking-wide text-[10px]">
                      Marca / Fabricante
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Natura, Zara, Nike"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-purple-500 outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 3. Product Title */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="block text-zinc-400 font-semibold uppercase tracking-wide text-[10px]">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Perfume Malbec Premium"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-xs"
                    />
                  </div>

                  {/* 4. Category selection */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="block text-zinc-400 font-semibold uppercase tracking-wide text-[10px]">
                      Categoria
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:border-purple-500 outline-none text-xs cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 4. Cost price */}
                  <div className="space-y-1.5">
                    <label className="block text-zinc-400 font-semibold uppercase tracking-wide text-[10px] flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-purple-400" /> Preço de Custo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-purple-500 outline-none font-mono text-xs"
                    />
                  </div>

                  {/* 5. Retail price */}
                  <div className="space-y-1.5">
                    <label className="block text-zinc-400 font-semibold uppercase tracking-wide text-[10px] flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" /> Preço de Venda (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-purple-500 outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 6. Stock initial */}
                  <div className="space-y-1.5">
                    <label className="block text-zinc-400 font-semibold uppercase tracking-wide text-[10px]">
                      Estoque Inicial
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-purple-500 outline-none font-mono text-xs"
                    />
                  </div>

                  {/* 7. Stock warning limit */}
                  <div className="space-y-1.5">
                    <label className="block text-zinc-400 font-semibold uppercase tracking-wide text-[10px] text-red-300">
                      Estoque Mínimo Alerta
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="5"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-805 rounded-lg text-zinc-100 focus:border-purple-500 outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Configuração de Parceria de Produto */}
                <div className="p-4 bg-zinc-900/35 border border-zinc-805 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">Parceria de Produto</h4>
                      <p className="text-[10px] text-zinc-500">Comissionamento automático para este produto</p>
                    </div>
                    <select
                      value={hasPartner ? "sim" : "nao"}
                      onChange={(e) => {
                        const yes = e.target.value === "sim";
                        setHasPartner(yes);
                        if (yes && !partnerId && partners.length > 0) {
                          setPartnerId(partners[0].id);
                        }
                      }}
                      className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:border-purple-500 outline-none cursor-pointer"
                    >
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                  </div>

                  {hasPartner && (
                    <div className="space-y-3 pt-3 border-t border-zinc-800/60 transition-all duration-200">
                      {/* Parceiro */}
                      <div className="space-y-1">
                        <label className="block text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Parceiro Vinculado</label>
                        {partners.length > 0 ? (
                          <select
                            value={partnerId}
                            onChange={(e) => setPartnerId(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-955 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:border-purple-500 outline-none cursor-pointer"
                          >
                            <option value="">Selecione o parceiro...</option>
                            {partners.map(part => (
                              <option key={part.id} value={part.id}>{part.name}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-[10px] text-amber-500 leading-normal">⚠️ Nenhum parceiro cadastrado no sistema. Cadastre-os na aba parceiros antes de gerenciar parcerias.</p>
                        )}
                      </div>

                      {/* Tipo de Parceria */}
                      <div className="space-y-1">
                        <label className="block text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Tipo de Parceria</label>
                        <select
                          value={partnerType}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setPartnerType(val);
                            // Default value parameters for smoothness
                            if (val === 'fixo') setPartnerValue('10');
                            else if (val === 'venda') setPartnerValue('20');
                            else if (val === 'lucro') setPartnerValue('50');
                            else if (val === 'consignado') setPartnerValue('15');
                          }}
                          className="w-full px-3 py-2 bg-zinc-955 border border-zinc-805 rounded-lg text-xs text-zinc-200 focus:border-purple-500 outline-none cursor-pointer"
                        >
                          <option value="lucro">Percentual do lucro (% do Lucro)</option>
                          <option value="venda">Percentual da venda (% da Venda)</option>
                          <option value="fixo">Valor fixo por unidade (R$ Fixo)</option>
                          <option value="consignado">Produto consignado (Loja recebe comissão fixa)</option>
                        </select>
                      </div>

                      {/* Valor correspondente */}
                      <div className="space-y-1">
                        <label className="block text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                          {partnerType === 'lucro' ? 'Percentual de Lucro para o Parceiro (%)' :
                           partnerType === 'venda' ? 'Percentual do Preço de Venda (%)' :
                           partnerType === 'fixo' ? 'Repasse Fixo ao Parceiro por Unidade (R$)' :
                           'Comissão Fixa retida pela Loja por Unidade (R$)'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-mono font-medium text-zinc-500">
                            {partnerType === 'lucro' || partnerType === 'venda' ? '%' : 'R$'}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={partnerValue}
                            onChange={(e) => setPartnerValue(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-zinc-955 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:border-purple-500 outline-none font-mono"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-[9px] text-zinc-550 bg-zinc-950/20 p-2 rounded border border-zinc-900/60 leading-normal mt-1 text-justify">
                          {partnerType === 'lucro' && '💡 O parceiro recebe uma porcentagem sobre o lucro de cada unidade vendida (Preço de Venda - Custo).'}
                          {partnerType === 'venda' && '💡 O parceiro recebe uma comissão direta sobre o preço bruto de cada unidade vendida.'}
                          {partnerType === 'fixo' && '💡 O parceiro recebe uma quantia estipulada em dinheiro para cada unidade vendida.'}
                          {partnerType === 'consignado' && '💡 O produto pertence ao parceiro. A loja ganha uma comissão fixa pela venda, e o resto da receita vai para o parceiro.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex gap-3 pt-3 border-t border-zinc-800/85 shrink-0">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 rounded-xl transition-all cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-650 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-purple-900/20 border border-purple-500/10 cursor-pointer text-xs"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Ativo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Camera Capture Portal */}
      {showScannerModal && (
        <BarcodeCameraScanner
          onScanSuccess={(scannedCode) => {
            setCode(scannedCode);
            setShowScannerModal(false);
          }}
          onClose={() => setShowScannerModal(false)}
        />
      )}
    </div>
  );
};
