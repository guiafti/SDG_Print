import { useState, useEffect, useMemo } from 'react'
import { 
  MagnifyingGlass, 
  ShoppingCartSimple, 
  ShoppingBag, 
  Money, 
  QrCode, 
  CreditCard, 
  CheckCircle,
  Plus,
  Minus,
  Printer,
  X,
  Package,
  User
} from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { useNotify } from '../components/Notification'
import { printerService } from '../utils/printer'

interface Produto {
  id: number
  nome: string
  categoria: string
  preco: number
  estoque: number
}

interface Cliente {
  id: number
  nome: string
}

interface CartItem extends Produto {
  qty: number
}

export default function PDV() {
  const notify = useNotify()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [desconto, setDesconto] = useState<number>(0)
  const [selectedCategory, setSelectedCategory] = useState('Todas Categorias')
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro')
  const [selectedClienteId, setSelectedClienteId] = useState<number | string>('')
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [lastVendaId, setLastVendaId] = useState<number | null>(null)
  const [enviarProducao, setEnviarProducao] = useState<boolean>(false)
  const [prazoProducao, setPrazoProducao] = useState<string>('')

  useEffect(() => {
    fetchProdutos()
    fetchClientes()
  }, [])

  const fetchProdutos = async () => {
    try {
      if ((window as any).ipcRenderer) {
        const data = await (window as any).ipcRenderer.invoke('get-produtos')
        setProdutos(data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    }
  }

  const fetchClientes = async () => {
    try {
      if ((window as any).ipcRenderer) {
        const data = await (window as any).ipcRenderer.invoke('get-clientes')
        setClientes(data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  const filteredProdutos = useMemo(() => {
    return produtos.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'Todas Categorias' || p.categoria === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [produtos, searchTerm, selectedCategory])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(produtos.map(p => p.categoria)))
    return ['Todas Categorias', ...cats]
  }, [produtos])

  const addToCart = (produto: Produto) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === produto.id)
      if (existing) {
        return prev.map(item => item.id === produto.id ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, { ...produto, qty: 1 }]
    })
  }

  const updateQty = (id: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta
          return newQty > 0 ? { ...item, qty: newQty } : null
        }
        return item
      }).filter(Boolean) as CartItem[]
    })
  }

  const clearCart = () => {
    setCart([])
    setSelectedClienteId('')
    setDesconto(0)
    setEnviarProducao(false)
    setPrazoProducao('')
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.preco * item.qty), 0)
  const total = Math.max(0, subtotal - desconto)

  const handleCheckout = async () => {
    if (cart.length === 0) return notify('warning', 'O carrinho está vazio!')

    const vendaData = {
      cliente_id: selectedClienteId === '' ? null : Number(selectedClienteId),
      subtotal,
      desconto,
      total,
      forma_pagamento: paymentMethod,
      itens: cart.map(item => ({
        produto_id: item.id,
        quantidade: item.qty,
        preco_unitario: item.preco
      }))
    }

    try {
      if ((window as any).ipcRenderer) {
        const vendaId = await (window as any).ipcRenderer.invoke('finalizar-venda', vendaData)
        setLastVendaId(vendaId)
        
        if (enviarProducao) {
          const clienteNome = selectedClienteId 
            ? clientes.find(c => c.id === Number(selectedClienteId))?.nome 
            : 'Consumidor Final'

          const pedidoProducao = {
            cliente_id: selectedClienteId === '' ? null : Number(selectedClienteId),
            cliente_nome_manual: selectedClienteId === '' ? 'Consumidor Final (PDV)' : null,
            data_entrega: prazoProducao || null,
            status: 'fila',
            prioridade: 'media',
            total: total,
            venda_id: vendaId,
            observacoes: `Pedido de produção gerado a partir da venda #${vendaId} no PDV.`,
            itens: cart.map(item => ({
              descricao: item.nome,
              quantidade: item.qty,
              detalhes_tecnicos: ''
            }))
          }
          await (window as any).ipcRenderer.invoke('add-pedido-producao', pedidoProducao)
          notify('success', 'Venda finalizada e enviada para produção!')
        } else {
          notify('success', 'Venda realizada com sucesso!')
        }
        
        setIsReceiptModalOpen(true)
      }
    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      notify('error', 'Erro ao processar venda no banco de dados.')
    }
  }

  const closeReceipt = () => {
    setIsReceiptModalOpen(false)
    clearCart()
    fetchProdutos()
  }

  const formatMoney = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const handleThermalPrint = async () => {
    const venda = {
      id: lastVendaId,
      cliente: selectedClienteId ? clientes.find(c => c.id === Number(selectedClienteId))?.nome : 'Consumidor Final',
      itens: cart.map(item => ({
        qty: item.qty,
        nome: item.nome,
        precoTotal: formatMoney(item.preco * item.qty)
      })),
      subtotal: formatMoney(subtotal),
      desconto: desconto,
      descontoTotal: formatMoney(desconto),
      total: formatMoney(total)
    }

    try {
      await printerService.printReceipt(venda)
      notify('success', 'Impressão enviada!')
    } catch (error: any) {
      console.error(error)
      notify('error', 'Erro na impressora: ' + error.message)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px] text-left">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative w-full">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white min-w-[150px]"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProdutos.map(produto => (
              <button 
                key={produto.id}
                onClick={() => addToCart(produto)}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:border-brand-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                  <Package size={24} className="text-gray-600 group-hover:text-brand-600" />
                </div>
                <span className="text-xs font-semibold text-gray-800 line-clamp-2 h-8">{produto.nome}</span>
                <span className="text-xs text-brand-600 font-bold mt-1">{formatMoney(produto.preco)}</span>
                <span className="text-[10px] text-gray-400">Qtd: {produto.estoque}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center">
            <ShoppingCartSimple size={20} className="mr-2 text-brand-600" /> Caixa
          </h3>
          <button onClick={clearCart} className="text-xs text-red-500 hover:underline font-bold">Limpar</button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6">
              <ShoppingBag size={40} className="mb-2 text-gray-300" />
              <p className="text-sm text-center">Carrinho vazio</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-100 mb-2 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm text-gray-800 line-clamp-1 pr-2">{item.nome}</span>
                  <span className="font-bold text-sm text-brand-600">{formatMoney(item.preco * item.qty)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{formatMoney(item.preco)} /un</span>
                  <div className="flex items-center bg-gray-50 rounded border border-gray-200">
                    <button onClick={() => updateQty(item.id, -1)} className="px-2 py-1"><Minus size={12} weight="bold" /></button>
                    <span className="px-2 text-sm font-medium w-8 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="px-2 py-1"><Plus size={12} weight="bold" /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center">
              <User size={14} className="mr-1" /> Selecionar Cliente
            </label>
            <select 
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-brand-500 outline-none bg-white transition-all"
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
            >
              <option value="">Consumidor Final</option>
              {clientes.map(cli => (
                <option key={cli.id} value={cli.id}>{cli.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Forma de Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Dinheiro', icon: Money },
                { id: 'PIX', icon: QrCode },
                { id: 'Cartão', icon: CreditCard },
              ].map(method => (
                <button 
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={clsx(
                    "py-2.5 rounded-xl font-black text-[10px] flex flex-col items-center border-2 transition-all uppercase tracking-tighter",
                    paymentMethod === method.id 
                      ? "border-brand-500 text-brand-600 bg-brand-50" 
                      : "border-gray-100 text-gray-400 bg-white hover:border-gray-200"
                  )}
                >
                  <method.icon size={20} className="mb-1" weight="fill" /> {method.id}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Desconto (R$)</label>
            <input 
              type="number" 
              step="0.01"
              min="0"
              className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-sm font-bold focus:border-brand-500 outline-none bg-white transition-all"
              placeholder="0,00"
              value={desconto || ''}
              onChange={(e) => setDesconto(Number(e.target.value))}
            />
          </div>
          
          <div className="border-t-2 border-gray-100 pt-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 cursor-pointer"
                checked={enviarProducao}
                onChange={e => setEnviarProducao(e.target.checked)}
              />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Enviar para Produção</span>
            </label>
            
            {enviarProducao && (
              <div className="animate-fadeIn">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Prazo de Entrega</label>
                <input 
                  type="date"
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2 text-xs font-bold focus:border-brand-500 outline-none bg-white transition-all"
                  value={prazoProducao}
                  onChange={e => setPrazoProducao(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-1 pt-2 border-t-2 border-gray-100">
            <div className="flex justify-between items-center text-gray-500">
              <span className="uppercase text-[10px] font-bold tracking-widest">Subtotal:</span>
              <span className="text-sm font-bold">{formatMoney(subtotal)}</span>
            </div>
            {desconto > 0 && (
              <div className="flex justify-between items-center text-red-500">
                <span className="uppercase text-[10px] font-bold tracking-widest">Desconto:</span>
                <span className="text-sm font-bold">- {formatMoney(desconto)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-xl text-gray-900 pt-1">
              <span className="uppercase text-[10px] text-gray-400 tracking-widest mt-2">Total:</span>
              <span className="text-brand-600">{formatMoney(total)}</span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-100 transition-all active:scale-95 flex items-center justify-center uppercase tracking-widest text-xs"
          >
            <CheckCircle size={24} className="mr-2" weight="bold" /> Finalizar Venda
          </button>
        </div>
      </div>

      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-[100] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-full animate-fadeIn">
            <div className="p-4 bg-brand-600 flex justify-between items-center text-white">
              <h3 className="font-black uppercase tracking-widest text-xs flex items-center"><CheckCircle size={20} className="mr-2" /> Venda Concluída</h3>
              <button onClick={closeReceipt} className="text-white hover:text-gray-200"><X size={20} weight="bold" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-gray-50">
              <div className="receipt-paper w-full max-w-[300px] p-6 text-sm text-gray-800 relative">
                <div className="text-center mb-6 border-b border-dashed border-gray-300 pb-4">
                  <h2 className="font-black text-lg">IMAGINART</h2>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mt-1">Gráfica & Personalizados</p>
                </div>
                
                <div className="mb-4 text-[10px] font-bold text-gray-500 uppercase tracking-tighter space-y-1">
                  <p>Data: {new Date().toLocaleString('pt-BR')}</p>
                  <p>Venda: #{lastVendaId}</p>
                  {selectedClienteId && (
                    <p className="text-brand-600">Cliente: {clientes.find(c => c.id === Number(selectedClienteId))?.nome}</p>
                  )}
                </div>

                <table className="w-full text-[10px] mb-6 border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Item</th>
                      <th className="text-right py-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 font-medium">{item.qty}x {item.nome}</td>
                        <td className="py-2 text-right font-bold">{formatMoney(item.preco * item.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-gray-300 pt-4 space-y-1 mb-4">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500">
                        <span>SUBTOTAL:</span>
                        <span>{formatMoney(subtotal)}</span>
                    </div>
                    {desconto > 0 && (
                        <div className="flex justify-between text-[10px] font-bold text-red-500">
                            <span>DESCONTO:</span>
                            <span>- {formatMoney(desconto)}</span>
                        </div>
                    )}
                </div>

                <div className="border-t-2 border-brand-600 pt-4 font-black flex justify-between text-lg text-brand-600 tracking-tighter uppercase">
                  <span>Total:</span>
                  <span>{formatMoney(total)}</span>
                </div>

                <div className="text-center text-[10px] text-gray-400 mt-10 uppercase font-black tracking-widest">
                  Obrigado!
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-200 flex gap-3">
              <button onClick={closeReceipt} className="flex-1 bg-gray-100 text-gray-500 font-black py-3 rounded-2xl text-xs uppercase tracking-widest">Nova Venda</button>
              <button onClick={handleThermalPrint} className="flex-1 bg-brand-600 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center">
                <Printer size={18} className="mr-2" weight="bold" /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
