import { 
  ShoppingCart, 
  SquaresFour, 
  CurrencyDollar, 
  Package, 
  Users, 
  Calculator,
  Printer,
  Wrench,
  X
} from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const navItems = [
  { id: 'pdv', label: 'PDV / Caixa', icon: ShoppingCart },
  { id: 'dashboard', label: 'Dashboard', icon: SquaresFour },
  { id: 'producao', label: 'Produção / Pedidos', icon: Wrench },
  { id: 'financeiro', label: 'Financeiro', icon: CurrencyDollar },
  { id: 'estoque', label: 'Estoque', icon: Package },
  { id: 'crm', label: 'CRM & Atendimento', icon: Users },
  { id: 'orcamentos', label: 'Orçamentos', icon: Calculator },
]

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  return (
    <aside className={twMerge(
      "w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-transform duration-300 z-20 absolute md:relative h-full no-print",
      !isOpen && "-translate-x-full md:translate-x-0 md:hidden"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Printer weight="fill" className="text-brand-600 text-2xl mr-2" />
        <span className="text-xl font-bold text-gray-900 tracking-tight">Print<span className="text-brand-600">Pro</span></span>
        
        {/* Close Sidebar Mobile */}
        <button className="ml-auto md:hidden text-gray-500 hover:text-gray-800" onClick={() => setIsOpen(false)}>
          <X size={20} />
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  setActiveTab(item.id)
                  if (window.innerWidth < 768) setIsOpen(false)
                }}
                className={clsx(
                  "w-full flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors",
                  activeTab === item.id 
                    ? "text-brand-600 bg-brand-50" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon size={20} className="mr-3" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Perfil Sidebar */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <img src={`https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff`} alt="User" className="w-9 h-9 rounded-full" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Admin Gráfica</p>
            <p className="text-xs text-gray-500">admin@printpro.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
