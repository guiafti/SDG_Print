import { useState, useEffect } from 'react'
import { FloppyDisk, Buildings, QrCode, Image as ImageIcon, Info, UploadSimple } from '@phosphor-icons/react'
import { useNotify } from '../components/Notification'

export default function Configuracoes() {
  const notify = useNotify()
  const [formData, setFormData] = useState({
    nome_fantasia: '',
    cnpj: '',
    telefone: '',
    email: '',
    chave_pix: '',
    banco_pix: '',
    titular_pix: '',
    logo_url: ''
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      if ((window as any).ipcRenderer) {
        const data = await (window as any).ipcRenderer.invoke('get-configuracoes')
        if (data) setFormData(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const handleSelectLogo = async () => {
    try {
      const path = await (window as any).ipcRenderer.invoke('select-logo')
      if (path) {
        setFormData({ ...formData, logo_url: path })
      }
    } catch (error) {
      notify('error', 'Erro ao selecionar imagem.')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if ((window as any).ipcRenderer) {
        await (window as any).ipcRenderer.invoke('save-configuracoes', formData)
        notify('success', 'Configurações salvas com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      notify('error', 'Erro ao salvar configurações.')
    }
  }

  return (
    <div className="animate-fadeIn max-w-4xl pb-10">
      <div className="mb-6 text-left">
        <h1 className="text-2xl font-bold text-gray-900">Configurações da Gráfica</h1>
        <p className="text-sm text-gray-500">Personalize seu sistema e seus orçamentos.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <Buildings size={20} className="mr-2 text-brand-600" />
              <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Identidade Visual</h3>
            </div>
          </div>
          <div className="p-6 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon size={40} className="text-gray-300" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <h4 className="font-bold text-gray-800">Logomarca da Empresa</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Esta imagem aparecerá no topo dos seus orçamentos em PDF. 
                Recomendamos uma imagem em <strong>PNG</strong> com fundo transparente.
              </p>
              <button 
                type="button"
                onClick={handleSelectLogo}
                className="bg-white border border-brand-500 text-brand-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-brand-50 transition-all"
              >
                <UploadSimple size={18} className="mr-2" /> SELECIONAR FOTO NO COMPUTADOR
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-left">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center">
            <Buildings size={20} className="mr-2 text-brand-600" />
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Informações Gerais</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">NOME FANTASIA</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" value={formData.nome_fantasia} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">CNPJ</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">WHATSAPP DE CONTATO</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-left">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center">
            <QrCode size={20} className="mr-2 text-brand-600" />
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Recebimento PIX</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">CHAVE PIX (PARA GERAR QR CODE)</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" value={formData.chave_pix} onChange={e => setFormData({...formData, chave_pix: e.target.value})} placeholder="E-mail, CPF, CNPJ ou Telefone" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">BANCO</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" value={formData.banco_pix} onChange={e => setFormData({...formData, banco_pix: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">TITULAR</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" value={formData.titular_pix} onChange={e => setFormData({...formData, titular_pix: e.target.value})} />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold flex items-center justify-center shadow-lg hover:bg-brand-700 transition-all">
          <FloppyDisk size={20} className="mr-2" /> SALVAR TUDO
        </button>
      </form>
    </div>
  )
}
