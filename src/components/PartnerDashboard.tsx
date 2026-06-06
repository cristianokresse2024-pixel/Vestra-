import React, { useState } from 'react';
import { useReino } from '../store';
import { useAuth } from '../auth';
import { 
  Users, 
  DollarSign, 
  Activity, 
  Package, 
  History, 
  TrendingUp, 
  Wallet, 
  CheckCircle,
  Clock,
  LogOut,
  Search,
  Building
} from 'lucide-react';
import { motion } from 'motion/react';

interface PartnerDashboardProps {
  linkedPartnerId?: string;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ linkedPartnerId }) => {
  const { profile, logout } = useAuth();
  const { products, sales, partners, activeStoreId, stores } = useReino();
  const [searchTerm, setSearchTerm] = useState('');

  const activeStoreObj = stores.find(s => s.id === activeStoreId);

  // Find partner details if linkedPartnerId is present
  const currentPartner = partners.find(p => p.id === linkedPartnerId);
  const partnerName = currentPartner?.name || profile?.name || 'Parceiro Imperial';

  // Filter products unrolled to this partner
  const linkedProducts = products.filter(p => p.partnerId === linkedPartnerId);

  // Filter sales that contain items linked to this partner
  const partnerSales = sales.filter(s => 
    s.items.some(item => item.partnerId === linkedPartnerId)
  );

  // Financial calculations
  // Sum up ONLY the total value of items that belong to the partner
  const totalSalesRevenue = partnerSales.reduce((sum, s) => {
    return sum + s.items
      .filter(i => i.partnerId === linkedPartnerId)
      .reduce((itemSum, i) => itemSum + (i.salePrice * i.quantity), 0);
  }, 0);
  
  // Total commissions earned (accumulated profit per item)
  const totalEarnedCommissions = partnerSales.reduce((sum, s) => {
    return sum + s.items
      .filter(i => i.partnerId === linkedPartnerId)
      .reduce((itemSum, i) => itemSum + (i.commissionAmount || 0), 0);
  }, 0);
  
  // Balance to receive (unpaid commissions for partner items)
  const balanceToReceive = partnerSales
    .filter(s => s.commissionPaid === false)
    .reduce((sum, s) => {
       return sum + s.items
         .filter(i => i.partnerId === linkedPartnerId)
         .reduce((itemSum, i) => itemSum + (i.commissionAmount || 0), 0);
    }, 0);

  // Paid commissions
  const paidCommissions = totalEarnedCommissions - balanceToReceive;

  // Format currency helpers
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredProducts = linkedProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Greetings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-zinc-900/35 border border-zinc-900 rounded-3xl gap-4">
        <div>
          <span className="px-2.5 py-1 bg-purple-600/10 text-purple-400 border border-purple-500/10 text-[9px] uppercase font-mono tracking-wider font-bold rounded-lg mb-2 inline-block">
            Módulo do Parceiro Unificado
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans uppercase">
            Saudações, {partnerName}!
          </h2>
          <p className="text-xs text-zinc-500 mt-1 font-sans">
            Acompanhe o faturamento líquido, comissões de vendas e estoque dos seus produtos integrados na filial: <strong className="text-purple-400">{activeStoreObj?.name || 'Filial Principal'}</strong>
          </p>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 self-start sm:self-center px-4 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-red-500/25 text-xs text-zinc-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Encerrar Sessão
        </button>
      </div>

      {/* Highlights Financial Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Saldo a Receber */}
        <div className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">Saldo a Receber</span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/20 text-purple-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight leading-none mb-1.5 font-sans">
              {formatBRL(balanceToReceive)}
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
              Aguardando liquidação financeira
            </p>
          </div>
        </div>

        {/* KPI: Comissão Acumulada */}
        <div className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">Lucro Total Acumulado</span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/20 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-emerald-400 tracking-tight leading-none mb-1.5 font-sans">
              {formatBRL(totalEarnedCommissions)}
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
              Comissão acumulada histórica
            </p>
          </div>
        </div>

        {/* KPI: Repasses Líquidos pagos */}
        <div className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">Repasses Quitados</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-zinc-200 tracking-tight leading-none mb-1.5 font-sans">
              {formatBRL(paidCommissions)}
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">
              Comissões transferidas e pagas
            </p>
          </div>
        </div>

        {/* KPI: Vendas Relatadas */}
        <div className="glow-zinc-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">Vendas Relacionadas</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-400 flex items-center justify-center">
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight leading-none mb-1.5 font-sans">
              {partnerSales.length} {partnerSales.length === 1 ? 'Venda' : 'Vendas'}
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">
              Volume de R$ {totalSalesRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} gerado
            </p>
          </div>
        </div>

      </div>

      {/* Double Column content: Products & History */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Linked Products View Table Column */}
        <div className="lg:col-span-3 glow-zinc-card p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                Produtos Vinculados ({linkedProducts.length})
              </h3>
              <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                Mercadorias sob sua custódia ou marca exclusiva
              </p>
            </div>
            
            {/* Quick search input */}
            <div className="relative max-w-[210px] w-full">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500">
                <Search className="w-3.5 h-3.5 text-purple-500/60" />
              </span>
              <input
                type="text"
                placeholder="Filtrar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-900 focus:border-purple-500/30 rounded-lg text-xs pl-8 pr-3 py-1.5 text-zinc-200 placeholder-zinc-650 outline-none transition-all"
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 bg-zinc-950/40 rounded-xl border border-zinc-900/60 text-center">
              <Package className="w-8 h-8 text-zinc-700 mb-2 stroke-[1.5]" />
              <p className="text-xs text-zinc-500 font-sans max-w-[260px]">
                Nenhum produto cadastrado com vínculo ao seu código de parceiro no momento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-mono text-[10px] uppercase">
                    <th className="py-2 px-1">Código</th>
                    <th className="py-2 px-1">Produto</th>
                    <th className="py-2 px-1">Categoria</th>
                    <th className="py-2 px-1 text-right">Estoque</th>
                    <th className="py-2 px-1 text-right">Preço de Venda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40 text-zinc-300">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-900/10 transition-all font-sans">
                      <td className="py-3 px-1 font-mono text-zinc-500">{p.code}</td>
                      <td className="py-3 px-1 font-semibold text-zinc-200">{p.name}</td>
                      <td className="py-3 px-1 font-mono text-purple-400 text-[10px]">{p.category}</td>
                      <td className="py-3 px-1 text-right">
                        <span className={`px-2 py-0.5 rounded-md font-bold font-mono text-[11px] ${
                          p.stock <= p.minStock 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-zinc-950 text-zinc-400'
                        }`}>
                          {p.stock} un
                        </span>
                      </td>
                      <td className="py-3 px-1 text-right font-semibold text-zinc-100">{formatBRL(p.salePrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sales History details Column */}
        <div className="lg:col-span-2 glow-zinc-card p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              Vendas & Repasses
            </h3>
            <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
              Histórico consolidado das suas comissões
            </p>
          </div>

          {partnerSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 bg-zinc-950/40 rounded-xl border border-zinc-900/60 text-center">
              <Activity className="w-8 h-8 text-zinc-700 mb-2 stroke-[1.5]" />
              <p className="text-xs text-zinc-500 font-sans max-w-[200px]">
                Nenhuma venda comissionada registrada no sistema.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {partnerSales.map(s => (
                <div key={s.id} className="p-3 bg-zinc-950/80 border border-zinc-900/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-zinc-500">COD: {s.id.slice(0, 8)}</span>
                    <span className="text-zinc-500 font-sans">{new Date(s.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-zinc-400 font-sans">Total da Venda Global: <strong>{formatBRL(s.total)}</strong></p>
                      <p className="text-xs text-purple-300 font-semibold font-sans mt-0.5">
                        Minha Comissão: <strong className="text-emerald-400">
                          {formatBRL(s.items.filter(i => i.partnerId === linkedPartnerId).reduce((sum, i) => sum + (i.commissionAmount || 0), 0))}
                        </strong>
                      </p>
                    </div>
                    
                    <div className="shrink-0">
                      {s.commissionPaid ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-mono rounded-md font-bold">
                          <CheckCircle className="w-3 h-3" />
                          Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] uppercase font-mono rounded-md font-bold animate-pulse">
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
