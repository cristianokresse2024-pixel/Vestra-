import React, { useState, useMemo } from 'react';
import { useReino } from '../store';
import { CashEntry } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Search, 
  Plus, 
  Trash2, 
  PiggyBank, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  X, 
  RefreshCw, 
  SlidersHorizontal, 
  Info, 
  CheckCircle2, 
  Briefcase,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const fVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export function CashFlow() {
  const { cashEntries, addCashEntry, deleteCashEntry } = useReino();
  
  // State for recording a new transaction
  const [type, setType] = useState<'entrada' | 'saída'>('entrada');
  const [category, setCategory] = useState<string>('Recebimentos');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'entrada' | 'saída'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthStr);

  // Auto update category when type toggles
  const handleTypeToggle = (newType: 'entrada' | 'saída') => {
    setType(newType);
    if (newType === 'entrada') {
      setCategory('Recebimentos');
    } else {
      setCategory('Despesas');
    }
  };

  // Format Helper for BRL Currency
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Format Helper for Short Dates
  const formatShortDate = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return isoDate;
    }
  };

  const formatShortTime = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Month list extraction from existing cash entries
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    // Make sure we always include current month
    months.add(currentMonthStr);
    
    cashEntries.forEach(entry => {
      if (entry.date) {
        months.add(entry.date.slice(0, 7));
      }
    });

    return Array.from(months).sort((a,b) => b.localeCompare(a)); // Descending chronological
  }, [cashEntries, currentMonthStr]);

  // Unified lists of categories for inputs and filter dropdowns
  const incomeCategories = ['Vendas', 'Recebimentos', 'Outros'];
  const expenseCategories = ['Despesas', 'Pagamentos', 'Retiradas pessoais', 'Outros'];
  const allCategories = Array.from(new Set([...incomeCategories, ...expenseCategories]));

  // Handle Recording New Cash Book Action
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return;

    const parsedAmount = parseFloat(amount);
    
    // Check if backdated customDate option is filled, otherwise default
    const dateToSave = customDate 
      ? new Date(customDate + 'T12:00:00').toISOString() 
      : new Date().toISOString();

    addCashEntry({
      type,
      description: description.trim(),
      amount: parsedAmount,
      category,
      date: dateToSave
    });

    setDescription('');
    setAmount('');
    setFormSuccess('Lançamento registrado com sucesso!');
    setTimeout(() => setFormSuccess(null), 3000);
  };

  // 1. CALCULATIONS: Financial metrics with high clarity
  const metrics = useMemo(() => {
    // Current Global Balance represents ALL entries
    const globalIn = cashEntries
      .filter(e => e.type === 'entrada')
      .reduce((sum, e) => sum + e.amount, 0);
    const globalOut = cashEntries
      .filter(e => e.type === 'saída')
      .reduce((sum, e) => sum + e.amount, 0);
    const currentBalance = globalIn - globalOut;

    // Filtered analytics based on current period (Month Filter)
    const periodEntries = cashEntries.filter(entry => {
      if (monthFilter === 'todos') return true;
      return entry.date && entry.date.slice(0, 7) === monthFilter;
    });

    const periodIn = periodEntries
      .filter(e => e.type === 'entrada')
      .reduce((sum, e) => sum + e.amount, 0);

    const periodOut = periodEntries
      .filter(e => e.type === 'saída')
      .reduce((sum, e) => sum + e.amount, 0);

    const periodNet = periodIn - periodOut;

    // Categorized volume calculations within selected period
    const categoryTotals: Record<string, number> = {};
    allCategories.forEach(cat => {
      categoryTotals[cat] = 0;
    });

    periodEntries.forEach(e => {
      if (categoryTotals[e.category] !== undefined) {
        categoryTotals[e.category] += e.amount;
      } else {
        categoryTotals[e.category] = e.amount;
      }
    });

    return {
      currentBalance,
      periodIn,
      periodOut,
      periodNet,
      categoryTotals,
      totalCount: periodEntries.length
    };
  }, [cashEntries, monthFilter]);

  // 2. SEARCH & FILTER: History List
  const filteredEntries = useMemo(() => {
    return cashEntries.filter(entry => {
      // 1. Month period Filter
      if (monthFilter !== 'todos') {
        if (!entry.date || entry.date.slice(0, 7) !== monthFilter) {
          return false;
        }
      }

      // 2. Type Filter
      if (typeFilter !== 'todos' && entry.type !== typeFilter) {
        return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'todos' && entry.category !== categoryFilter) {
        return false;
      }

      // 4. Search text descriptor or category name
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const descMatch = entry.description.toLowerCase().includes(query);
        const catMatch = entry.category.toLowerCase().includes(query);
        const idMatch = entry.id.slice(0, 8).toLowerCase().includes(query);
        if (!descMatch && !catMatch && !idMatch) {
          return false;
        }
      }

      return true;
    });
  }, [cashEntries, monthFilter, typeFilter, categoryFilter, searchTerm]);

  // Category Color Badges Match
  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Vendas':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Recebimentos':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Despesas':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Pagamentos':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'Retiradas pessoais':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/50';
    }
  };

  // Category Icon Match
  const getCategoryBadgeIcon = (cat: string) => {
    switch (cat) {
      case 'Vendas':
        return <ArrowUpRight className="w-3 h-3 text-purple-400 shrink-0" />;
      case 'Recebimentos':
        return <TrendUpIcon className="w-3 h-3 text-emerald-400 shrink-0" />;
      case 'Despesas':
        return <TrendingDown className="w-3 h-3 text-amber-400 shrink-0" />;
      case 'Pagamentos':
        return <CreditCard className="w-3 h-3 text-teal-400 shrink-0" />;
      case 'Retiradas pessoais':
        return <PiggyBank className="w-3 h-3 text-pink-400 shrink-0" />;
      default:
        return <Info className="w-3 h-3 text-zinc-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Upper Intro / Period Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans border-b border-zinc-900 pb-5">
        <div>
          <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-400 border border-purple-500/20 text-[9px] uppercase font-mono tracking-wider font-bold rounded-md inline-block mb-1.5">
            Módulo Financeiro Consolidado
          </span>
          <h2 className="text-lg font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-400" /> Fluxo de Caixa Real
          </h2>
          <p className="text-[11px] text-zinc-400">
            Acompanhe a liquidez do seu reino lojista: aporte de vendas, recebimentos, despesas operativas e retiradas de sócios.
          </p>
        </div>

        {/* Month Selector for Clarity */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-zinc-900 border border-zinc-800 p-1.5 px-3 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
          <span className="text-zinc-400 text-xs font-semibold">Período:</span>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-transparent text-white font-mono text-xs font-bold focus:outline-none cursor-pointer pr-1"
          >
            <option value="todos" className="bg-zinc-950 text-white">Todos os Meses</option>
            {availableMonths.map(m => {
              const [yr, mn] = m.split('-');
              const monthsBR = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
              ];
              const monthLabel = monthsBR[parseInt(mn, 10) - 1] + ' ' + yr;
              return (
                <option key={m} value={m} className="bg-zinc-950 text-white">
                  {monthLabel} ({m})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 2. Visual Clarity Banners: Saldo e Indicadores de Liquidez */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {/* Current Liquid Cash Balance */}
        <motion.div 
          variants={itemVariants} 
          className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10 flex flex-col justify-between relative overflow-hidden md:col-span-2"
        >
          {/* Subtle bg vector */}
          <div className="absolute right-0 bottom-0 translate-x-1 translate-y-2 opacity-[0.03] select-none text-zinc-100 pointer-events-none">
            <DollarSign className="w-32 h-32" />
          </div>

          <div className="flex items-center justify-between mb-4 z-10">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-zinc-400">
                Saldo Financeiro em Caixa
              </span>
              <p className="text-[9px] text-zinc-500">Saldo global acumulado em conta</p>
            </div>
            <div className={`p-2.5 rounded-xl border ${
              metrics.currentBalance >= 0 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}>
              <PiggyBank className="w-5 h-5 stroke-[1.8]" />
            </div>
          </div>

          <div className="z-10">
            <h1 className={`text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none ${
              metrics.currentBalance >= 0 ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.15)]' : 'text-red-400'
            }`}>
              {formatBRL(metrics.currentBalance)}
            </h1>
            <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1">
              <Info className="w-3 h-3 shrink-0 text-zinc-650" />
              <span>O caixa acumula todas as vendas do PDV e aportes menos saídas físicas.</span>
            </div>
          </div>
        </motion.div>

        {/* Current Month Incomes */}
        <motion.div 
          variants={itemVariants} 
          className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-emerald-400">
                (+) Entradas Totais
              </span>
              <p className="text-[9px] text-zinc-500">Acumulado do período</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-emerald-400 leading-tight">
              {formatBRL(metrics.periodIn)}
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">
              Vendas + Recebimentos recebidos
            </p>
          </div>
        </motion.div>

        {/* Current Month Outcomes */}
        <motion.div 
          variants={itemVariants} 
          className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-red-400">
                (-) Saídas Totais
              </span>
              <p className="text-[9px] text-zinc-500">Acumulado do período</p>
            </div>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-red-400 leading-tight">
              {formatBRL(metrics.periodOut)}
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">
              Custos, Contas e Retiradas pagas
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* 2.5 Liquidity Ratio Bar */}
      <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-zinc-400 block">
            Balanço Mensal Líquido
          </span>
          <p className="text-[11px] text-zinc-550">
            Diferença líquida do período selecionado (Entradas - Saídas).
          </p>
        </div>

        <div className="flex items-center gap-4 flex-1 md:max-w-xl">
          <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800 relative">
            {metrics.periodIn + metrics.periodOut > 0 ? (
              <div 
                className={`h-full transition-all duration-1000 ${
                  metrics.periodNet >= 0 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                    : 'bg-gradient-to-r from-red-500 to-orange-400'
                }`}
                style={{ 
                  width: `${Math.min(100, Math.max(5, Math.round((metrics.periodIn / (metrics.periodIn + metrics.periodOut)) * 100)))}%` 
                }}
              />
            ) : (
              <div className="w-1/2 bg-zinc-800 h-full" />
            )}
          </div>
          
          <div className="text-right shrink-0">
            <span className={`font-mono font-bold text-sm ${metrics.periodNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {metrics.periodNet >= 0 ? '+' : ''}{formatBRL(metrics.periodNet)}
            </span>
            <p className="text-[10px] text-zinc-500">
              Taxa de Lucratividade: {metrics.periodIn > 0 ? Math.round((metrics.periodNet / metrics.periodIn) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* 3. Double-Column Workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        
        {/* LEFT COLUMN: Launch Cash Transaction Form */}
        <div className="glow-zinc-card p-5 rounded-2xl flex flex-col space-y-4 h-fit border border-purple-500/10">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-200 border-b border-zinc-900 pb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-purple-400" /> Registrar Lançamento
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs text-zinc-300">
            
            {/* Segmented control for Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">
                Tipo do Fluxo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeToggle('entrada')}
                  className={`py-2 text-center rounded-lg border font-semibold tracking-wide transition-all ${
                    type === 'entrada'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold shadow-[s_0_10px_rgba(16,185,129,0.05)]'
                      : 'bg-zinc-900 border-zinc-850 text-zinc-450 hover:bg-zinc-850'
                  }`}
                >
                  Entrada (+)
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeToggle('saída')}
                  className={`py-2 text-center rounded-lg border font-semibold tracking-wide transition-all ${
                    type === 'saída'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-extrabold shadow-[s_0_10px_rgba(244,63,94,0.05)]'
                      : 'bg-zinc-900 border-zinc-850 text-zinc-4 block hover:bg-zinc-850'
                  }`}
                >
                  Saída (-)
                </button>
              </div>
            </div>

            {/* Category Selector matched directly to type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">
                Categoria Comercial *
              </label>
              
              <div className="space-y-2">
                {/* Visual grid select list for Category */}
                <div className="grid grid-cols-2 gap-1.5">
                  {(type === 'entrada' ? incomeCategories : expenseCategories).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-1.5 px-2.5 text-left rounded-md border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                        category === cat
                          ? 'bg-purple-900/10 border-purple-500/40 text-purple-400 font-bold'
                          : 'bg-zinc-900 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                      }`}
                    >
                      <span className="shrink-0">{getCategoryBadgeIcon(cat)}</span>
                      <span className="truncate">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description Text */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">
                Motivo / Descrição *
              </label>
              <input
                type="text"
                placeholder={type === 'entrada' ? 'Ex: Recebimento de faturas de clientes' : 'Ex: Compra de embalagens de entrega'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-90 w bg-zinc-950/65 border border-zinc-850 rounded-lg text-zinc-100 placeholder-zinc-500 focus:border-purple-500 outline-none transition-all font-sans"
                required
              />
            </div>

            {/* Amount and Date Fields row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">
                  Valor (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold font-mono text-zinc-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-zinc-950/65 border border-zinc-850 rounded-lg text-zinc-100 placeholder-zinc-650 focus:border-purple-500 outline-none font-mono tracking-tight font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">
                  Data do Lote
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-2.5 py-2 bg-zinc-950/65 border border-zinc-850 rounded-lg text-zinc-200 focus:border-purple-500 outline-none font-mono font-medium text-xs cursor-pointer"
                />
              </div>
            </div>

            {/* Action Submit */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-650 hover:bg-purple-600 text-white font-bold tracking-wider uppercase transition-all shadow-[0_4px_12px_rgba(147,51,234,0.15)] cursor-pointer mt-2"
            >
              Confirmar Registro
            </button>

            {/* Success Notifications */}
            <AnimatePresence>
              {formSuccess && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1 mt-2 text-center justify-center bg-emerald-500/5 py-1 border border-emerald-500/10 rounded-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {formSuccess}
                </motion.p>
              )}
            </AnimatePresence>

          </form>
        </div>

        {/* RIGHT COLUMN: Business Distribution Breakdown & Clarity Metrics */}
        <div className="lg:col-span-2 glow-zinc-card p-5 rounded-2xl flex flex-col space-y-4 border border-purple-500/10">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-200 border-b border-zinc-900 pb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-purple-400" /> Distribuição Financeira por Tipo
            </span>
            <span className="text-[10px] font-mono tracking-wider font-semibold text-purple-400 uppercase">
              {monthFilter === 'todos' ? 'Período Completo' : `Referência: ${monthFilter}`}
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* INCOMES BREAKDOWN */}
            <div className="bg-zinc-950/50 border border-zinc-900/60 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-850/60 pb-1.5">
                <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Receitas
                </span>
                <span className="font-mono text-[11px] font-bold text-zinc-400">
                  Total: {formatBRL(metrics.periodIn)}
                </span>
              </div>

              <div className="space-y-2.5">
                {incomeCategories.map(cat => {
                  const val = metrics.categoryTotals[cat] || 0;
                  const pct = metrics.periodIn > 0 ? Math.round((val / metrics.periodIn) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-300 font-medium">{cat}</span>
                        <span className="text-zinc-400 font-mono font-medium">
                          {formatBRL(val)} <span className="text-[9px] text-zinc-500 ml-0.5">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-400 h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EXPENSES BREAKDOWN */}
            <div className="bg-zinc-950/50 border border-zinc-900/60 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-850/60 pb-1.5">
                <span className="text-[11px] uppercase font-bold text-red-400 tracking-wider flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-400" /> Desembolsos
                </span>
                <span className="font-mono text-[11px] font-bold text-zinc-400">
                  Total: {formatBRL(metrics.periodOut)}
                </span>
              </div>

              <div className="space-y-2.5">
                {expenseCategories.map(cat => {
                  const val = metrics.categoryTotals[cat] || 0;
                  const pct = metrics.periodOut > 0 ? Math.round((val / metrics.periodOut) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-300 font-medium">{cat}</span>
                        <span className="text-zinc-400 font-mono font-medium">
                          {formatBRL(val)} <span className="text-[9px] text-zinc-500 ml-0.5">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-red-400 h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Quick Informational Tip */}
          <div className="bg-purple-950/5 border border-purple-500/10 p-3 rounded-xl flex gap-2 text-[10px] text-zinc-400 leading-relaxed font-sans mt-auto">
            <SparklesIcon className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <strong className="text-purple-300 font-bold block mb-0.5">Dica para Retiradas Pessoais:</strong>
              Mantenha o controle estrito sobre a proporção das <strong>Retiradas Pessoais (Pró-labore/Dividendos)</strong> em relação a seu faturamento total. O excedente deve ser retido para investimentos em mercadorias e provisões tributárias.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete History Log table with Searching & Detail filtering */}
      <div className="glow-zinc-card p-5 rounded-2xl space-y-4 border border-purple-500/10">
        
        {/* Header and Filter triggers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-200 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-purple-400" /> Histórico Completo de Movimentações
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Auditoria granular, fiscalização e extorno de lançamentos comerciais do caixa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search inputs */}
            <div className="relative font-sans">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar descrição ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-zinc-95 w bg-zinc-950 border border-zinc-850 rounded-lg text-[11px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-500 min-w-[200px]"
              />
            </div>

            {/* Quick type filters */}
            <div className="flex bg-zinc-950 border border-zinc-850 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setTypeFilter('todos')}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  typeFilter === 'todos' 
                    ? 'bg-zinc-850 text-white font-bold' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('entrada')}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  typeFilter === 'entrada' 
                    ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/10' 
                    : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                Inflows
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('saída')}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  typeFilter === 'saída' 
                    ? 'bg-rose-500/10 text-rose-400 font-bold border border-rose-500/10' 
                    : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                Outflows
              </button>
            </div>

            {/* Category selection */}
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-850 py-1 px-2.5 rounded-lg text-[10px] font-mono">
              <Filter className="w-3.5 h-3.5 text-zinc-550 mr-1" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-zinc-300 font-sans focus:outline-none cursor-pointer text-[10px]"
              >
                <option value="todos" className="bg-zinc-950 text-white">Categoria: Todas</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-zinc-950 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic transaction list / table view */}
        <div className="overflow-x-auto rounded-xl">
          {filteredEntries.length > 0 ? (
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 font-serif text-[10px] uppercase tracking-wider bg-zinc-950/20">
                  <th className="py-3 px-4 font-bold">Lote</th>
                  <th className="py-3 px-4 font-bold">Data & Registro</th>
                  <th className="py-3 px-4 font-bold">Lançamento / Histórico</th>
                  <th className="py-3 px-4 font-bold">Categoria</th>
                  <th className="py-3 px-4 text-right font-bold pr-6">Valor Monetário</th>
                  <th className="py-3 px-4 text-center font-bold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 font-sans">
                {filteredEntries.map((entry) => {
                  const isIncoming = entry.type === 'entrada';
                  return (
                    <motion.tr 
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-zinc-900/30 transition-all font-sans group"
                    >
                      {/* Token code */}
                      <td className="py-3.5 px-4 font-mono text-[10px] text-zinc-550">
                        {entry.id.slice(0, 8).toUpperCase()}
                      </td>

                      {/* Created date / time */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <CalendarDaysIcon className="w-3.5 h-3.5 text-zinc-650" />
                          <span className="text-zinc-300">{formatShortDate(entry.date)}</span>
                          <span className="text-zinc-550 text-[10px]">às {formatShortTime(entry.date)}</span>
                        </div>
                      </td>

                      {/* Transaction label value */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded-md ${
                            isIncoming ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isIncoming ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <span className="font-bold text-zinc-200 tracking-wide text-xs">
                            {entry.description}
                          </span>
                        </div>
                      </td>

                      {/* Category metadata badge */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase ${getCategoryBadgeClass(entry.category)}`}>
                          {entry.category}
                        </span>
                      </td>

                      {/* Translucid formatted sum values */}
                      <td className="py-3.5 px-4 text-right pr-6 font-mono text-sm">
                        <span className={`font-black tracking-tight ${isIncoming ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isIncoming ? '+' : '-'}&nbsp;{formatBRL(entry.amount)}
                        </span>
                      </td>

                      {/* Delete actions */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Atenção comerciante: Você deseja extornar e excluir permanentemente este lote de caixa (${entry.id.slice(0, 8).toUpperCase()})?\nAção irreversível e auditada.`)) {
                              deleteCashEntry(entry.id);
                            }
                          }}
                          className="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-rose-950/35 hover:border-rose-900 text-zinc-550 hover:text-red-400 rounded-lg transition-all focus:outline-none pointer-events-auto cursor-pointer"
                          title="Extornar Registro de Caixa"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-14 text-center text-zinc-550 border border-dashed border-zinc-900 rounded-xl flex flex-col items-center justify-center gap-2 font-sans">
              <AlertCircle className="w-8 h-8 text-zinc-700 animate-pulse" />
              <p className="font-medium text-xs font-sans">Nenhum lançamento encontrado para os filtros atuais.</p>
              <p className="text-[10px] text-zinc-650 max-w-xs font-sans">Experimente ajustar o termo de busca, trocar a categoria ou visualizar outro mês.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

// Inlined visual SVG icons to respect imports
function TrendUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function CalendarDaysIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
    </svg>
  );
}
