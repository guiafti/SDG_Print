import { useState, useEffect } from 'react'
import { 
  Plus, 
  FilePdf, 
  Trash, 
  X, 
  WhatsappLogo, 
  PencilSimple,
  Package,
  CheckCircle,
  XCircle,
  QrCode as QrIcon
} from '@phosphor-icons/react'
import { clsx } from 'clsx'
import QRCode from 'qrcode'
import { useNotify, useConfirm } from '../components/Notification'

interface ItemOrcamento {
  id?: number
  descricao: string
  quantidade: number
  preco_unitario: number
}

interface Orcamento {
  id: number
  data: string
  cliente_id: number | null
  cliente_nome: string | null
  cliente_nome_manual: string | null
  total: number
  status: 'pendente' | 'aprovado' | 'cancelado'
  validade: string
  observacoes: string
}

interface Cliente {
  id: number
  nome: string
  telefone: string
}

interface Produto {
  id: number
  nome: string
  preco: number
}

interface Config {
  nome_fantasia: string
  cnpj: string
  telefone: string
  email: string
  chave_pix: string
  banco_pix: string
  titular_pix: string
  logo_url: string
}

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [config, setConfig] = useState<Config | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedOrc, setSelectedOrc] = useState<{orcamento: Orcamento, itens: ItemOrcamento[]} | null>(null)
  
  const notify = useNotify()
  const confirm = useConfirm()
  const [isProductListOpen, setIsProductListOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pixQRCode, setPixQRCode] = useState<string>('')
  
  const [formData, setFormData] = useState({
    cliente_id: '' as string | number,
    cliente_nome_manual: '',
    validade: '7 dias',
    observacoes: '',
    itens: [{ descricao: '', quantidade: 1, preco_unitario: 0 }] as ItemOrcamento[]
  })

  useEffect(() => {
    fetchOrcamentos()
    fetchClientes()
    fetchProdutos()
    fetchConfig()
  }, [])

  const fetchOrcamentos = async () => {
    const data = await (window as any).ipcRenderer.invoke('get-orcamentos')
    setOrcamentos(data || [])
  }

  const fetchClientes = async () => {
    const data = await (window as any).ipcRenderer.invoke('get-clientes')
    setClientes(data || [])
  }

  const fetchProdutos = async () => {
    const data = await (window as any).ipcRenderer.invoke('get-produtos')
    setProdutos(data || [])
  }

  const fetchConfig = async () => {
    const data = await (window as any).ipcRenderer.invoke('get-configuracoes')
    setConfig(data)
  }

  const generatePIXCode = async (valor: number) => {
    if (!config?.chave_pix) return
    const pixData = `Chave: ${config.chave_pix}\nValor: ${valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}\nTitular: ${config.titular_pix}`
    try {
      const url = await QRCode.toDataURL(pixData, { width: 300, margin: 1 })
      setPixQRCode(url)
      return url
    } catch (err) {
      console.error(err)
      return ''
    }
  }

  const handlePrint = async () => {
    if (!selectedOrc) return

    const qrCode = await generatePIXCode(selectedOrc.orcamento.total)

    // GERAMOS O HTML DO PDF DO ZERO, ISOLADO DE TUDO
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 20mm; 
            background: white; 
            color: #1a1a1a;
          }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 5px solid #2563eb; padding-bottom: 30px; margin-bottom: 40px; }
          .logo-area { display: flex; align-items: center; }
          .logo { width: 100px; height: 100px; object-contain: contain; margin-right: 20px; }
          .company-info h1 { font-size: 32px; font-weight: 900; color: #2563eb; margin: 0; letter-spacing: -1px; }
          .company-info p { font-size: 10px; font-weight: 700; color: #94a3b8; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px; }
          .doc-info { text-align: right; }
          .doc-info h2 { font-size: 24px; font-weight: 900; margin: 0; color: #1e293b; }
          .doc-info .num { font-size: 24px; font-weight: 900; color: #2563eb; margin-top: 5px; }
          .doc-info .date { font-size: 12px; color: #64748b; margin-top: 10px; font-weight: bold; }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .client-box h4, .terms-box h4 { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; margin-bottom: 10px; }
          .client-box p { font-size: 16px; font-weight: 700; margin: 0; }
          .client-box span { font-size: 12px; color: #64748b; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { background: #1e293b; color: white; padding: 12px 15px; font-size: 10px; text-transform: uppercase; text-align: left; }
          th.center { text-align: center; }
          th.right { text-align: right; }
          td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 600; }
          td.center { text-align: center; color: #64748b; }
          td.right { text-align: right; }
          td.total { font-weight: 900; font-size: 16px; }

          .footer-grid { display: grid; grid-template-columns: 1fr 300px; gap: 40px; }
          .obs-box p { font-size: 12px; color: #64748b; font-style: italic; line-height: 1.6; }
          .total-card { background: #eff6ff; padding: 25px; border-radius: 20px; border: 2px solid #dbeafe; text-align: right; }
          .total-card span { font-size: 10px; font-weight: 900; color: #3b82f6; text-transform: uppercase; }
          .total-card h3 { font-size: 32px; font-weight: 900; color: #1e3a8a; margin: 10px 0 0 0; letter-spacing: -1px; }

          .pix-box { margin-top: 50px; background: #f8fafc; padding: 25px; border-radius: 20px; border: 2px dashed #e2e8f0; display: flex; align-items: center; }
          .pix-qr { width: 100px; height: 100px; background: white; padding: 10px; border-radius: 15px; border: 1px solid #e2e8f0; margin-right: 25px; }
          .pix-info h4 { font-size: 12px; font-weight: 900; margin: 0; color: #1e293b; }
          .pix-info p { font-size: 14px; font-weight: 700; color: #2563eb; margin: 5px 0; }
          .pix-info span { font-size: 10px; color: #94a3b8; font-weight: bold; }
          
          .thanks { margin-top: 60px; text-align: center; font-size: 12px; font-weight: 900; color: #cbd5e1; text-transform: uppercase; letter-spacing: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            ${config?.logo_url ? `<img src="${config.logo_url}" class="logo" />` : ''}
            <div class="company-info">
              <h1>${config?.nome_fantasia || 'IMAGINART'}</h1>
              <p>Gráfica Rápida & Design Premium</p>
              <p style="color: #64748b; font-weight: bold;">CNPJ: ${config?.cnpj || '00.000.000/0001-00'}</p>
            </div>
          </div>
          <div class="doc-info">
            <h2>ORÇAMENTO</h2>
            <div class="num">#${selectedOrc.orcamento.id}</div>
            <div class="date">${new Date(selectedOrc.orcamento.data).toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        <div class="grid">
          <div class="client-box">
            <h4>Destinatário</h4>
            <p>${selectedOrc.orcamento.cliente_nome || selectedOrc.orcamento.cliente_nome_manual}</p>
            <span>${(selectedOrc.orcamento as any).cliente_telefone || ''}</span>
          </div>
          <div class="terms-box" style="text-align: right;">
            <h4>Validade e Contato</h4>
            <p style="color: #2563eb;">Válido por ${selectedOrc.orcamento.validade}</p>
            <span>WhatsApp: ${config?.telefone || ''}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Descrição do Serviço / Produto</th>
              <th class="center">Qtd</th>
              <th class="right">Unitário</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${selectedOrc.itens.map(item => `
              <tr>
                <td>${item.descricao}</td>
                <td class="center">${item.quantidade}</td>
                <td class="right">${item.preco_unitario.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</td>
                <td class="right total">${(item.quantidade * item.preco_unitario).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer-grid">
          <div class="obs-box">
            <h4>Observações Adicionais</h4>
            <p>${selectedOrc.orcamento.observacoes || 'Nenhuma observação informada.'}</p>
          </div>
          <div class="total-card">
            <span>Total da Proposta</span>
            <h3>${selectedOrc.orcamento.total.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</h3>
          </div>
        </div>

        ${config?.chave_pix ? `
          <div class="pix-box">
            <img src="${qrCode}" class="pix-qr" />
            <div class="pix-info">
              <h4>PAGAMENTO FACILITADO VIA PIX</h4>
              <p>${config.chave_pix}</p>
              <span>${config.banco_pix} | ${config.titular_pix}</span>
              <div style="margin-top: 15px; font-size: 8px; color: #94a3b8; font-weight: 900;">ESCANEIE O CÓDIGO PARA PAGAR AGORA</div>
            </div>
          </div>
        ` : ''}

        <div class="thanks">OBRIGADO PELA PREFERÊNCIA</div>
      </body>
      </html>
    `

    await (window as any).ipcRenderer.invoke('generate-pdf', { 
      htmlContent, 
      fileName: `Orcamento_${selectedOrc.orcamento.id}_${selectedOrc.orcamento.cliente_nome || 'Cliente'}.pdf` 
    })
  }

  const openPreview = async (id: number) => {
    const details = await (window as any).ipcRenderer.invoke('get-orcamento-detalhes', id)
    setSelectedOrc(details)
    setIsPreviewOpen(true)
  }

  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const updateItem = (index: number, field: keyof ItemOrcamento, value: any) => {
    const newItens = [...formData.itens]
    newItens[index] = { ...newItens[index], [field]: value }
    setFormData({ ...formData, itens: newItens })
  }

  const addItem = () => setFormData({ ...formData, itens: [...formData.itens, { descricao: '', quantidade: 1, preco_unitario: 0 }] })
  const removeItem = (index: number) => setFormData({ ...formData, itens: formData.itens.filter((_, i) => i !== index) })

  const addProductFromStock = (prod: Produto) => {
    setFormData({ ...formData, itens: [...formData.itens, { descricao: prod.nome, quantidade: 1, preco_unitario: prod.preco }] })
    setIsProductListOpen(false)
  }

  const handleOpenEdit = async (id: number) => {
    const details = await (window as any).ipcRenderer.invoke('get-orcamento-detalhes', id)
    setEditingId(id)
    setFormData({
      cliente_id: details.orcamento.cliente_id || '',
      cliente_nome_manual: details.orcamento.cliente_nome_manual || '',
      validade: details.orcamento.validade,
      observacoes: details.orcamento.observacoes || '',
      itens: details.itens.map((i: any) => ({ descricao: i.descricao, quantidade: i.quantidade, preco_unitario: i.preco_unitario }))
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...formData, id: editingId, total: formData.itens.reduce((acc, i) => acc + (i.quantidade * i.preco_unitario), 0), cliente_id: formData.cliente_id === '' ? null : Number(formData.cliente_id) }
    await (window as any).ipcRenderer.invoke('add-orcamento', data)
    setIsModalOpen(false)
    setEditingId(null)
    fetchOrcamentos()
  }

  const handleApproveOrcamento = async (id: number) => {
    confirm({
      title: 'Aprovar Orçamento',
      message: 'Deseja aprovar este orçamento e enviá-lo automaticamente para a fila de produção?',
      onConfirm: async () => {
        try {
          // 1. Obter detalhes do orçamento
          const { orcamento, itens } = await (window as any).ipcRenderer.invoke('get-orcamento-detalhes', id)
          
          // 2. Atualizar status do orçamento para aprovado
          await (window as any).ipcRenderer.invoke('update-status-orcamento', { id, status: 'aprovado' })
          
          // 3. Criar pedido de produção
          const pedidoData = {
            cliente_id: orcamento.cliente_id,
            cliente_nome_manual: orcamento.cliente_nome_manual,
            status: 'fila',
            prioridade: 'media',
            total: orcamento.total,
            orcamento_id: orcamento.id,
            observacoes: orcamento.observacoes ? `Orçamento #${orcamento.id} aprovado. Observações: ${orcamento.observacoes}` : `Orçamento #${orcamento.id} aprovado.`,
            itens: itens.map((i: any) => ({
              descricao: i.descricao,
              quantidade: i.quantidade,
              detalhes_tecnicos: ''
            }))
          }
          
          await (window as any).ipcRenderer.invoke('add-pedido-producao', pedidoData)
          
          notify('success', 'Orçamento aprovado e enviado para a Produção!')
          setIsPreviewOpen(false)
          fetchOrcamentos()
        } catch (error) {
          console.error(error)
          notify('error', 'Falha ao aprovar orçamento.')
        }
      }
    })
  }

  const handleCancelOrcamento = async (id: number) => {
    confirm({
      title: 'Cancelar Orçamento',
      message: 'Tem certeza que deseja cancelar este orçamento?',
      onConfirm: async () => {
        try {
          await (window as any).ipcRenderer.invoke('update-status-orcamento', { id, status: 'cancelado' })
          notify('info', 'Orçamento cancelado.')
          setIsPreviewOpen(false)
          fetchOrcamentos()
        } catch (error) {
          console.error(error)
          notify('error', 'Falha ao cancelar orçamento.')
        }
      }
    })
  }

  return (
    <div className="animate-fadeIn">
      {/* LISTAGEM INICIAL */}
      {!isPreviewOpen && (
        <div className="text-left">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">ORÇAMENTOS</h1>
            <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-xl font-bold flex items-center shadow-lg transition-all active:scale-95">
              <Plus size={20} className="mr-2" /> NOVO ORÇAMENTO
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-left">Nº</th>
                  <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-left">Cliente</th>
                  <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-right">Total</th>
                  <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orcamentos.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-400">#{o.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{o.cliente_nome || o.cliente_nome_manual || 'Consumidor'}</td>
                    <td className="px-6 py-4 font-black text-brand-600 text-right text-base">{formatMoney(o.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", 
                        o.status === 'pendente' && "bg-yellow-100 text-yellow-700",
                        o.status === 'aprovado' && "bg-green-100 text-green-700",
                        o.status === 'cancelado' && "bg-red-100 text-red-700"
                      )}>{o.status}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openPreview(o.id)} className="p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-600 hover:text-white transition-all" title="Ver / PDF"><FilePdf size={20} weight="fill" /></button>
                        <button onClick={() => handleOpenEdit(o.id)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-805 hover:text-white transition-all" title="Editar"><PencilSimple size={20} weight="bold" /></button>
                        {o.status === 'pendente' && (
                          <>
                            <button onClick={() => handleApproveOrcamento(o.id)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all" title="Aprovar e Enviar para Produção"><CheckCircle size={20} weight="bold" /></button>
                            <button onClick={() => handleCancelOrcamento(o.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all" title="Cancelar Orçamento"><XCircle size={20} weight="bold" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CRIAR/EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800 uppercase text-lg flex items-center">
                {editingId ? <PencilSimple size={24} className="mr-3 text-brand-600" /> : <Plus size={24} className="mr-3 text-brand-600" />}
                {editingId ? `Editar Orçamento #${editingId}` : 'Novo Orçamento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-white border border-gray-200 p-2 rounded-xl text-gray-400 hover:text-red-500 transition-all shadow-sm"><X size={24} weight="bold" /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cliente</label>
                  <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold focus:border-brand-500 focus:bg-white outline-none" value={formData.cliente_id} onChange={e => setFormData({...formData, cliente_id: e.target.value, cliente_nome_manual: ''})}>
                    <option value="">-- Buscar no CRM --</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nome Manual</label>
                  <input className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold focus:border-brand-500 focus:bg-white outline-none" placeholder="Nome para este orçamento" value={formData.cliente_nome_manual} onChange={e => setFormData({...formData, cliente_nome_manual: e.target.value, cliente_id: ''})} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-gray-800 text-sm">Itens e Serviços</h4>
                  <button type="button" onClick={() => setIsProductListOpen(!isProductListOpen)} className="bg-brand-600 text-white px-6 py-2 rounded-xl text-xs font-black hover:bg-brand-700 transition-all flex items-center shadow-lg">
                    <Package size={18} className="mr-2" weight="fill" /> BUSCAR NO ESTOQUE
                  </button>
                </div>

                {isProductListOpen && (
                  <div className="p-5 bg-brand-50/50 rounded-3xl grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn border-2 border-dashed border-brand-100">
                    {produtos.map(p => (
                      <button key={p.id} type="button" onClick={() => addProductFromStock(p)} className="text-left bg-white p-4 rounded-2xl border border-gray-100 hover:border-brand-500 shadow-sm transition-all group">
                        <p className="text-xs font-bold text-gray-800 truncate group-hover:text-brand-600">{p.nome}</p>
                        <p className="text-[11px] font-black text-brand-600 mt-1">{formatMoney(p.preco)}</p>
                      </button>
                    ))}
                  </div>
                )}

                <div className="bg-white border-2 border-gray-50 rounded-[2rem] overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-5 text-left">Descrição</th>
                        <th className="px-8 py-5 w-24 text-center">Qtd</th>
                        <th className="px-8 py-5 w-32 text-right">Unitário</th>
                        <th className="px-8 py-5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {formData.itens.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4"><input required className="w-full bg-transparent outline-none font-bold text-gray-800" placeholder="O que você está vendendo?" value={item.descricao} onChange={e => updateItem(idx, 'descricao', e.target.value)} /></td>
                          <td className="px-6 py-4"><input type="number" className="w-full bg-transparent text-center font-black text-gray-900" value={item.quantidade} onChange={e => updateItem(idx, 'quantidade', parseInt(e.target.value))} /></td>
                          <td className="px-6 py-4"><input type="number" step="0.01" className="w-full bg-transparent text-right font-black text-brand-600" value={item.preco_unitario} onChange={e => updateItem(idx, 'preco_unitario', parseFloat(e.target.value))} /></td>
                          <td className="px-6 py-4 text-center"><button type="button" onClick={() => removeItem(idx)} className="text-gray-200 hover:text-red-500 transition-colors"><Trash size={22} weight="bold" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" onClick={addItem} className="w-full py-5 bg-gray-50 text-gray-400 text-[10px] font-black hover:bg-gray-100 transition-all uppercase tracking-[0.3em]">+ ADICIONAR ITEM MANUAL</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Validade</label>
                  <input className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 font-bold outline-none focus:border-brand-500" value={formData.validade} onChange={e => setFormData({...formData, validade: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Observações no PDF</label>
                  <textarea className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold outline-none focus:border-brand-500 h-28 resize-none" value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} />
                </div>
              </div>

              <div className="pt-8 border-t-2 border-gray-50 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total da Proposta</p>
                  <p className="text-5xl font-black text-brand-600 tracking-tighter mt-1">{formatMoney(formData.itens.reduce((acc, i) => acc + (i.quantidade * i.preco_unitario), 0))}</p>
                </div>
                <div className="flex gap-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                  <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-12 py-4 rounded-2xl font-black shadow-2xl transition-all active:scale-95 uppercase tracking-widest">Salvar Orçamento</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISUALIZAÇÃO DO ORÇAMENTO (NA TELA) */}
      {isPreviewOpen && selectedOrc && (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col overflow-y-auto animate-fadeIn">
          
          <div className="fixed top-8 right-8 no-print flex flex-col gap-4">
            {selectedOrc.orcamento.status === 'pendente' && (
              <>
                <button onClick={() => handleApproveOrcamento(selectedOrc.orcamento.id)} className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] shadow-2xl hover:bg-emerald-750 transition-all flex items-center gap-4 font-black uppercase text-sm active:scale-95 border-4 border-white">
                  <CheckCircle size={28} weight="bold" /> APROVAR E LANÇAR PRODUÇÃO
                </button>
                <button onClick={() => handleCancelOrcamento(selectedOrc.orcamento.id)} className="bg-red-600 text-white px-10 py-5 rounded-[2rem] shadow-2xl hover:bg-red-700 transition-all flex items-center gap-4 font-black uppercase text-sm active:scale-95 border-4 border-white">
                  <XCircle size={28} weight="bold" /> CANCELAR ORÇAMENTO
                </button>
              </>
            )}
            <button onClick={handlePrint} className="bg-green-600 text-white px-10 py-5 rounded-[2rem] shadow-2xl hover:bg-green-700 transition-all flex items-center gap-4 font-black uppercase text-sm active:scale-95 border-4 border-white">
              <FilePdf size={28} weight="fill" /> SALVAR PDF PROFISSIONAL
            </button>
            <button onClick={() => setIsPreviewOpen(false)} className="bg-gray-900 text-white px-10 py-5 rounded-[2rem] shadow-2xl hover:bg-black transition-all flex items-center gap-4 font-black uppercase text-sm border-4 border-white">
              <X size={28} weight="bold" /> FECHAR
            </button>
          </div>

          <div className="w-full bg-white flex flex-col items-center py-20 px-10 min-h-screen">
            <div className="w-full max-w-[800px] bg-white p-12 border border-gray-100 shadow-lg rounded-sm">
              {/* Cabeçalho */}
              <div className="flex justify-between items-center border-b-8 border-brand-600 pb-12 mb-16">
                <div className="flex items-center">
                  {config?.logo_url && <img src={config.logo_url} alt="Logo" className="w-32 h-32 object-contain mr-10" />}
                  <div className="text-left text-gray-800">
                    <h1 className="text-4xl font-black text-brand-600 tracking-tighter leading-none">{config?.nome_fantasia || 'IMAGINART'}</h1>
                    <p className="text-[10px] font-black text-gray-400 tracking-[0.5em] uppercase mt-4">Gráfica Rápida & Design Premium</p>
                    <p className="text-sm font-bold uppercase tracking-tight mt-1">CNPJ: {config?.cnpj || '12.345.678/0001-90'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-1">Orçamento</h2>
                  <p className="text-3xl font-black text-brand-600 leading-none">#{selectedOrc.orcamento.id}</p>
                  <p className="text-xs text-gray-400 mt-4 font-black uppercase tracking-[0.2em]">{new Date(selectedOrc.orcamento.data).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Infos */}
              <div className="grid grid-cols-2 gap-20 mb-20 text-left">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] border-b-2 border-brand-50 pb-2">Destinatário</h4>
                  <p className="text-3xl font-black text-gray-900 leading-tight">{selectedOrc.orcamento.cliente_nome || selectedOrc.orcamento.cliente_nome_manual}</p>
                  <p className="text-lg text-gray-500 font-bold">{(selectedOrc.orcamento as any).cliente_telefone || ''}</p>
                </div>
                <div className="text-right space-y-4">
                  <h4 className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em] border-b-2 border-brand-50 pb-2">Condições</h4>
                  <p className="text-xl text-gray-900 font-black">Validade: <span className="text-brand-600">{selectedOrc.orcamento.validade}</span></p>
                  <p className="text-base text-gray-500 font-bold mt-1 uppercase tracking-tighter">Whats: {config?.telefone || ''}</p>
                </div>
              </div>

              {/* Itens */}
              <table className="w-full mb-20 border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="px-10 py-6 text-left font-black uppercase text-[10px] tracking-[0.2em] rounded-tl-3xl">Descrição</th>
                    <th className="px-10 py-6 w-32 text-center font-black uppercase text-[10px] tracking-[0.2em]">Qtd</th>
                    <th className="px-10 py-6 w-40 text-right font-black uppercase text-[10px] tracking-[0.2em]">Unitário</th>
                    <th className="px-10 py-6 w-40 text-right font-black uppercase text-[10px] tracking-[0.2em] rounded-tr-3xl">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="text-xl">
                  {selectedOrc.itens.map((item, idx) => (
                    <tr key={idx} className="border-b-2 border-gray-50">
                      <td className="px-10 py-8 text-gray-800 font-bold text-left leading-snug">{item.descricao}</td>
                      <td className="px-10 py-8 text-center font-black text-gray-400">{item.quantidade}</td>
                      <td className="px-10 py-8 text-right text-gray-500 font-medium">{formatMoney(item.preco_unitario)}</td>
                      <td className="px-10 py-8 text-right font-black text-gray-900">{formatMoney(item.quantidade * item.preco_unitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totais */}
              <div className="flex justify-between items-start gap-24 text-left">
                <div className="flex-1">
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] border-b-2 border-gray-50 pb-3 mb-6">Observações</h4>
                  <p className="text-sm text-gray-500 leading-relaxed italic whitespace-pre-wrap font-medium">{selectedOrc.orcamento.observacoes || 'Proposta sujeita a alterações.'}</p>
                </div>
                <div className="w-full max-w-sm">
                  <div className="bg-brand-50 p-12 rounded-[3rem] border-4 border-brand-100 text-right">
                    <span className="text-brand-900/30 text-xs font-black uppercase tracking-[0.3em]">Investimento Total</span>
                    <p className="text-6xl font-black text-brand-600 tracking-tighter mt-4 leading-none">{formatMoney(selectedOrc.orcamento.total)}</p>
                  </div>
                </div>
              </div>

              {/* PIX */}
              {config?.chave_pix && pixQRCode && (
                <div className="mt-24 p-12 bg-gray-50 rounded-[4rem] border-4 border-dashed border-gray-200 flex items-center justify-between text-left">
                  <div className="flex items-center">
                    <div className="bg-white p-5 rounded-[2.5rem] shadow-xl border-2 border-gray-100 mr-12">
                      <img src={pixQRCode} alt="PIX" className="w-32 h-32" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mb-4">Pagamento Digital PIX</h4>
                      <p className="text-3xl font-black text-brand-600 tracking-tighter leading-none">{config.chave_pix}</p>
                      <p className="text-sm text-gray-400 uppercase font-black mt-3 tracking-widest">{config.banco_pix} | {config.titular_pix}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-32 text-center">
                <p className="text-sm font-black text-gray-200 uppercase tracking-[0.8em]">Imaginart Gráfica & Design</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
