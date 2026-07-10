import { useState, useEffect } from 'react'
import { 
  UserPlus, 
  DownloadSimple, 
  PencilSimple, 
  Trash, 
  Users, 
  X, 
  WhatsappLogo, 
  Tag, 
  Cake, 
  ClockCounterClockwise,
} from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { useNotify } from '../components/Notification'

interface Cliente {
  id: number
  nome: string
  email: string
  telefone: string
  documento: string
  data_nascimento: string
  tags: string // JSON string array
}

interface VendaHistorico {
  id: number
  data: string
  total: number
  forma_pagamento: string
  itens: string
}

const PRESET_TAGS = ['Fiel', 'Vip', 'Bom Pagador', 'Recorrente', 'Atenção']

export default function CRM() {
  const notify = useNotify()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [historico, setHistorico] = useState<VendaHistorico[]>([])
  const [filterTag, setFilterTag] = useState('')
  
  const [formData, setFormData] = useState({
    id: null as number | null,
    nome: '',
    email: '',
    telefone: '',
    documento: '',
    data_nascimento: '',
    tags: [] as string[]
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    const data = await (window as any).ipcRenderer.invoke('get-clientes')
    setClientes(data || [])
  }

  const handleOpenModal = (cliente: Cliente | null = null) => {
    if (cliente) {
      setFormData({
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        documento: cliente.documento || '',
        data_nascimento: cliente.data_nascimento || '',
        tags: JSON.parse(cliente.tags || '[]')
      })
    } else {
      setFormData({
        id: null,
        nome: '',
        email: '',
        telefone: '',
        documento: '',
        data_nascimento: '',
        tags: []
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...formData, tags: JSON.stringify(formData.tags) }
    
    try {
      if (formData.id) {
        await (window as any).ipcRenderer.invoke('update-cliente', data)
        notify('success', 'Cliente atualizado com sucesso!')
      } else {
        await (window as any).ipcRenderer.invoke('add-cliente', data)
        notify('success', 'Cliente cadastrado com sucesso!')
      }
      setIsModalOpen(false)
      fetchClientes()
    } catch (error) {
      notify('error', 'Erro ao salvar cliente.')
    }
  }

  const handleOpenFicha = async (cliente: Cliente) => {
    setSelectedCliente(cliente)
    const history = await (window as any).ipcRenderer.invoke('get-cliente-historico', cliente.id)
    setHistorico(history || [])
    setIsFichaOpen(true)
  }

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag) 
        : [...prev.tags, tag]
    }))
  }

  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const filteredClientes = clientes.filter(c => {
    if (!filterTag) return true
    const tags = JSON.parse(c.tags || '[]')
    return tags.includes(filterTag)
  })

  const isAniversariante = (dateStr: string) => {
    if (!dateStr) return false
    const today = new Date()
    const birth = new Date(dateStr)
    return today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth()
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM & Atendimento</h1>
          <p className="text-sm text-gray-500">Gestão estratégica de clientes e fidelização.</p>
        </div>
        <div className="flex gap-3">
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none"
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
          >
            <option value="">Todas Etiquetas</option>
            {PRESET_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
          >
            <UserPlus size={18} className="mr-2" /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Etiquetas</th>
                <th className="px-6 py-3 font-medium">Contato</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClientes.map((c) => {
                const tags = JSON.parse(c.tags || '[]') as string[]
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <button onClick={() => handleOpenFicha(c)} className="flex items-center text-left hover:text-brand-600">
                        <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mr-3 font-bold text-xs">
                          {c.nome.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center">
                            {c.nome}
                            {isAniversariante(c.data_nascimento) && (
                              <Cake size={16} className="ml-2 text-pink-500 animate-bounce" weight="fill" />
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{c.documento || 'Sem CPF/CNPJ'}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {tags.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium border border-gray-200">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-700">{c.telefone}</span>
                        <span className="text-xs text-gray-400">{c.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <a 
                          href={`https://wa.me/55${c.telefone.replace(/\D/g,'')}`} 
                          target="_blank" 
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        >
                          <WhatsappLogo size={18} weight="fill" />
                        </a>
                        <button onClick={() => handleOpenModal(c)} className="p-1.5 text-gray-400 hover:text-brand-600"><PencilSimple size={18} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CADASTRO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{formData.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">NOME COMPLETO *</label>
                  <input required className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-brand-500" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">WHATSAPP / CELULAR</label>
                  <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-brand-500" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">DATA NASCIMENTO</label>
                  <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-brand-500" value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center"><Tag size={14} className="mr-1" /> ETIQUETAS DO CLIENTE</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={clsx(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                        formData.tags.includes(tag) ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-brand-500"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-800 py-2 rounded font-medium">Cancelar</button>
                <button type="submit" className="flex-1 bg-brand-600 text-white py-2 rounded font-bold">Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FICHA DO CLIENTE (DETAIL VIEW) */}
      {isFichaOpen && selectedCliente && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex justify-end">
          <div className="bg-gray-50 w-full max-w-xl h-full shadow-2xl flex flex-col animate-fadeIn">
            <div className="bg-white p-6 border-b border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-brand-100 mr-4">
                    {selectedCliente.nome.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedCliente.nome}</h2>
                    <div className="flex gap-2 mt-1">
                      {JSON.parse(selectedCliente.tags || '[]').map((t: string) => (
                        <span key={t} className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded text-[10px] font-bold uppercase">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsFichaOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
              </div>
              
              <div className="flex gap-4">
                <a 
                  href={`https://wa.me/55${selectedCliente.telefone.replace(/\D/g,'')}`}
                  target="_blank"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <WhatsappLogo size={20} weight="fill" /> WhatsApp
                </a>
                <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-50">Editar Perfil</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Resumo Financeiro */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase">Total Gasto</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{formatMoney(historico.reduce((acc, v) => acc + v.total, 0))}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase">Compras</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{historico.length}</p>
                </div>
              </div>

              {/* Histórico */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <ClockCounterClockwise size={18} className="mr-2" /> Histórico de Pedidos
                </h3>
                <div className="space-y-3">
                  {historico.length === 0 ? (
                    <p className="text-center py-10 text-gray-400 text-sm">Este cliente ainda não realizou compras.</p>
                  ) : (
                    historico.map(venda => (
                      <div key={venda.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-bold text-gray-900">Venda #{venda.id}</p>
                            <p className="text-xs text-gray-500">{new Date(venda.data).toLocaleString('pt-BR')}</p>
                          </div>
                          <span className="font-bold text-brand-600">{formatMoney(venda.total)}</span>
                        </div>
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded italic leading-relaxed">
                          {venda.itens}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
