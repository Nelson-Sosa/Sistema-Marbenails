import { useState, useMemo } from 'react'
import { Users, Plus, Search } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useClients } from '@/hooks/useClients'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import ClientCard from './components/ClientCard'
import ClientModal from './components/ClientModal'
import ClientHistoryModal from './components/ClientHistoryModal'

function ClientsPage() {
  usePageTitle('Clientes')
  const { data: clients, isLoading } = useClients()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [historyClient, setHistoryClient] = useState(null)

  const filteredClients = useMemo(() => {
    if (!clients) return []
    const q = search.toLowerCase()
    return clients.filter(
      (c) => 
        c.name.toLowerCase().includes(q) || 
        c.phone?.includes(q) ||
        c.whatsapp?.includes(q)
    )
  }, [clients, search])

  const handleEdit = (client) => {
    setSelectedClient(client)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setSelectedClient(null)
    setIsModalOpen(false)
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Directorio de Clientes</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gestioná tu base de clientes y su historial.
          </p>
        </div>
        <Button 
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Nuevo Cliente
        </Button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="max-w-md">
        <Input 
          placeholder="Buscar por nombre o teléfono..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── List ────────────────────────────────────────────────────────────── */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <ClientCard 
                key={client.id} 
                client={client} 
                onEdit={() => handleEdit(client)}
                onViewHistory={() => setHistoryClient(client)}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/50">
            <Users className="mb-3 h-10 w-10 text-slate-600" />
            <p className="text-lg font-medium text-slate-300">No se encontraron clientes</p>
          </div>
        )}
      </div>

      {(isModalOpen || selectedClient) && (
        <ClientModal 
          isOpen={isModalOpen || !!selectedClient}
          onClose={handleCloseModal}
          client={selectedClient}
        />
      )}

      {historyClient && (
        <ClientHistoryModal
          isOpen={!!historyClient}
          onClose={() => setHistoryClient(null)}
          client={historyClient}
        />
      )}
    </div>
  )
}

export default ClientsPage
