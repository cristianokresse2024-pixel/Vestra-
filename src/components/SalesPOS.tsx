import React, { useState, useRef, useEffect } from 'react';
import { useReino } from '../store';
import { Product, SaleItem } from '../types';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Scan, 
  Tag, 
  Search, 
  Users, 
  CheckCircle,
  AlertTriangle,
  Camera
} from 'lucide-react';
import { BarcodeCameraScanner } from './BarcodeCameraScanner';

export const SalesPOS: React.FC = () => {
  const { products, partners, addSale } = useReino();
  
  // Scanned / Shopping basket state
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Pix');
  
  // Search bar & Simulated Barcode Input
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedCode, setScannedCode] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial focus
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }

    // Global barcode listener
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Avoid hijacking keystrokes when the user is explicitly writing inside an editable field other than barcode scanner input itself
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        // If it's already a text input, proceed normally and do not hijack
        if (activeEl !== barcodeInputRef.current) {
          return;
        }
      }

      // Ignore modifiers (Ctrl, Cmd, Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // When starting to type alphanumeric characters, ensure barcode field receives and preserves focus
      if (barcodeInputRef.current && e.key && e.key.length === 1 && /[a-zA-Z0-9\-]/.test(e.key)) {
        if (document.activeElement !== barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // Active searched products
  const filteredProducts = searchQuery ? products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // 1. Scan/Search Action
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcode(scannedCode);
  };
  
  const processBarcode = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    const found = products.find(p => p.code.toLowerCase() === cleanCode.toLowerCase());
    if (found) {
      addProductToCart(found);
      setScannedCode('');
      setFeedbackMsg(`"${found.name}" escaneado com sucesso!`);
      setTimeout(() => setFeedbackMsg(''), 3000);
    } else {
      setFeedbackMsg(`Erro: Código "${cleanCode}" não cadastrado.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  // Core Product Partnership Commission Calculator based on custom configuration
  const calculateItemCommission = (prod: Product, quantity: number) => {
    if (!prod.hasPartner || !prod.partnerId) return undefined;
    const type = prod.partnerType || 'venda';
    const val = prod.partnerValue || 0;
    
    switch (type) {
      case 'lucro': {
        const unitProfit = Math.max(0, prod.salePrice - prod.costPrice);
        return (unitProfit * (val / 100)) * quantity;
      }
      case 'venda': {
        return (prod.salePrice * (val / 100)) * quantity;
      }
      case 'fixo': {
        return val * quantity;
      }
      case 'consignado': {
        const partnerPayoutPerUnit = Math.max(0, prod.salePrice - val);
        return partnerPayoutPerUnit * quantity;
      }
      default:
        return undefined;
    }
  };

  // 2. Add product to basket helper
  const addProductToCart = (prod: Product) => {
    if (prod.stock <= 0) {
      setFeedbackMsg(`Erro: Produto de código "${prod.code}" sem unidades no estoque.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === prod.id);
      if (existing) {
        // Double check against registered physical stock
        if (existing.quantity >= prod.stock) {
          setFeedbackMsg(`Estoque indisponível para adicionar mais de "${prod.name}".`);
          setTimeout(() => setFeedbackMsg(''), 4000);
          return prev;
        }
        return prev.map(item => {
          if (item.productId === prod.id) {
            const newQty = item.quantity + 1;
            const commissionAmount = calculateItemCommission(prod, newQty);
            return { ...item, quantity: newQty, commissionAmount };
          }
          return item;
        });
      } else {
        const commissionAmount = calculateItemCommission(prod, 1);

        return [...prev, {
          productId: prod.id,
          name: prod.name,
          quantity: 1,
          costPrice: prod.costPrice,
          salePrice: prod.salePrice,
          partnerId: prod.hasPartner && prod.partnerId ? prod.partnerId : undefined,
          commissionAmount
        }];
      }
    });
  };

  // 3. Basket modification actions
  const handleIncreaseQty = (item: SaleItem) => {
    const prod = products.find(p => p.id === item.productId);
    if (prod && item.quantity < prod.stock) {
      setCart(prev => prev.map(i => {
        if (i.productId === item.productId) {
          const newQty = i.quantity + 1;
          const commissionAmount = calculateItemCommission(prod, newQty);
          return { ...i, quantity: newQty, commissionAmount };
        }
        return i;
      }));
    } else {
      setFeedbackMsg('Limite máximo de estoque atingido!');
      setTimeout(() => setFeedbackMsg(''), 2500);
    }
  };

  const handleDecreaseQty = (itemId: string) => {
    const prod = products.find(p => p.id === itemId);
    setCart(prev => prev.map(item => {
      if (item.productId === itemId) {
        const nextQty = item.quantity - 1;
        if (nextQty > 0) {
           const commissionAmount = prod ? calculateItemCommission(prod, nextQty) : undefined;
           return { ...item, quantity: nextQty, commissionAmount };
        }
        return null; // Will trigger filter later
      }
      return item;
    }).filter((i): i is SaleItem => i !== null));
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(prev => prev.filter(i => i.productId !== itemId));
  };

  // Computations
  const subtotal = cart.reduce((acc, item) => acc + (item.salePrice * item.quantity), 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const total = Math.max(0, subtotal - discountVal);
  
  // Total commissions dynamically calculated from specific items
  const totalCommissions = cart.reduce((acc, item) => acc + (item.commissionAmount || 0), 0);

  // Profit calculation (sale price - cost price for all items, subtract discount)
  const costSum = cart.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);
  const profit = Math.max(0, total - costSum);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    addSale({
      items: cart,
      paymentMethod,
      discount: discountVal,
      total,
      profit
    });

    // Reset checkout form
    setCart([]);
    setDiscountPercent(0);
    setPaymentMethod('Pix');
    setFeedbackMsg('Venda registrada com sucesso absoluto!');
    setTimeout(() => setFeedbackMsg(''), 5000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Search and barcode input panels (POS Left) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Scanned simulation widget */}
        <div className="glow-zinc-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-zinc-300 font-sans flex items-center gap-2">
              <Scan className="w-4 h-4 text-purple-400" />
              Leitor de Código de Barras (PDV)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full uppercase">
              Operacional
            </span>
          </div>

          <form onSubmit={handleBarcodeScan} className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Insira ou simule escaneamento de código de barras"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 outline-none"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs font-sans rounded-xl active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
              title="Abrir Câmera do Dispositivo"
            >
              <Camera className="w-4 h-4" />
              Câmera
            </button>
            <button
              type="submit"
              className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs font-sans rounded-xl active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
            >
              <Scan className="w-4 h-4" />
              Lançar
            </button>
          </form>

          {/* Quick Click-to-Scan trigger for fast demo support */}
          {products.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase font-mono text-purple-400 mb-2">
                Simuladores de Etiquetas Rápidas (Toque para Escanear na hora)
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {products.map(p => (
                  <button
                    key={p.id}
                    title={`Toque para simular escaneamento do código de barras: ${p.code}`}
                    onClick={() => {
                      addProductToCart(p);
                      setFeedbackMsg(`Produto "${p.name}" escaneado! `);
                      setTimeout(() => setFeedbackMsg(''), 2500);
                    }}
                    className="px-2.5 py-1 text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-300 rounded-md transition-all text-left truncate max-w-[150px] flex items-center gap-1"
                  >
                    <span className="text-purple-500">🏷️</span> {p.code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {feedbackMsg && (
            <div className={`mt-3 p-3 rounded-xl border text-xs font-sans flex items-center gap-2 ${
              feedbackMsg.includes('Erro')
                ? 'bg-red-950/20 border-red-500/20 text-red-400'
                : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
            }`}>
              <CheckCircle className="w-4 h-4 shrink-0" />
              <p>{feedbackMsg}</p>
            </div>
          )}
        </div>

        {/* Text lookup index search form */}
        <div className="glow-zinc-card p-6 rounded-2xl">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-zinc-300 font-sans mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-400" />
            Pesquisa Manual de Prateleiras
          </h3>
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
              <Search className="w-4 h-4 text-zinc-500" />
            </span>
            <input
              type="text"
              placeholder="Digite o nome ou a categoria do produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 outline-none"
            />
          </div>

          {searchQuery && (
            <div className="border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800 max-h-56 overflow-y-auto">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(p => (
                  <div key={p.id} className="p-3 bg-zinc-900/40 hover:bg-zinc-900 flex items-center justify-between text-xs transition-colors">
                    <div>
                      <p className="font-semibold text-zinc-200">{p.name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        Cód: {p.code} • Cat: {p.category} • Estoque: {p.stock} un.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-zinc-300">
                        {p.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <button
                        onClick={() => addProductToCart(p)}
                        className="p-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-zinc-500 text-xs font-sans">
                  Nenhum produto correspondente encontrado para sua pesquisa.
                </div>
              )}
            </div>
          )}

          {products.length === 0 && (
            <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                Nenhum produto cadastrado nesta loja no momento. Cadastre produtos na aba <span className="text-purple-400 font-semibold uppercase">Produtos</span> antes de poder simular e registrar vendas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cart, partner selection and summary (POS Right) */}
      <div className="lg:col-span-5 glow-zinc-card p-6 rounded-2xl space-y-6 relative border border-purple-500/10">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-zinc-300 font-sans flex items-center gap-2 pb-2 border-b border-zinc-800">
          <ShoppingBag className="w-4 h-4 text-purple-400" />
          Carrinho do Reino
        </h3>

        {/* List of items */}
        {cart.length > 0 ? (
          <div className="divide-y divide-zinc-800 max-h-64 overflow-y-auto pr-1">
            {cart.map(item => (
              <div key={item.productId} className="py-3 first:pt-0 flex items-center justify-between text-xs">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-semibold text-zinc-200 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-zinc-400 font-mono">
                      {item.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} un.
                    </p>
                    {item.partnerId && item.commissionAmount !== undefined && item.commissionAmount > 0 && (
                      <span className="text-[9px] bg-purple-950/45 text-purple-300 px-1.5 py-0.5 rounded-md border border-purple-500/20 font-sans">
                        Parceria: {item.commissionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Quantity controls */}
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleDecreaseQty(item.productId)}
                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2.5 font-mono text-zinc-200 text-xs">{item.quantity}</span>
                    <button
                      onClick={() => handleIncreaseQty(item)}
                      className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Calculated total item price */}
                  <span className="font-mono font-bold text-zinc-300 min-w-[70px] text-right">
                    {(item.salePrice * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>

                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500 text-xs font-sans">
            Seu carrinho de compras está vazio no momento. Pesquise ou simule a etiqueta de um produto para começar.
          </div>
        )}

        {/* Config and totals drawer */}
        {cart.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-zinc-800/80">
            {/* 1. Discounts */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                Desconto Aplicável
              </label>
              <div className="flex gap-2">
                {[0, 5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setDiscountPercent(pct)}
                    className={`flex-1 py-1 px-2 text-xs font-mono rounded-md border transition-all ${
                      discountPercent === pct
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400 font-bold'
                        : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Payment methods */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider font-sans">
                Forma de Recebimento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Pix', 'Dinheiro', 'Cartão Crédito', 'Cartão Débito'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-3 text-xs text-center border rounded-lg transition-all ${
                      paymentMethod === method
                        ? 'bg-purple-600 text-white font-semibold border-purple-500 shadow-md shadow-purple-950/40'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed totals layout */}
            <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 text-xs font-sans space-y-2 font-medium">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono text-zinc-300">
                  {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              
              {discountPercent > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Desconto de {discountPercent}%</span>
                  <span className="font-mono">
                    -{discountVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}

              {totalCommissions > 0 && (
                <div className="flex justify-between text-amber-500 pb-1 border-b border-dashed border-zinc-800/80 text-[11px]">
                  <span>Comissões de Parceiros Envolvidos</span>
                  <span className="font-mono">
                    {totalCommissions.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-zinc-100 text-sm font-bold pt-1">
                <span>A Pagar</span>
                <span className="font-mono text-purple-400">
                  {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              <div className="text-[10px] text-zinc-500 font-sans flex items-center justify-between font-normal">
                <span>Esta transação gerará margem de: </span>
                <span className="font-mono text-emerald-400">+{profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>

            {/* Final checkout button */}
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50"
            >
              <CheckCircle className="w-4.5 h-4.5" />
              Finalizar Venda
            </button>
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeCameraScanner
           onScanSuccess={(code) => {
             processBarcode(code);
             setShowScanner(false);
           }}
           onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};
