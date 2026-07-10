import { 
  TrendUp, 
  Printer, 
  WarningCircle, 
  UsersThree,
  ArrowUpRight,
  FilePdf,
  Image as ImageIcon,
  Cards
} from '@phosphor-icons/react'
import 'chart.js/auto'
import { Line } from 'react-chartjs-2'

export default function Dashboard() {
  const chartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Receitas (R$)',
        data: [350, 420, 300, 800, 550, 600, 150],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#3b82f6',
        pointRadius: 4,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Despesas (R$)',
        data: [100, 200, 150, 600, 250, 100, 50],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#ef4444',
        pointRadius: 4,
        fill: true,
        tension: 0.4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-sm text-gray-500">Acompanhe o desempenho da sua gráfica hoje.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Faturamento Diário</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">R$ 1.240,00</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <TrendUp size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Pedidos na Fila</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">14</h3>
            </div>
            <div className="p-2 bg-blue-50 text-brand-600 rounded-lg">
              <Printer size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Alertas de Estoque</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">2</h3>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <WarningCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Novos Clientes</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">28</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <UsersThree size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Receitas vs Despesas</h3>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Produção Recente</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FilePdf size={20} className="mr-3 text-gray-400" />
                <span className="text-sm font-medium">Apostilas Anglo</span>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Imprimindo</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ImageIcon size={20} className="mr-3 text-gray-400" />
                <span className="text-sm font-medium">Banners Lona</span>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Concluído</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
