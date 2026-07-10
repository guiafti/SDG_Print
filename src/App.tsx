import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import PDV from './views/PDV'
import Dashboard from './views/Dashboard'
import Financeiro from './views/Financeiro'
import Estoque from './views/Estoque'
import CRM from './views/CRM'
import Orcamentos from './views/Orcamentos'
import Producao from './views/Producao'
import Configuracoes from './views/Configuracoes'

function App() {
  const [activeTab, setActiveTab] = useState('pdv')
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const renderView = () => {
    switch (activeTab) {
      case 'pdv': return <PDV />
      case 'dashboard': return <Dashboard />
      case 'producao': return <Producao />
      case 'financeiro': return <Financeiro />
      case 'estoque': return <Estoque />
      case 'crm': return <CRM />
      case 'orcamentos': return <Orcamentos />
      case 'configuracoes': return <Configuracoes />
      default: return <PDV />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800 font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      {/* Overlay for mobile */}
      {!isSidebarOpen && window.innerWidth < 768 ? null : (
        window.innerWidth < 768 && (
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-10 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <Header 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          onOpenSettings={() => setActiveTab('configuracoes')}
        />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
          {renderView()}
        </div>
      </main>
    </div>
  )
}

export default App
