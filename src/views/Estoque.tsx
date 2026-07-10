import { useState, useEffect } from 'react'
import { Package, Plus, PencilSimple, Trash, Warning, X } from '@phosphor-icons/react'
import { useNotify, useConfirm } from '../components/Notification'

interface Produto {
  id: number
  nome: string
  categoria: string
  preco: number
  estoque: number
}

export default function Estoque() {
  const notify = useNotify()
  const askConfirm = useConfirm()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'Impressões',
    preco: '',
    estoque: ''
  })

  useEffect(() => {
    fetchProdutos()
  }, [])

  const fetchProdutos = async () => {
    try {
      const data = await (window as any).ipcRenderer.invoke('get-produtos')
      setProdutos(data || [])
    } catch (error) {
      notify('error', 'Erro ao carregar estoque.')
    }
  }

  const handleOpenModal = (produto: Produto | null = null) => {
    if (produto) {
      setEditingProduto(produto)
      setFormData({
        nome: produto.nome,
        categoria: produto.categoria,
        preco: produto.preco.toString(),
        estoque: produto.estoque.toString()
      })
    } else {
      setEditingProduto(null)
      setFormData({
        nome: '',
        categoria: 'Impressões',
        preco: '',
        estoque: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSave = {
      ...formData,
      preco: parseFloat(formData.preco),
      estoque: parseInt(formData.estoque)
    }

    try {
      if (editingProduto) {
        await (window as any).ipcRenderer.invoke('update-produto', { ...dataToSave, id: editingProduto.id })
        notify('success', 'Produto atualizado!')
      } else {
        await (window as any).ipcRenderer.invoke('add-produto', dataToSave)
        notify('success', 'Produto cadastrado!')
      }
      setIsModalOpen(false)
      fetchProdutos()
    } catch (error) {
      notify('error', 'Erro ao salvar produto.')
    }
  }

  const handleDelete = async (id: number) => {
    askConfirm({
      title: 'Excluir Produto',
      message: 'Tem certeza que deseja remover este item permanentemente?',
      onConfirm: async () => {
        try {
          await (window as any).ipcRenderer.invoke('delete-produto', id)
          fetchProdutos()
          notify('success', 'Produto excluído com sucesso.')
        } catch (error) {
          notify('error', 'Erro ao excluir produto.')
        }
      }
    })
  }

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
          <p className="text-sm text-gray-500">Gerencie seus produtos, preços e quantidades.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="mt-4 sm:mt-0 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
        >
          <Plus size={18} className="mr-2" /> Cadastrar Novo Item
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-white text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Nome do Item</th>
                <th className="px-6 py-3 font-medium">Categoria</th>
                <th className="px-6 py-3 font-medium">Preço Unit.</th>
                <th className="px-6 py-3 font-medium text-center">Estoque</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produtos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.nome}</td>
                  <td className="px-6 py-4 text-gray-500">{p.categoria}</td>
                  <td className="px-6 py-4 text-gray-900">{formatMoney(p.preco)}</td>
                  <td className="px-6 py-4 text-center font-bold">{p.estoque}</td>
                  <td className="px-6 py-4 text-center">
                    {p.estoque < 10 ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs flex items-center justify-center w-24 mx-auto font-medium">
                        <Warning size={12} className="mr-1" /> Crítico
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex items-center justify-center w-24 mx-auto font-medium">
                        Em Dia
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">
                    <button 
                      onClick={() => handleOpenModal(p)}
                      className="hover:text-brand-600 mx-1 p-1"
                    >
                      <PencilSimple size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="hover:text-red-600 mx-1 p-1"
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

      {/* MODAL ADICIONAR / EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                {editingProduto ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 tracking-tight">Nome do Produto *</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 tracking-tight">Categoria</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  value={formData.categoria}
                  onChange={e => setFormData({...formData, categoria: e.target.value})}
                >
                  <option value="Impressões">Impressões</option>
                  <option value="Personalizados">Personalizados</option>
                  <option value="Acabamentos">Acabamentos</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 tracking-tight">Preço Venda (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.preco}
                    onChange={e => setFormData({...formData, preco: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 tracking-tight">Qtd em Estoque</label>
                  <input 
                    type="number" 
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.estoque}
                    onChange={e => setFormData({...formData, estoque: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-800 font-medium py-2 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-brand-600 text-white font-medium py-2 rounded-lg text-sm font-bold"
                >
                  {editingProduto ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
