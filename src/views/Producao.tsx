import { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash, 
  X, 
  PencilSimple, 
  Printer, 
  Clock, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Calendar, 
  Warning, 
  ClipboardText,
  Tag,
  ChatCircle,
  Info
} from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { useNotify, useConfirm } from '../components/Notification'

interface ItemPedidoProducao {
  id?: number
  pedido_id?: number
  descricao: string
  quantidade: number
  detalhes_tecnicos?: string
}

interface PedidoProducao {
  id: number
  data_criacao: string
  data_entrega: string | null
  cliente_id: number | null
  cliente_nome: string | null
  cliente_nome_manual: string | null
  status: 'fila' | 'design' | 'impressao' | 'acabamento' | 'pronto' | 'entregue'
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  observacoes: string | null
  total: number
  orcamento_id: number | null
  venda_id: number | null
  cliente_telefone?: string | null
  cliente_email?: string | null
  itens: ItemPedidoProducao[]
}

interface Cliente {
  id: number
  nome: string
  telefone: string
  email: string
}

const statusColumns = [
  { id: 'fila', label: 'Fila de Espera', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { id: 'design', label: 'Arte / Design', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'impressao', label: 'Impressão', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'acabamento', label: 'Acabamento', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'pronto', label: 'Pronto p/ Entrega', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'entregue', label: 'Entregue', color: 'bg-gray-100 text-gray-800 border-gray-200' },
] as const

export default function Producao() {
  const [pedidos, setPedidos] = useState<PedidoProducao[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>('todas')
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<PedidoProducao | null>(null)

  const notify = useNotify()
  const confirm = useConfirm()

  // Form para Novo Pedido
  const [formData, setFormData] = useState({
    cliente_id: '' as string | number,
    cliente_nome_manual: '',
    data_entrega: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    observacoes: '',
    total: 0,
    itens: [{ descricao: '', quantidade: 1, detalhes_tecnicos: '' }]
  })

  // State para salvar alterações no pedido selecionado
  const [editNotes, setEditNotes] = useState('')
  const [editPrioridade, setEditPrioridade] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media')
  const [editDataEntrega, setEditDataEntrega] = useState('')
  const [editItens, setEditItens] = useState<ItemPedidoProducao[]>([])

  useEffect(() => {
    fetchPedidos()
    fetchClientes()
  }, [])

  const fetchPedidos = async () => {
    try {
      const data = await (window as any).ipcRenderer.invoke('get-pedidos-producao')
      setPedidos(data || [])
    } catch (error) {
      console.error(error)
      notify('error', 'Falha ao buscar pedidos de produção.')
    }
  }

  const fetchClientes = async () => {
    try {
      const data = await (window as any).ipcRenderer.invoke('get-clientes')
      setClientes(data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleCreatePedido = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.cliente_id && !formData.cliente_nome_manual) {
      return notify('warning', 'Selecione um cliente ou digite o nome manualmente.')
    }
    if (formData.itens.some(item => !item.descricao.trim())) {
      return notify('warning', 'Todos os itens precisam de uma descrição.')
    }

    try {
      const pedidoData = {
        cliente_id: formData.cliente_id ? Number(formData.cliente_id) : null,
        cliente_nome_manual: formData.cliente_id ? null : formData.cliente_nome_manual,
        data_entrega: formData.data_entrega || null,
        status: 'fila',
        prioridade: formData.prioridade,
        observacoes: formData.observacoes || null,
        total: formData.total || 0,
        itens: formData.itens
      }

      await (window as any).ipcRenderer.invoke('add-pedido-producao', pedidoData)
      notify('success', 'Pedido enviado para a produção!')
      setIsNewModalOpen(false)
      // Reset Form
      setFormData({
        cliente_id: '',
        cliente_nome_manual: '',
        data_entrega: '',
        prioridade: 'media',
        observacoes: '',
        total: 0,
        itens: [{ descricao: '', quantidade: 1, detalhes_tecnicos: '' }]
      })
      fetchPedidos()
    } catch (error) {
      console.error(error)
      notify('error', 'Erro ao lançar pedido de produção.')
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: PedidoProducao['status']) => {
    try {
      await (window as any).ipcRenderer.invoke('update-status-pedido-producao', { id, status: newStatus })
      fetchPedidos()
      // Se estiver visualizando o detalhe, atualiza a tela
      if (selectedPedido && selectedPedido.id === id) {
        setSelectedPedido(prev => prev ? { ...prev, status: newStatus } : null)
      }
      notify('success', `Status atualizado!`)
    } catch (error) {
      console.error(error)
      notify('error', 'Erro ao atualizar status.')
    }
  }

  const handleUpdatePrioridade = async (id: number, prioridade: PedidoProducao['prioridade']) => {
    try {
      await (window as any).ipcRenderer.invoke('update-prioridade-pedido-producao', { id, prioridade })
      fetchPedidos()
      notify('success', 'Prioridade atualizada!')
    } catch (error) {
      console.error(error)
      notify('error', 'Erro ao atualizar prioridade.')
    }
  }

  const handleDeletePedido = (id: number) => {
    confirm({
      title: 'Excluir Pedido',
      message: 'Tem certeza que deseja excluir permanentemente este pedido da produção?',
      onConfirm: async () => {
        try {
          await (window as any).ipcRenderer.invoke('delete-pedido-producao', id)
          notify('success', 'Pedido excluído com sucesso!')
          setIsDetailModalOpen(false)
          fetchPedidos()
        } catch (error) {
          console.error(error)
          notify('error', 'Erro ao excluir o pedido.')
        }
      }
    })
  }

  const handleOpenDetail = (pedido: PedidoProducao) => {
    setSelectedPedido(pedido)
    setEditNotes(pedido.observacoes || '')
    setEditPrioridade(pedido.prioridade)
    setEditDataEntrega(pedido.data_entrega || '')
    setEditItens([...pedido.itens])
    setIsDetailModalOpen(true)
  }

  const handleSaveDetailEdits = async () => {
    if (!selectedPedido) return
    try {
      // 1. Atualizar prioridade se mudou
      if (editPrioridade !== selectedPedido.prioridade) {
        await (window as any).ipcRenderer.invoke('update-prioridade-pedido-producao', { id: selectedPedido.id, prioridade: editPrioridade })
      }
      
      // 2. Salvar detalhes técnicos de cada item
      for (const item of editItens) {
        if (item.id) {
          await (window as any).ipcRenderer.invoke('update-detalhes-item-pedido', { id: item.id, detalhes_tecnicos: item.detalhes_tecnicos || '' })
        }
      }

      notify('success', 'Informações e especificações técnicas atualizadas!')
      setIsDetailModalOpen(false)
      fetchPedidos()
    } catch (error) {
      console.error(error)
      notify('error', 'Falha ao salvar as alterações.')
    }
  }

  const handlePrintFicha = (pedido: PedidoProducao) => {
    setSelectedPedido(pedido)
    setIsPrintViewOpen(true)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  // Auxiliares Novo Pedido Form Itens
  const addFormItem = () => {
    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, { descricao: '', quantidade: 1, detalhes_tecnicos: '' }]
    }))
  }

  const removeFormItem = (idx: number) => {
    if (formData.itens.length === 1) return
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== idx)
    }))
  }

  const updateFormItem = (idx: number, field: keyof typeof formData.itens[0], value: any) => {
    const updated = [...formData.itens]
    updated[idx] = { ...updated[idx], [field]: value }
    setFormData(prev => ({ ...prev, itens: updated }))
  }

  // Filtragem e Métricas
  const filteredPedidos = pedidos.filter(p => {
    const nomeCliente = (p.cliente_nome || p.cliente_nome_manual || '').toLowerCase()
    const matchesSearch = nomeCliente.includes(searchTerm.toLowerCase()) || 
                          p.itens.some(i => i.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          `#${p.id}`.includes(searchTerm)
    
    const matchesPrioridade = selectedPrioridade === 'todas' || p.prioridade === selectedPrioridade

    return matchesSearch && matchesPrioridade
  })

  // Estatísticas
  const totalFila = pedidos.filter(p => p.status === 'fila').length
  const totalProducao = pedidos.filter(p => ['design', 'impressao', 'acabamento'].includes(p.status)).length
  const totalPronto = pedidos.filter(p => p.status === 'pronto').length
  const totalUrgente = pedidos.filter(p => p.prioridade === 'urgente' && p.status !== 'entregue').length

  const getPriorityBadgeClass = (prioridade: PedidoProducao['prioridade']) => {
    switch (prioridade) {
      case 'urgente': return 'bg-red-500 text-white animate-pulse'
      case 'alta': return 'bg-orange-500 text-white'
      case 'media': return 'bg-blue-500 text-white'
      case 'baixa': return 'bg-gray-400 text-white'
    }
  }

  const getDeadlineText = (dataEntrega: string | null) => {
    if (!dataEntrega) return 'Sem prazo definido'
    const date = new Date(dataEntrega)
    const today = new Date()
    today.setHours(0,0,0,0)
    date.setHours(0,0,0,0)

    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `Atrasado há ${Math.abs(diffDays)} dia(s)`
    if (diffDays === 0) return 'ENTREGA HOJE!'
    if (diffDays === 1) return 'Entrega amanhã'
    return `Prazo: ${date.toLocaleDateString('pt-BR')} (${diffDays} dias)`
  }

  return (
    <div className="animate-fadeIn text-left">
      {/* 1. MÉTRIAS DE PRODUÇÃO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 no-print">
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500">
            <Clock size={24} weight="bold" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aguardando Fila</p>
            <p className="text-2xl font-black text-slate-800">{totalFila} <span className="text-xs text-gray-400 font-bold">pedidos</span></p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <PencilSimple size={24} weight="bold" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Confecção</p>
            <p className="text-2xl font-black text-blue-600">{totalProducao} <span className="text-xs text-gray-400 font-bold">em processo</span></p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
            <Check size={24} weight="bold" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pronto p/ Entrega</p>
            <p className="text-2xl font-black text-green-600">{totalPronto} <span className="text-xs text-gray-400 font-bold">finalizados</span></p>
          </div>
        </div>

        <div className="bg-white border border-red-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 animate-pulse">
            <Warning size={24} weight="bold" />
          </div>
          <div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Pedidos Urgentes</p>
            <p className="text-2xl font-black text-red-500">{totalUrgente} <span className="text-xs text-gray-400 font-bold">prioridade</span></p>
          </div>
        </div>
      </div>

      {/* 2. FILTROS E AÇÕES */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 no-print">
        <div className="flex flex-1 w-full md:w-auto gap-3">
          <div className="relative flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Buscar por cliente, pedido ou serviço..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold text-gray-800 outline-none focus:border-brand-500 transition-all shadow-sm pl-12"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <ClipboardText size={20} />
            </div>
          </div>

          <select 
            value={selectedPrioridade} 
            onChange={e => setSelectedPrioridade(e.target.value)}
            className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-brand-500 shadow-sm"
          >
            <option value="todas">Todas Prioridades</option>
            <option value="urgente">🚨 Urgente</option>
            <option value="alta">🟠 Alta</option>
            <option value="media">🔵 Média</option>
            <option value="baixa">⚪ Baixa</option>
          </select>
        </div>

        <button 
          onClick={() => setIsNewModalOpen(true)} 
          className="w-full md:w-auto bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-2xl font-black flex items-center justify-center shadow-lg hover:shadow-brand-100 transition-all active:scale-95 text-xs uppercase tracking-widest"
        >
          <Plus size={18} className="mr-2" weight="bold" /> Novo Pedido Produção
        </button>
      </div>

      {/* 3. KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 overflow-x-auto pb-4 no-print min-h-[60vh]">
        {statusColumns.map(col => {
          const colPedidos = filteredPedidos.filter(p => p.status === col.id)
          return (
            <div key={col.id} className="bg-gray-50/70 border border-gray-200/50 rounded-[2rem] p-4 flex flex-col min-w-[240px] max-h-[75vh] overflow-y-auto">
              {/* Header Coluna */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200/50 px-2">
                <div className="flex items-center gap-2">
                  <span className={clsx("w-2.5 h-2.5 rounded-full", 
                    col.id === 'fila' && 'bg-slate-400',
                    col.id === 'design' && 'bg-purple-500',
                    col.id === 'impressao' && 'bg-blue-500',
                    col.id === 'acabamento' && 'bg-orange-500',
                    col.id === 'pronto' && 'bg-green-500',
                    col.id === 'entregue' && 'bg-gray-400',
                  )}></span>
                  <h3 className="font-black text-gray-700 text-xs uppercase tracking-wider">{col.label}</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-200/80 text-gray-500">{colPedidos.length}</span>
              </div>

              {/* Lista de Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colPedidos.map(pedido => (
                  <div 
                    key={pedido.id} 
                    className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group relative flex flex-col justify-between min-h-[140px]"
                    onClick={() => handleOpenDetail(pedido)}
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex justify-between items-start gap-1 mb-2">
                        <span className="text-[10px] font-black text-brand-600">#{pedido.id}</span>
                        <span className={clsx("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider", getPriorityBadgeClass(pedido.prioridade))}>
                          {pedido.prioridade}
                        </span>
                      </div>

                      {/* Nome do Cliente */}
                      <p className="font-bold text-gray-800 text-sm tracking-tight mb-2 truncate group-hover:text-brand-600 transition-colors">
                        {pedido.cliente_nome || pedido.cliente_nome_manual || 'Consumidor'}
                      </p>

                      {/* Itens */}
                      <div className="space-y-1 mb-3">
                        {pedido.itens.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start text-xs font-semibold text-gray-500 leading-tight">
                            <span className="truncate max-w-[150px]">{item.descricao}</span>
                            <span className="text-gray-400 text-[10px] font-black ml-1">x{item.quantidade}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rodapé do Card */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <div className="flex items-center text-[10px] text-gray-400 font-bold gap-1">
                        <Calendar size={14} />
                        <span className={clsx(
                          pedido.data_entrega && new Date(pedido.data_entrega) < new Date() && pedido.status !== 'entregue' ? "text-red-500 font-black" : ""
                        )}>
                          {pedido.data_entrega ? new Date(pedido.data_entrega).toLocaleDateString('pt-BR') : 'Sem Prazo'}
                        </span>
                      </div>

                      {/* Controles de Status Rápidos (Arrows) */}
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {col.id !== 'fila' && (
                          <button 
                            onClick={() => {
                              const prevIdx = statusColumns.findIndex(c => c.id === col.id) - 1
                              handleUpdateStatus(pedido.id, statusColumns[prevIdx].id)
                            }}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors"
                            title="Mover para coluna anterior"
                          >
                            <ArrowLeft size={16} weight="bold" />
                          </button>
                        )}
                        {col.id !== 'entregue' && (
                          <button 
                            onClick={() => {
                              const nextIdx = statusColumns.findIndex(c => c.id === col.id) + 1
                              handleUpdateStatus(pedido.id, statusColumns[nextIdx].id)
                            }}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600 transition-colors"
                            title="Mover para próxima coluna"
                          >
                            <ArrowRight size={16} weight="bold" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {colPedidos.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-300 font-bold border-2 border-dashed border-gray-100 rounded-2xl">
                    Vazia
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 4. MODAL NOVO PEDIDO */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800 uppercase text-sm tracking-wider flex items-center">
                <Plus size={20} className="mr-2 text-brand-600" />
                Novo Pedido de Produção
              </h3>
              <button 
                onClick={() => setIsNewModalOpen(false)} 
                className="bg-white border border-gray-200 p-2 rounded-xl text-gray-400 hover:text-red-500 transition-all shadow-sm"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <form onSubmit={handleCreatePedido} className="p-8 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Cliente do CRM</label>
                  <select 
                    value={formData.cliente_id} 
                    onChange={e => setFormData({ ...formData, cliente_id: e.target.value, cliente_nome_manual: '' })}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 font-bold focus:border-brand-500 focus:bg-white outline-none text-sm transition-all"
                  >
                    <option value="">-- Buscar no CRM --</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome Manual (Opcional)</label>
                  <input 
                    type="text"
                    value={formData.cliente_nome_manual}
                    onChange={e => setFormData({ ...formData, cliente_nome_manual: e.target.value, cliente_id: '' })}
                    placeholder="Nome para cliente sem cadastro"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 font-bold focus:border-brand-500 focus:bg-white outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Prazo de Entrega</label>
                  <input 
                    type="date"
                    value={formData.data_entrega}
                    onChange={e => setFormData({ ...formData, data_entrega: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 font-bold focus:border-brand-500 focus:bg-white outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Prioridade</label>
                  <select 
                    value={formData.prioridade}
                    onChange={e => setFormData({ ...formData, prioridade: e.target.value as any })}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 font-bold focus:border-brand-500 focus:bg-white outline-none text-sm transition-all"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Valor do Pedido (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total || ''}
                    onChange={e => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3.5 font-bold focus:border-brand-500 focus:bg-white outline-none text-sm transition-all text-right font-mono"
                  />
                </div>
              </div>

              {/* Itens da Produção */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-gray-700 text-xs uppercase tracking-wider">Itens do Pedido</h4>
                  <button 
                    type="button" 
                    onClick={addFormItem}
                    className="bg-brand-50 text-brand-600 px-4 py-1.5 rounded-xl text-xs font-black hover:bg-brand-600 hover:text-white transition-all"
                  >
                    + Adicionar Item
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-[2rem] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 text-left">Descrição do Item/Serviço</th>
                        <th className="px-6 py-4 w-24 text-center">Quantidade</th>
                        <th className="px-6 py-4 text-left">Especificações Técnicas (Papel, Acabamento, etc)</th>
                        <th className="px-6 py-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.itens.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              required 
                              placeholder="Ex: Cartão de Visita 4x4" 
                              value={item.descricao}
                              onChange={e => updateFormItem(idx, 'descricao', e.target.value)}
                              className="w-full bg-transparent outline-none font-bold text-gray-800"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number" 
                              min="1"
                              value={item.quantidade}
                              onChange={e => updateFormItem(idx, 'quantidade', parseInt(e.target.value) || 1)}
                              className="w-full bg-transparent text-center font-black text-gray-900"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text" 
                              placeholder="Couché 300g, Verniz Local, 9x5cm" 
                              value={item.detalhes_tecnicos}
                              onChange={e => updateFormItem(idx, 'detalhes_tecnicos', e.target.value)}
                              className="w-full bg-transparent outline-none text-xs text-gray-500 font-semibold"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              type="button" 
                              disabled={formData.itens.length === 1}
                              onClick={() => removeFormItem(idx)}
                              className="text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                            >
                              <Trash size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Instruções / Observações de Produção</label>
                <textarea 
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais para a equipe de design ou acabamento..."
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold outline-none focus:border-brand-500 focus:bg-white transition-all h-24 resize-none text-sm"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-6 py-2.5 text-gray-400 font-bold uppercase text-[10px] tracking-wider hover:text-gray-600"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-700 text-white px-10 py-3.5 rounded-2xl font-black shadow-lg shadow-brand-100 transition-all uppercase text-xs tracking-wider"
                >
                  Confirmar e Lançar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL DETALHE / EDIÇÃO DO CARD */}
      {isDetailModalOpen && selectedPedido && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="font-black text-gray-800 uppercase text-sm tracking-wider flex items-center gap-2">
                  <ClipboardText size={20} className="text-brand-600" />
                  Pedido de Produção #{selectedPedido.id}
                </h3>
                <p className="text-xs font-semibold text-gray-400 mt-1">Lançado em: {new Date(selectedPedido.data_criacao).toLocaleString('pt-BR')}</p>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)} 
                className="bg-white border border-gray-200 p-2 rounded-xl text-gray-400 hover:text-red-500 transition-all shadow-sm"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1">
              {/* Informações Gerais */}
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Cliente</span>
                  <p className="font-bold text-gray-800 text-base">{selectedPedido.cliente_nome || selectedPedido.cliente_nome_manual || 'Consumidor Final'}</p>
                  {selectedPedido.cliente_telefone && <p className="text-xs font-semibold text-gray-500">Tel: {selectedPedido.cliente_telefone}</p>}
                  {selectedPedido.cliente_email && <p className="text-xs font-semibold text-gray-500">Email: {selectedPedido.cliente_email}</p>}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Status da Produção</span>
                  <div className="flex flex-wrap gap-2">
                    {statusColumns.map(statusCol => (
                      <button
                        key={statusCol.id}
                        onClick={() => handleUpdateStatus(selectedPedido.id, statusCol.id)}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all",
                          selectedPedido.status === statusCol.id 
                            ? statusCol.color + " shadow-sm scale-105" 
                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        {statusCol.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ajuste de Prazo e Prioridade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Editar Prioridade</label>
                  <select 
                    value={editPrioridade}
                    onChange={e => setEditPrioridade(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 font-bold outline-none focus:border-brand-500 text-sm shadow-sm"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">🚨 Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Prazo de Entrega</label>
                  <div className="text-sm font-bold text-gray-600 bg-gray-50 border border-gray-200/50 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <span>{getDeadlineText(selectedPedido.data_entrega)}</span>
                  </div>
                </div>
              </div>

              {/* Itens do Pedido com Especificação Técnica Detalhada */}
              <div className="space-y-3">
                <h4 className="font-black text-gray-800 text-xs uppercase tracking-wider">Itens e Especificações Técnicas (Robustez Gráfica)</h4>
                <div className="space-y-3">
                  {editItens.map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-center font-bold text-gray-800">
                        <span className="text-sm">{item.descricao}</span>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs">Qtd: {item.quantidade}</span>
                      </div>
                      
                      <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">Detalhes Técnicos de Produção (Mídia, Laminação, Enquadramento, Sangria)</label>
                        <textarea 
                          value={item.detalhes_tecnicos || ''}
                          onChange={e => {
                            const updated = [...editItens]
                            updated[idx].detalhes_tecnicos = e.target.value
                            setEditItens(updated)
                          }}
                          placeholder="Digite especificações detalhadas: tipo de papel (couché, offset, kraft), acabamento (refile, dobra, vinco, laminação bopp fosco/brilho, verniz local, ilhós), etc."
                          className="w-full bg-gray-50 border-gray-150 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-brand-500 focus:bg-white h-20 resize-none transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas de Produção Gerais */}
              {selectedPedido.observacoes && (
                <div className="bg-yellow-50/50 border border-yellow-100 rounded-2xl p-4">
                  <span className="text-[9px] font-black text-yellow-600 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <ChatCircle size={14} /> Observações Iniciais de Lançamento
                  </span>
                  <p className="text-xs font-bold text-gray-600 leading-relaxed italic">{selectedPedido.observacoes}</p>
                </div>
              )}

              {/* Ações Inferiores */}
              <div className="pt-6 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4">
                <button 
                  type="button" 
                  onClick={() => handleDeletePedido(selectedPedido.id)}
                  className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center text-xs uppercase tracking-wider transition-all"
                >
                  <Trash size={16} className="mr-2" /> Excluir Pedido
                </button>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => handlePrintFicha(selectedPedido)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center text-xs uppercase tracking-wider transition-all"
                  >
                    <Printer size={16} className="mr-2" /> Imprimir Ficha
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveDetailEdits}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. FICHA DE IMPRESSÃO / FOLHA DE SERVIÇO (ESCONDIDO NA TELA PRINCIPAL, ATIVADO AO IMPRIMIR) */}
      {isPrintViewOpen && selectedPedido && (
        <div className="print-only fixed inset-0 bg-white z-[99999] p-8 text-black flex flex-col text-left">
          <div className="border-b-4 border-gray-900 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black tracking-tight">IMAGINART - FICHA DE PRODUÇÃO</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Instruções Técnicas da Ordem de Serviço</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-gray-400 uppercase">Ordem nº</span>
              <p className="text-2xl font-black text-gray-900 leading-none">#{selectedPedido.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 border-b border-gray-200 pb-4">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</h4>
              <p className="font-bold text-base text-gray-900">{selectedPedido.cliente_nome || selectedPedido.cliente_nome_manual || 'Consumidor Final'}</p>
              {selectedPedido.cliente_telefone && <p className="text-xs font-bold text-gray-600">Telefone: {selectedPedido.cliente_telefone}</p>}
            </div>
            <div className="space-y-1 text-right">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prazos e Datas</h4>
              <p className="text-xs font-bold text-gray-600">Emissão: {new Date(selectedPedido.data_criacao).toLocaleDateString('pt-BR')}</p>
              <p className="text-sm font-black text-red-600">Entrega: {selectedPedido.data_entrega ? new Date(selectedPedido.data_entrega).toLocaleDateString('pt-BR') : 'Urgente / Sem Prazo'}</p>
              <p className="text-xs font-bold uppercase text-gray-700">Prioridade: <span className="underline font-black">{selectedPedido.prioridade}</span></p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Especificações dos Itens</h4>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-black uppercase text-[10px] tracking-wider w-1/3">Item / Serviço</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-black uppercase text-[10px] tracking-wider w-16">Qtd</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-black uppercase text-[10px] tracking-wider">Especificações Técnicas de Produção</th>
                </tr>
              </thead>
              <tbody>
                {selectedPedido.itens.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 px-4 py-3 font-bold text-gray-900">{item.descricao}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center font-black text-gray-900">{item.quantidade}</td>
                    <td className="border border-gray-300 px-4 py-3 text-xs font-bold text-gray-800 whitespace-pre-wrap">{item.detalhes_tecnicos || 'Nenhuma especificação técnica extra informada.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedPedido.observacoes && (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 mb-8">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Notas Gerais da Ordem</h4>
              <p className="text-xs font-bold text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedPedido.observacoes}</p>
            </div>
          )}

          <div className="mt-auto border-t-2 border-dashed border-gray-300 pt-8 flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
            <span>Imaginart Gestor - Controle de Produção</span>
            <span>Assinatura do Operador: ____________________________</span>
          </div>

          {/* Botão de Fechar Exclusivo para quando estiver visualizando no preview de impressão (não aparece no papel) */}
          <button 
            onClick={() => setIsPrintViewOpen(false)}
            className="no-print fixed bottom-8 right-8 bg-black text-white px-8 py-4 rounded-xl font-bold uppercase text-xs tracking-widest"
          >
            Voltar ao Gestor
          </button>
        </div>
      )}
    </div>
  )
}
