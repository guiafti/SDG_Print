import { useState, useEffect } from 'react'
import { Plus, DownloadSimple, PencilSimple, Trash } from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { useNotify } from '../components/Notification'

interface Transacao {
  id: number
  data: string
  descricao: string
  tipo: 'receita' | 'despesa'
  valor: number
  status: string
}

export default function Financeiro() {
  const notify = useNotify()
  const [transacoes, setTransacoes] = useState<Transacao[]>([])

  useEffect(() => {
    fetchFinanceiro()
  }, [])

  const fetchFinanceiro = async () => {
    try {
      const data = await (window as any).ipcRenderer.invoke('get-financeiro')
      setTransacoes(data || [])
    } catch (error) {
      notify('error', 'Erro ao carregar financeiro.')
    }
  }

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0)
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0)
  const saldo = totalReceitas - totalDespesas

  const handleExport = async () => {
    if (transacoes.length === 0) return notify('warning', 'Nenhum dado para exportar.')
    
    const headers = 'ID;Data;Descrição;Tipo;Valor;Status'
    const csvContent = transacoes.map(t => 
      `${t.id};${t.data};${t.descricao};${t.tipo};${t.valor.toFixed(2)};${t.status}`
    ).join('\n')
    
    const fullContent = `${headers}\n${csvContent}`
    
    try {
      const success = await (window as any).ipcRenderer.invoke('save-csv', { 
        content: fullContent, 
        defaultName: `financeiro_${new Date().toISOString().split('T')[0]}.csv` 
      })
      if (success) notify('success', 'Relatório exportado com sucesso!')
    } catch (error) {
      notify('error', 'Erro ao exportar arquivo.')
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle Financeiro</h1>
          <p className="text-sm text-gray-500">Gerencie receitas, despesas e fluxo de caixa.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="mt-4 sm:mt-0 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
          >
            <DownloadSimple size={18} className="mr-2" /> Exportar Relatório
          </button>
          <button className="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
            <Plus size={18} className="mr-2" /> Nova Transação
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
        <div className="bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-green-500 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest text-[10px] font-black">Receitas (Total)</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(totalReceitas)}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-red-500 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest text-[10px] font-black">Despesas (Total)</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(totalDespesas)}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-blue-500 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest text-[10px] font-black">Saldo Atual</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(saldo)}</h3>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden text-left">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Últimas Transações</h3>
          <div className="flex space-x-2">
            <select className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500 bg-white">
              <option>Todos os tipos</option>
              <option>Receitas</option>
              <option>Despesas</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Descrição</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium text-right">Valor (R$)</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transacoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nenhuma transação encontrada.</td>
                </tr>
              ) : (
                transacoes.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{t.descricao}</td>
                    <td className="px-6 py-4 text-gray-500 capitalize font-bold">{t.tipo}</td>
                    <td className={clsx(
                      "px-6 py-4 text-right font-bold",
                      t.tipo === 'receita' ? "text-green-600" : "text-red-600"
                    )}>
                      {t.tipo === 'receita' ? '+ ' : '- '}{formatMoney(t.valor).replace('R$', '').trim()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Pago</span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-400">
                      <button className="hover:text-brand-600 mx-1"><PencilSimple size={16} /></button>
                      <button className="hover:text-red-600 mx-1"><Trash size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
