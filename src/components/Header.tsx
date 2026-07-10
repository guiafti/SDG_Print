import { 
  List, 
  MagnifyingGlass, 
  Bell, 
  Gear, 
  Plus 
} from '@phosphor-icons/react'

interface HeaderProps {
  onToggleSidebar: () => void
  onOpenSettings: () => void
}

export default function Header({ onToggleSidebar, onOpenSettings }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0 no-print">
      <div className="flex items-center">
        <button 
          className="md:hidden text-gray-500 hover:text-gray-800 mr-4" 
          onClick={onToggleSidebar}
        >
          <List size={24} />
        </button>
        
        <div className="relative hidden sm:block w-64">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar clientes, orçamentos..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow" 
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-brand-600 relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button 
          onClick={onOpenSettings}
          className="text-gray-500 hover:text-brand-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Gear size={20} />
        </button>
        <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors hidden sm:flex items-center">
          <Plus size={18} className="mr-2" /> Novo Pedido
        </button>
      </div>
    </header>
  )
}
