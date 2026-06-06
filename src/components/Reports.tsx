import React, { useState, useMemo } from 'react';
import { useReino } from '../store';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Search, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Info, 
  ShoppingBag,
  Award,
  Users,
  Briefcase,
  AlertTriangle,
  Download,
  Percent,
  Layers,
  CircleDollarSign,
  AlertCircle,
  CalendarRange,
  Zap,
  Tag,
  BarChart4,
  RefreshCw,
  Trophy,
  Activity,
  UserCheck,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Animation variants aligned with the suite
const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
};

const fVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }
};

type ReportType = 
  | 'vendas' 
  | 'estoque' 
  | 'produtos_mais' 
  | 'produtos_menos' 
  | 'lucro_produto' 
  | 'lucro_categoria' 
  | 'lucro_parceiro' 
  | 'fluxo_caixa' 
  | 'despesas';

export function Reports() {
  const { sales, products, partners, expenses, cashEntries } = useReino();

  // Active Report Category view
  const [activeReport, setActiveReport] = useState<ReportType>('vendas');

  // Filter configuration states
  const [timeframe, setTimeframe] = useState<'dia' | 'semana' | 'mês' | 'ano'>('mês');
  
  // Pivot date selections
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedWeekDay, setSelectedWeekDay] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().toISOString().slice(0, 4));

  // Auto calculated Week Range (Sunday to Saturday)
  const weekRange = useMemo(() => {
    try {
      const d = new Date(selectedWeekDay + 'T12:00:00');
      const dayOfWeek = d.getDay(); // 0: Sun, 1: Mon...
      
      const start = new Date(d);
      start.setDate(d.getDate() - dayOfWeek);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      return {
        startStr: start.toISOString().slice(0, 10),
        endStr: end.toISOString().slice(0, 10),
        label: `de ${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
      };
    } catch {
      return { startStr: selectedWeekDay, endStr: selectedWeekDay, label: '' };
    }
  }, [selectedWeekDay]);

  // Combined Date Matcher helper
  const matchDate = (rawDate: string | undefined): boolean => {
    if (!rawDate) return false;
    const normalized = rawDate.slice(0, 10); // YYYY-MM-DD
    
    if (timeframe === 'dia') {
      return normalized === selectedDay;
    }
    
    if (timeframe === 'semana') {
      const itemTime = new Date(normalized + 'T12:00:00').getTime();
      const startTime = new Date(weekRange.startStr + 'T00:00:00').getTime();
      const endTime = new Date(weekRange.endStr + 'T23:59:59').getTime();
      return itemTime >= startTime && itemTime <= endTime;
    }
    
    if (timeframe === 'mês') {
      return normalized.slice(0, 7) === selectedMonth;
    }
    
    if (timeframe === 'ano') {
      return normalized.slice(0, 4) === selectedYear;
    }
    
    return true;
  };

  // Helper formats
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatShortDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  // ----------------------------------------------------
  // FILTERED COLLECTIONS
  // ----------------------------------------------------
  const filteredSales = useMemo(() => {
    return sales.filter(s => matchDate(s.date));
  }, [sales, timeframe, selectedDay, weekRange, selectedMonth, selectedYear]);

  const filteredCashEntries = useMemo(() => {
    return cashEntries.filter(c => matchDate(c.date));
  }, [cashEntries, timeframe, selectedDay, weekRange, selectedMonth, selectedYear]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => matchDate(e.dueDate || e.date));
  }, [expenses, timeframe, selectedDay, weekRange, selectedMonth, selectedYear]);

  // ----------------------------------------------------
  // METRICS & REPORT DATA CALCULATORS
  // ----------------------------------------------------

  // 1. Sales metrics
  const salesMetrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const totalProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
    const count = filteredSales.length;
    const avgTicket = count > 0 ? totalRevenue / count : 0;
    
    // Group by payment method
    const paymentMethods: Record<string, number> = {
      'Dinheiro': 0,
      'Pix': 0,
      'Cartão de Crédito': 0,
      'Cartão de Débito': 0
    };
    
    filteredSales.forEach(s => {
      const pm = s.paymentMethod || 'Outros';
      if (paymentMethods[pm] !== undefined) {
        paymentMethods[pm] += s.total;
      } else {
        paymentMethods[pm] = (paymentMethods[pm] || 0) + s.total;
      }
    });

    return {
      totalRevenue,
      totalProfit,
      count,
      avgTicket,
      paymentMethods
    };
  }, [filteredSales]);

  // 2. Stock metrics (Catalog wide - but we display total valuations)
  const stockMetrics = useMemo(() => {
    const totalCount = products.length;
    const totalUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    const costValuation = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.costPrice || 0)), 0);
    const saleValuation = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.salePrice || 0)), 0);
    const potentialProfit = saleValuation - costValuation;
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

    // Category distribution of stock
    const categoryStock: Record<string, { qty: number; value: number }> = {};
    products.forEach(p => {
      const cat = p.category || 'Geral';
      if (!categoryStock[cat]) {
        categoryStock[cat] = { qty: 0, value: 0 };
      }
      categoryStock[cat].qty += p.stock || 0;
      categoryStock[cat].value += (p.stock || 0) * p.salePrice;
    });

    return {
      totalCount,
      totalUnits,
      costValuation,
      saleValuation,
      potentialProfit,
      lowStockCount,
      categoryStock
    };
  }, [products]);

  // 3 & 4. Best Selling / Least Selling Product rankings
  const rankingMetrics = useMemo(() => {
    // Tally all items sold
    const soldTally: Record<string, { id: string; name: string; qty: number; revenue: number; cost: number; profit: number; category: string }> = {};
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!soldTally[item.productId]) {
          // Find actual category from products if available
          const prodObj = products.find(p => p.id === item.productId);
          soldTally[item.productId] = {
            id: item.productId,
            name: item.name,
            qty: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            category: prodObj?.category || 'Geral'
          };
        }
        
        const info = soldTally[item.productId];
        info.qty += item.quantity;
        info.revenue += item.quantity * item.salePrice;
        info.cost += item.quantity * item.costPrice;
        info.profit += (item.quantity * item.salePrice) - (item.quantity * item.costPrice);
      });
    });

    // Best Sellers: Sorted descending by quantity sold
    const itemsList = Object.values(soldTally);
    const bestSellers = [...itemsList].sort((a, b) => b.qty - a.qty);

    // Least Sellers: Show products in catalog with low or 0 units sold
    // Incorporate all products that haven't been sold at all
    const allProductsSellers = products.map(prod => {
      const soldItem = soldTally[prod.id] || {
        id: prod.id,
        name: prod.name,
        qty: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        category: prod.category || 'Geral'
      };
      return soldItem;
    });

    const leastSellers = [...allProductsSellers].sort((a,b) => a.qty - b.qty);

    return {
      bestSellers,
      leastSellers,
      soldTallyList: itemsList
    };
  }, [filteredSales, products]);

  // 5. Profit per product
  const profitPerProductList = useMemo(() => {
    const soldList = rankingMetrics.soldTallyList;
    return soldList.map(item => {
      const marginPercent = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
      return {
        ...item,
        marginPercent
      };
    }).sort((a,b) => b.profit - a.profit);
  }, [rankingMetrics]);

  // 6. Profit per category
  const profitPerCategoryData = useMemo(() => {
    const categoryTotals: Record<string, { category: string; revenue: number; cost: number; profit: number }> = {};
    
    // Group sold items
    rankingMetrics.soldTallyList.forEach(item => {
      const cat = item.category || 'Geral';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { category: cat, revenue: 0, cost: 0, profit: 0 };
      }
      categoryTotals[cat].revenue += item.revenue;
      categoryTotals[cat].cost += item.cost;
      categoryTotals[cat].profit += item.profit;
    });

    return Object.values(categoryTotals).map(item => {
      const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
      return {
        ...item,
        margin
      };
    }).sort((a,b) => b.profit - a.profit);
  }, [rankingMetrics]);

  // 7. Profit per partner
  const profitPerPartnerData = useMemo(() => {
    const partnerData: Record<string, { partnerId: string; name: string; salesCount: number; totalRevenue: number; totalCOGS: number; grossProfit: number; commission: number; netStoreProfit: number }> = {};

    // Base initialize all partners
    partners.forEach(p => {
      partnerData[p.id] = {
        partnerId: p.id,
        name: p.name,
        salesCount: 0,
        totalRevenue: 0,
        totalCOGS: 0,
        grossProfit: 0,
        commission: 0,
        netStoreProfit: 0
      };
    });

    // Accrue sales matching dates
    filteredSales.forEach(sale => {
      const pId = sale.partnerId;
      if (!pId) return; // Ignore seller-less sales
      
      if (!partnerData[pId]) {
        const matchingPart = partners.find(p => p.id === pId);
        partnerData[pId] = {
          partnerId: pId,
          name: matchingPart?.name || 'Parceiro Desconhecido',
          salesCount: 0,
          totalRevenue: 0,
          totalCOGS: 0,
          grossProfit: 0,
          commission: 0,
          netStoreProfit: 0
        };
      }

      const pInfo = partnerData[pId];
      pInfo.salesCount += 1;
      pInfo.totalRevenue += sale.total;
      
      // Calculate COGS of items in this sale
      const saleCOGS = sale.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
      pInfo.totalCOGS += saleCOGS;
      
      // Gross Profit on items sold
      const saleGross = sale.total - saleCOGS;
      pInfo.grossProfit += saleGross;
      
      // Commisions accrued
      const commAmount = sale.commissionAmount || 0;
      pInfo.commission += commAmount;
      
      // Store Net is (Gross Sale Profit - Paid Commission)
      pInfo.netStoreProfit += (saleGross - commAmount);
    });

    return Object.values(partnerData).sort((a,b) => b.netStoreProfit - a.netStoreProfit);
  }, [filteredSales, partners]);

  // 8. Cash Flow Detailed report
  const cashFlowMetrics = useMemo(() => {
    const infs = filteredCashEntries.filter(c => c.type === 'entrada');
    const outfs = filteredCashEntries.filter(c => c.type === 'saída');
    
    const inflowTotal = infs.reduce((acc, c) => acc + c.amount, 0);
    const outflowTotal = outfs.reduce((acc, c) => acc + c.amount, 0);
    const netChange = inflowTotal - outflowTotal;

    // Subtotals per category
    const categorySums: Record<string, number> = {};
    filteredCashEntries.forEach(c => {
      categorySums[c.category] = (categorySums[c.category] || 0) + c.amount;
    });

    return {
      inflowTotal,
      outflowTotal,
      netChange,
      categorySums,
      entryCount: filteredCashEntries.length
    };
  }, [filteredCashEntries]);

  // 9. Expenses Detailed Report
  const expensesMetrics = useMemo(() => {
    const paidExpensesVal = filteredExpenses.filter(e => e.status === 'Pago').reduce((sum, e) => sum + e.amount, 0);
    const pendingExpensesVal = filteredExpenses.filter(e => e.status === 'Pendente').reduce((sum, e) => sum + e.amount, 0);
    const totalExpensesVal = paidExpensesVal + pendingExpensesVal;

    // Group expenses by category
    const expenseCatSums: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'Geral/Operacional';
      expenseCatSums[cat] = (expenseCatSums[cat] || 0) + e.amount;
    });

    return {
      paidExpensesVal,
      pendingExpensesVal,
      totalExpensesVal,
      expenseCatSums,
      count: filteredExpenses.length
    };
  }, [filteredExpenses]);

  // General CSV Export handler (simulation of export)
  const handleExport = () => {
    alert(`Relatório Exportado com Sucesso!\nFormato: Planilha XLS/CSV\nTipo: ${activeReport.toUpperCase()}\nPeríodo: ${timeframe.toUpperCase()} (${
      timeframe === 'dia' ? selectedDay : 
      timeframe === 'semana' ? weekRange.label : 
      timeframe === 'mês' ? selectedMonth : selectedYear
    })`);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] uppercase font-mono tracking-wider font-bold rounded-md inline-block mb-1.5">
            Módulo Consolidado Premium
          </span>
          <h2 className="text-lg font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <BarChart4 className="w-5 h-5 text-purple-400" /> Relatórios do Reino
          </h2>
          <p className="text-[11px] text-zinc-400">
            Inteligência mercantil e fiduciária para expandir as margens, fluxo de caixa e rotatividade estoque.
          </p>
        </div>

        {/* Quick export button */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-purple-900/40 border border-zinc-800 text-zinc-300 hover:text-purple-300 text-xs font-semibold cursor-pointer transition-all self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar Planilha
        </button>
      </div>

      {/* 2. TIMEFRAME FILTERS - Premium Selectors for: Dia, Semana, Mês, Ano */}
      <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-2xl space-y-4">
        
        {/* Step A: Choose granular Scale */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900/60 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-zinc-200 font-bold">Escala Temporal do Relatório:</span>
          </div>

          <div className="flex bg-zinc-900 border border-zinc-850 p-1 rounded-xl">
            {(['dia', 'semana', 'mês', 'ano'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all tracking-wider ${
                  timeframe === tf
                    ? 'bg-purple-650 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Step B: Detail dynamic inputs linked to tf selection */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-xs font-sans">
          
          <CalendarRange className="w-4 h-4 text-zinc-500 shrink-0 hidden sm:block" />

          {/* DIA SELECTOR */}
          {timeframe === 'dia' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <span className="text-zinc-400 font-semibold shrink-0">Selecione o Dia:</span>
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-3 py-2 bg-zinc-90 w-full sm:w-auto bg-zinc-950/65 border border-purple-500/20 rounded-xl text-zinc-200 focus:border-purple-500 outline-none font-mono font-bold"
              />
              <span className="text-[10px] text-zinc-550 italic sm:ml-2">Mostrando resultados específicos de: {formatShortDate(selectedDay)}</span>
            </div>
          )}

          {/* SEMANA SELECTOR */}
          {timeframe === 'semana' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <span className="text-zinc-400 font-semibold shrink-0">Escolha uma data base:</span>
              <input
                type="date"
                value={selectedWeekDay}
                onChange={(e) => setSelectedWeekDay(e.target.value)}
                className="px-3 py-2 bg-zinc-90 w-full sm:w-auto bg-zinc-950/65 border border-purple-500/20 rounded-xl text-zinc-200 focus:border-purple-500 outline-none font-mono font-bold"
              />
              <div className="p-2 px-3 bg-purple-500/5 border border-purple-500/10 rounded-xl text-[11px] text-purple-400 font-medium">
                Semana correspondente: <strong className="font-mono">{weekRange.label}</strong>
              </div>
            </div>
          )}

          {/* MÊS SELECTOR */}
          {timeframe === 'mês' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <span className="text-zinc-400 font-semibold shrink-0">Selecione o Mês:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-zinc-90 w-full sm:w-auto bg-zinc-950/65 border border-purple-500/20 rounded-xl text-zinc-200 focus:border-purple-500 outline-none font-mono font-bold"
              />
              <span className="text-[10px] text-zinc-550 italic sm:ml-2">Visualizando histórico mensal do comércio</span>
            </div>
          )}

          {/* ANO SELECTOR */}
          {timeframe === 'ano' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <span className="text-zinc-400 font-semibold shrink-0">Ano de Exercício:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 bg-zinc-90 w-full sm:w-auto bg-zinc-950/65 border border-purple-500/20 rounded-xl text-zinc-200 focus:border-purple-500 outline-none font-mono font-bold"
              >
                <option value="2024" className="bg-zinc-950">2024</option>
                <option value="2025" className="bg-zinc-950">2025</option>
                <option value="2026" className="bg-zinc-950">2026</option>
                <option value="2027" className="bg-zinc-950">2027</option>
              </select>
              <span className="text-[10px] text-zinc-550 italic sm:ml-2">Análise macro anual consolidadora</span>
            </div>
          )}

        </div>
      </div>

      {/* 3. REPORT VIEWS GRID - Left selector sidebar, Right dynamic data content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Selector buttons list (The 9 Report items) */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-400 px-2 mb-2 block">
            Relatórios Disponíveis ({9})
          </div>

          {[
            { id: 'vendas', label: 'Vendas & Giro', icon: <ShoppingBag className="w-4 h-4 text-purple-400" />, desc: 'Faturamento, tíquete médio e meios de pagamento.' },
            { id: 'estoque', label: 'Estoque & Valores', icon: <Package className="w-4 h-4 text-teal-400" />, desc: 'Valoração de CMV, potencial de lucro e quantidade.' },
            { id: 'produtos_mais', label: 'Produtos Mais Vendidos', icon: <Trophy className="w-4 h-4 text-yellow-500" />, desc: 'Ranking de itens de alta saída e giro de loja.' },
            { id: 'produtos_menos', label: 'Produtos Menos Vendidos', icon: <TrendingDown className="w-4 h-4 text-red-400" />, desc: 'Produtos estagnados sem vazão mercantil.' },
            { id: 'lucro_produto', label: 'Lucro por Produto', icon: <DollarSign className="w-4 h-4 text-emerald-400" />, desc: 'Margem unitária granular de cada item vendido.' },
            { id: 'lucro_categoria', label: 'Lucro por Categoria', icon: <Layers className="w-4 h-4 text-amber-500" />, desc: 'Dedução de lucratividade por setor comercial.' },
            { id: 'lucro_parceiro', label: 'Lucro por Parceiro', icon: <Users className="w-4 h-4 text-cyan-400" />, desc: 'Ranking de faturamento e custos de parceiros.' },
            { id: 'fluxo_caixa', label: 'Fluxo de Caixa', icon: <Activity className="w-4 h-4 text-pink-400" />, desc: 'Saldo acumulado e divisão de fluxos.' },
            { id: 'despesas', label: 'Contas & Despesas', icon: <Briefcase className="w-4 h-4 text-rose-500" />, desc: 'Controle contábil de obrigações físicas e passivos.' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id as any)}
              className={`w-full text-left p-3.5 rounded-xl border font-sans select-none cursor-pointer transition-all flex items-start gap-3 group relative ${
                activeReport === r.id
                  ? 'bg-purple-650/15 border-purple-500/35 text-white'
                  : 'bg-zinc-950/45 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-850'
              }`}
            >
              <span className="shrink-0 pt-0.5">{r.icon}</span>
              <div className="space-y-0.5">
                <span className={`text-xs font-bold block ${activeReport === r.id ? 'text-purple-300' : ''}`}>
                  {r.label}
                </span>
                <span className="text-[10px] text-zinc-550 leading-normal block font-sans">
                  {r.desc}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* RIGHT COLUMN: Dynamic Visual reports panel display */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReport + timeframe}
              initial="hidden"
              animate="visible"
              variants={fVariants}
              className="space-y-6"
            >
              
              {/* VENDAS (SALES REPORT) */}
              {activeReport === 'vendas' && (
                <div className="space-y-6">
                  
                  {/* Cards of statistics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Receita Comercial Registrada</span>
                      <h3 className="text-xl font-bold font-mono text-white leading-none">
                        {formatBRL(salesMetrics.totalRevenue)}
                      </h3>
                      <p className="text-[10px] text-zinc-550 font-sans mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Faturamento consolidado no período
                      </p>
                    </div>

                    <div className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Quantidade de Transações</span>
                      <h3 className="text-xl font-bold font-mono text-purple-400 leading-none">
                        {salesMetrics.count} vendas
                      </h3>
                      <p className="text-[10px] text-zinc-550 mt-2 flex items-center gap-1 font-sans">
                        <Package className="w-3.5 h-3.5 text-purple-400" /> Registro em POS físico
                      </p>
                    </div>

                    <div className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Tíquete Médio de Compra</span>
                      <h3 className="text-xl font-bold font-mono text-emerald-400 leading-none">
                        {formatBRL(salesMetrics.avgTicket)}
                      </h3>
                      <p className="text-[10px] text-zinc-550 mt-2 flex items-center gap-1 font-sans">
                        <Info className="w-3.5 h-3.5 text-emerald-400" /> Compras por cliente no período
                      </p>
                    </div>
                  </div>

                  {/* Payment methods list and custom visual chart */}
                  <div className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Distribuição de Vendas por Método de Pagamento
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      
                      {/* SVG Bar Visual */}
                      <div className="flex flex-col justify-center items-center h-[170px] bg-zinc-950/40 rounded-xl p-4 border border-zinc-900 relative">
                        {salesMetrics.totalRevenue > 0 ? (
                          <div className="flex items-end justify-around gap-4 w-full h-[110px] pb-1 border-b border-zinc-900">
                            {(Object.entries(salesMetrics.paymentMethods) as [string, number][]).map(([method, val]) => {
                              const percentage = salesMetrics.totalRevenue > 0 ? (val / salesMetrics.totalRevenue) * 100 : 0;
                              return (
                                <div key={method} className="flex flex-col items-center flex-1 max-w-[50px] space-y-1 group">
                                  <span className="text-[9px] font-mono font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-all">
                                    {Math.round(percentage)}%
                                  </span>
                                  {/* Column container */}
                                  <div className="w-full bg-zinc-900 rounded-t h-[70px] relative overflow-hidden flex items-end">
                                    <div 
                                      className="bg-purple-650 w-full rounded-t transition-all duration-700 hover:bg-purple-500"
                                      style={{ height: `${Math.max(5, percentage)}%` }}
                                    />
                                  </div>
                                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 text-center truncate w-full" title={method}>
                                    {method.split(' ')[0]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-zinc-650 text-[11px] italic">Sem transações de vendas no período para gráfico.</div>
                        )}
                        <span className="text-[9px] text-zinc-550 uppercase font-mono tracking-widest block pt-2 mt-1">
                          Consolidação por canais fiduciários
                        </span>
                      </div>

                      {/* Detail text table list */}
                      <div className="space-y-3">
                        {(Object.entries(salesMetrics.paymentMethods) as [string, number][]).map(([method, val]) => {
                          const percentage = salesMetrics.totalRevenue > 0 ? (val / salesMetrics.totalRevenue) * 100 : 0;
                          return (
                            <div key={method} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-350 font-bold font-sans flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                                  {method}
                                </span>
                                <span className="text-zinc-450 font-mono">
                                  <strong className="text-zinc-300">{formatBRL(val)}</strong> ({Math.round(percentage)}%)
                                </span>
                              </div>
                              <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                                <div 
                                  className="bg-purple-600 h-full rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* ESTOQUE (STOCK REPORT) */}
              {activeReport === 'estoque' && (
                <div className="space-y-6">
                  
                  {/* Stats columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="glow-zinc-card p-5 rounded-2xl border border-teal-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Itens Cadastrados</span>
                      <h3 className="text-xl font-bold font-mono text-white leading-none">
                        {stockMetrics.totalCount} SKU
                      </h3>
                      <p className="text-[10px] text-teal-400 mt-2">Diferentes referências</p>
                    </div>

                    <div className="glow-zinc-card p-5 rounded-2xl border border-teal-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Unidades em Estoque</span>
                      <h3 className="text-xl font-bold font-mono text-white leading-none">
                        {stockMetrics.totalUnits} un
                      </h3>
                      <p className="text-[10px] text-zinc-550 mt-2">Unidades físicas totais</p>
                    </div>

                    <div className="glow-zinc-card p-5 rounded-2xl border border-teal-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Valoração a Preço de Venda</span>
                      <h3 className="text-xl font-bold font-mono text-teal-400 leading-none">
                        {formatBRL(stockMetrics.saleValuation)}
                      </h3>
                      <p className="text-[10px] text-zinc-[450] mt-2">Capital realizável da loja</p>
                    </div>

                    <div className="glow-zinc-card p-5 rounded-2xl border border-teal-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Custo de Substituição (CMV)</span>
                      <h3 className="text-xl font-bold font-mono text-zinc-300 leading-none">
                        {formatBRL(stockMetrics.costValuation)}
                      </h3>
                      <p className="text-[10px] text-zinc-550 mt-2">Ativo investido em estoque</p>
                    </div>
                  </div>

                  {/* Stock health status bar */}
                  <div className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Alerta de Estoque Crítico
                      </span>
                      <p className="text-[11px] text-zinc-450">
                        O estoque mínimo garante que sua operação nunca perca faturamento por quebras na prateleira.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl font-bold text-center sm:text-left">
                      <span className="text-xs block text-zinc-400">Ativos com Estoque Baixo</span>
                      <span className={`text-lg font-mono font-black ${stockMetrics.lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {stockMetrics.lowStockCount} produtos precisando reposição
                      </span>
                    </div>
                  </div>

                  {/* Breakdown details per Category list and SVG graphical layout */}
                  <div className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Tabela Operacional de Estoque por Categoria
                    </h4>

                    {Object.keys(stockMetrics.categoryStock).length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] uppercase font-mono">
                              <th className="py-2.5 px-3">Setor / Categoria</th>
                              <th className="py-2.5 px-3 text-right">Items</th>
                              <th className="py-2.5 px-3 text-right">Valor em Prateleira (Venda)</th>
                              <th className="py-2.5 px-3 text-right">Proporção no Ativo %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900 font-sans">
                            {(Object.entries(stockMetrics.categoryStock) as [string, { qty: number; value: number }][]).map(([cat, val]) => {
                              const pct = stockMetrics.saleValuation > 0 ? Math.round((val.value / stockMetrics.saleValuation) * 100) : 0;
                              return (
                                <tr key={cat} className="hover:bg-zinc-90 w/20 text-zinc-300">
                                  <td className="py-3 px-3 font-semibold">{cat}</td>
                                  <td className="py-3 px-3 text-right font-mono">{val.qty} un</td>
                                  <td className="py-3 px-3 text-right font-mono text-purple-400 font-bold">{formatBRL(val.value)}</td>
                                  <td className="py-3 px-3 text-right">
                                    <div className="flex items-center justify-end gap-2 font-mono">
                                      <div className="w-16 bg-zinc-950 h-1.5 rounded-full overflow-hidden block">
                                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                      </div>
                                      <span>{pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-zinc-600 text-center py-6 text-xs italic">Sem produtos cadastrados em estoque.</p>
                    )}
                  </div>

                </div>
              )}

              {/* PRODUTOS MAIS VENDIDOS (BEST SELLING PRODUCTS) */}
              {activeReport === 'produtos_mais' && (
                <div className="space-y-6">
                  
                  <div className="glow-zinc-card p-5 rounded-2xl border border-yellow-500/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-yellow-500" /> Líderes de Saída (Best Sellers)
                        </h4>
                        <p className="text-[10px] text-zinc-550">Produtos com maior faturamento e vazão física no período selecionado</p>
                      </div>
                    </div>

                    {rankingMetrics.bestSellers.length > 0 ? (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-900 text-zinc-500 text-[9px] uppercase font-mono tracking-wider">
                              <th className="py-2.5 px-3">Colocação</th>
                              <th className="py-2.5 px-3">Nome do Produto</th>
                              <th className="py-2.5 px-3 text-center">Unidades Vendidas</th>
                              <th className="py-2.5 px-3 text-right">Receita Bruta Gerada</th>
                              <th className="py-2.5 px-3 text-right">Setor / Categoria</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900 font-sans">
                            {rankingMetrics.bestSellers.map((prod, index) => (
                              <tr key={prod.id} className="hover:bg-zinc-900/10 transition-all">
                                <td className="py-3.5 px-3 font-mono font-bold">
                                  {index === 0 && <span className="text-yellow-500 font-extrabold text-[13px]">🥇 1º</span>}
                                  {index === 1 && <span className="text-zinc-300 font-extrabold text-[13px]">🥈 2º</span>}
                                  {index === 2 && <span className="text-amber-600 font-extrabold text-[13px]">🥉 3º</span>}
                                  {index > 2 && `${index + 1}º`}
                                </td>
                                <td className="py-3.5 px-3 font-bold text-white tracking-wide">{prod.name}</td>
                                <td className="py-3.5 px-3 text-center font-mono font-extrabold text-purple-400 bg-purple-500/5">{prod.qty} un</td>
                                <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400">{formatBRL(prod.revenue)}</td>
                                <td className="py-3.5 px-3 text-right">
                                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] rounded font-medium">
                                    {prod.category}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-zinc-550 border border-dashed border-zinc-900 rounded-xl flex flex-col items-center justify-center gap-1">
                        <AlertIcon className="w-7 h-7 text-zinc-700 animate-pulse" />
                        <p className="text-xs font-semibold">Sem registros de vendas no período selecionado.</p>
                        <p className="text-[10px] text-zinc-650">Troque o filtro temporal no topo da tela para computar o ranking.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* PRODUTOS MENOS VENDIDOS (LEAST SELLING PRODUCTS) */}
              {activeReport === 'produtos_menos' && (
                <div className="space-y-6">
                  
                  <div className="glow-zinc-card p-5 rounded-2xl border border-red-500/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4 text-red-400" /> Produtos Menos Vendidos (Estagnados)
                        </h4>
                        <p className="text-[10px] text-zinc-550">Produtos estagnados em estoque. Baixo giro ou inércia comercial.</p>
                      </div>
                    </div>

                    {rankingMetrics.leastSellers.length > 0 ? (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-900 text-zinc-500 text-[9px] uppercase font-mono tracking-wider">
                              <th className="py-2.5 px-3">Giro</th>
                              <th className="py-2.5 px-3">Nome do Produto</th>
                              <th className="py-2.5 px-3 text-center">Unidades Saídas</th>
                              <th className="py-2.5 px-3 text-right">Estoque Físico Atual</th>
                              <th className="py-2.5 px-3 text-right">Valoração Presa (Venda)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900 font-sans">
                            {rankingMetrics.leastSellers.slice(0, 15).map((prod, index) => {
                              // Find matching product stock
                              const realProd = products.find(p => p.id === prod.id);
                              const currentStock = realProd ? realProd.stock : 0;
                              const potentialVal = realProd ? (realProd.salePrice * currentStock) : 0;
                              return (
                                <tr key={prod.id} className="hover:bg-zinc-900/10 transition-all">
                                  <td className="py-3.5 px-3 font-mono font-bold text-red-400">
                                    {prod.qty === 0 ? '❌ Zero Saídas' : '⚠ Baixo Giro'}
                                  </td>
                                  <td className="py-3.5 px-3 font-semibold text-zinc-300">{prod.name}</td>
                                  <td className="py-3.5 px-3 text-center font-mono font-bold text-zinc-400 bg-zinc-950/50">{prod.qty} un</td>
                                  <td className={`py-3.5 px-3 text-right font-mono font-bold ${currentStock <= 0 ? 'text-red-500' : 'text-zinc-350'}`}>{currentStock} un</td>
                                  <td className="py-3.5 px-3 text-right font-mono font-semibold text-purple-400">{formatBRL(potentialVal)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-zinc-650 text-center py-8">Nenhum produto cadastrado no sistema para auditoria.</p>
                    )}
                  </div>

                </div>
              )}

              {/* LUCRO POR PRODUTO (PROFIT PER PRODUCT) */}
              {activeReport === 'lucro_produto' && (
                <div className="space-y-6">
                  
                  <div className="glow-zinc-card p-5 rounded-2xl border border-emerald-500/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-450 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-400" /> Lucro Granular por Produto Realizado
                        </h4>
                        <p className="text-[10px] text-zinc-550">Retorno líquido de caixa direto e margens percentuais deduzidas de impostos e taxas</p>
                      </div>
                    </div>

                    {profitPerProductList.length > 0 ? (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-900 text-zinc-500 text-[9px] uppercase font-mono tracking-wider">
                              <th className="py-2.5 px-3">Produto</th>
                              <th className="py-2.5 px-3 text-right">Receita Total</th>
                              <th className="py-2.5 px-3 text-right">CMV Total</th>
                              <th className="py-2.5 px-3 text-right">Lucro Líquido Realizado</th>
                              <th className="py-2.5 px-3 text-right">Margem de Lucro %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900 font-sans">
                            {profitPerProductList.map(item => (
                              <tr key={item.id} className="hover:bg-zinc-900/10 transition-all text-zinc-300">
                                <td className="py-3.5 px-3 font-semibold text-white">{item.name}</td>
                                <td className="py-3.5 px-3 text-right font-mono text-zinc-350">{formatBRL(item.revenue)}</td>
                                <td className="py-3.5 px-3 text-right font-mono text-red-405">-{formatBRL(item.cost)}</td>
                                <td className="py-3.5 px-3 text-right font-mono font-extrabold text-emerald-400">+{formatBRL(item.profit)}</td>
                                <td className="py-3.5 px-3 text-right">
                                  <span className={`px-2 py-0.5 rounded font-mono font-black text-[10px] ${
                                    item.marginPercent >= 45 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                    item.marginPercent >= 25 ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10' :
                                    'bg-amber-500/10 text-amber-500'
                                  }`}>
                                    {Math.round(item.marginPercent)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-zinc-600">Nenhum faturamento registrado no período para expor Lucro por Produto.</div>
                    )}
                  </div>

                </div>
              )}

              {/* LUCRO POR CATEGORIA (PROFIT PER CATEGORY) */}
              {activeReport === 'lucro_categoria' && (
                <div className="space-y-6">
                  
                  <div className="glow-zinc-card p-5 rounded-2xl border border-amber-500/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-amber-500" /> Rentabilidade Setorial por Categoria
                        </h4>
                        <p className="text-[10px] text-zinc-550">Visão departamental de faturamentos e margens para calibragem mercantil</p>
                      </div>
                    </div>

                    {profitPerCategoryData.length > 0 ? (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-900 text-zinc-500 text-[9px] uppercase font-mono tracking-wider">
                              <th className="py-2.5 px-3 border-r border-zinc-900/50">Departamento / Categoria</th>
                              <th className="py-2.5 px-3 text-right">Receita Bruta</th>
                              <th className="py-2.5 px-3 text-right">CMV Total</th>
                              <th className="py-2.5 px-3 text-right">Lucro Realizado</th>
                              <th className="py-2.5 px-3 text-right">Margem Líquida %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900 font-sans">
                            {profitPerCategoryData.map(item => (
                              <tr key={item.category} className="hover:bg-zinc-900/10 transition-all text-zinc-300">
                                <td className="py-3.5 px-3 font-extrabold text-white border-r border-zinc-900/50">{item.category}</td>
                                <td className="py-3.5 px-3 text-right font-mono text-zinc-350">{formatBRL(item.revenue)}</td>
                                <td className="py-3.5 px-3 text-right font-mono text-red-405">-{formatBRL(item.cost)}</td>
                                <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-400">+{formatBRL(item.profit)}</td>
                                <td className="py-3.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-16 bg-zinc-950 h-1.5 rounded-full overflow-hidden block">
                                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${item.margin}%` }} />
                                    </div>
                                    <span className="font-mono font-bold text-emerald-400">{Math.round(item.margin)}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-zinc-600 text-center py-10 text-xs italic">Sem faturamento setorial no período.</p>
                    )}
                  </div>

                </div>
              )}

              {/* LUCRO POR PARCEIRO (PROFIT PER PARTNER) */}
              {activeReport === 'lucro_parceiro' && (
                <div className="space-y-6">
                  
                  <div className="glow-zinc-card p-5 rounded-2xl border border-cyan-500/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-cyan-400" /> Líderes de Comissão & Margem de Parceiro
                        </h4>
                        <p className="text-[10px] text-zinc-550">Leaderboard de faturamento alavancado por corretores parceiros e custos de repasse</p>
                      </div>
                    </div>

                    {profitPerPartnerData.length > 0 ? (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-900 text-zinc-500 text-[9px] uppercase font-mono tracking-wider">
                              <th className="py-2.5 px-3">Parceiro / Força de Vendas</th>
                              <th className="py-2.5 px-3 text-center">Frequência</th>
                              <th className="py-2.5 px-3 text-right font-medium">Faturamento Bruto</th>
                              <th className="py-2.5 px-3 text-right">Comissões Devidas</th>
                              <th className="py-2.5 px-3 text-right">Lucro Retido em Loja</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900 font-sans">
                            {profitPerPartnerData.map((part) => (
                              <tr key={part.partnerId} className="hover:bg-zinc-900/10 transition-all text-zinc-350">
                                <td className="py-3.5 px-3 font-bold text-white flex items-center gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  {part.name}
                                </td>
                                <td className="py-3.5 px-3 text-center font-mono">{part.salesCount} vendas</td>
                                <td className="py-3.5 px-3 text-right font-mono">{formatBRL(part.totalRevenue)}</td>
                                <td className="py-3.5 px-3 text-right font-mono text-amber-500">-{formatBRL(part.commission)}</td>
                                <td className="py-3.5 px-3 text-right font-mono font-extrabold text-emerald-400">+{formatBRL(part.netStoreProfit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-zinc-[550] text-center py-10 italic">Nenhum parceiro de vendas cadastrado ou performando ativamente no período.</p>
                    )}
                  </div>

                </div>
              )}

              {/* FLUXO DE CAIXA (CASH FLOW REPORT) */}
              {activeReport === 'fluxo_caixa' && (
                <div className="space-y-6">
                  
                  {/* Summary row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glow-zinc-card p-5 rounded-2xl border border-emerald-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Entradas (Inflows)</span>
                      <h3 className="text-xl font-bold font-mono text-emerald-400">
                        +{formatBRL(cashFlowMetrics.inflowTotal)}
                      </h3>
                      <p className="text-[9px] text-zinc-500 mt-1">Aportes e vendas no caixa</p>
                    </div>

                    <div className="glow-zinc-card p-5 rounded-2xl border border-red-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Saídas (Outflows)</span>
                      <h3 className="text-xl font-bold font-mono text-red-400">
                        -{formatBRL(cashFlowMetrics.outflowTotal)}
                      </h3>
                      <p className="text-[9px] text-zinc-500 mt-1">Custos, despesas e retiradas</p>
                    </div>

                    <div className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Variação Real do Caixa</span>
                      <h3 className={`text-xl font-bold font-mono ${cashFlowMetrics.netChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {cashFlowMetrics.netChange >= 0 ? '+' : ''}{formatBRL(cashFlowMetrics.netChange)}
                      </h3>
                      <p className="text-[9px] text-zinc-500 mt-1">Suficiência de liquidez operacional</p>
                    </div>
                  </div>

                  {/* Cash Flow item lists with categories counts */}
                  <div className="glow-zinc-card p-5 rounded-2xl border border-purple-500/10 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Lançamentos Realizados por Categoria de Caixa
                    </h4>

                    {cashFlowMetrics.entryCount > 0 ? (
                      <div className="space-y-3 font-sans">
                        {(Object.entries(cashFlowMetrics.categorySums) as [string, number][]).map(([cat, totalSum]) => {
                          const isEntrance = ['Vendas', 'Recebimentos'].includes(cat);
                          return (
                            <div key={cat} className="flex justify-between items-center p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl">
                              <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isEntrance ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                {cat}
                              </span>
                              <span className={`font-mono font-bold ${isEntrance ? 'text-emerald-450' : 'text-red-405'}`}>
                                {isEntrance ? '+' : '-'}&nbsp;{formatBRL(totalSum)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-zinc-[550] text-center italic py-8 text-xs">Sem movimentos ad-hoc gravados no livro-caixa no período filatrado.</p>
                    )}
                  </div>

                </div>
              )}

              {/* CONTAS & DESPESAS (EXPENSES) */}
              {activeReport === 'despesas' && (
                <div className="space-y-6">
                  
                  {/* Expense status cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glow-zinc-card p-5 rounded-2xl border border-rose-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Despesas Pagas</span>
                      <h3 className="text-xl font-bold font-mono text-zinc-300">
                        {formatBRL(expensesMetrics.paidExpensesVal)}
                      </h3>
                      <p className="text-[9px] text-zinc-[450] mt-1">Obrigações liquidadas do comércio</p>
                    </div>

                    <div className="glow-zinc-card p-5 rounded-2xl border border-rose-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Boletos Pendentes / Em Aberto</span>
                      <h3 className="text-xl font-bold font-mono text-amber-500">
                        {formatBRL(expensesMetrics.pendingExpensesVal)}
                      </h3>
                      <p className="text-[9px] text-zinc-500 mt-1">Passivos agendados de vencimento</p>
                    </div>

                    <div className="glow-zinc-card p-5 rounded-2xl border border-rose-500/10">
                      <span className="text-zinc-[450] text-[9px] uppercase font-mono tracking-widest block mb-1">Passivo Consolidado Total</span>
                      <h3 className="text-xl font-bold font-mono text-red-400">
                        {formatBRL(expensesMetrics.totalExpensesVal)}
                      </h3>
                      <p className="text-[9px] text-zinc-500 mt-1">Soma de obrigações do período</p>
                    </div>
                  </div>

                  {/* Expenses per category breakdown */}
                  <div className="glow-zinc-card p-5 rounded-2xl border border-rose-500/10 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Custos Mercantis por Classificação Contábil
                    </h4>

                    {expensesMetrics.count > 0 ? (
                      <div className="space-y-3 font-sans">
                        {(Object.entries(expensesMetrics.expenseCatSums) as [string, number][]).map(([cat, val]) => {
                          const pct = expensesMetrics.totalExpensesVal > 0 ? Math.round((val / expensesMetrics.totalExpensesVal) * 100) : 0;
                          return (
                            <div key={cat} className="space-y-1">
                              <div className="flex justify-between text-[11px] text-zinc-300">
                                <span>{cat}</span>
                                <span className="font-mono font-bold text-red-400">
                                  {formatBRL(val)} <span className="text-[9px] text-zinc-[550]">({pct}%)</span>
                                </span>
                              </div>
                              <div className="w-full bg-zinc-95 w bg-zinc-950 h-1.5 rounded-full overflow-hidden block">
                                <div className="bg-red-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-zinc-[550] text-center italic py-8 text-xs">Sem contas ou obrigações administrativas lançadas no período.</p>
                    )}
                  </div>

                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}

// Inlined visual SVG helper for state placeholders
function AlertIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
