import { prisma } from '@mire/database'
import { config } from '@mire/blockchain/wagmi/config'
import { avalancheFuji } from '@mire/blockchain/wagmi/chains'
import { getContractAddress } from '@mire/blockchain/wagmi/contracts/addresses'
import { createPublicViemClient } from '@mire/blockchain/viem/clients'
import { Button } from '@mire/ui/components/button'
import { cn } from '@mire/ui/utils'
import { FilterSidebar } from '@/components/reports/FilterSidebar';
import { ReportsContent } from '@/components/reports/ReportsContent';

export default function ReportsPage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden bg-neutral-50/50">
      {/* Sidebar: Filters */}
      <aside className="w-80 shrink-0 overflow-y-auto border-r bg-background">
        <FilterSidebar />
      </aside>

      {/* Main Content: Reports */}
      <main className="flex-1 overflow-y-auto">
        <ReportsContent />
      </main>
    </div>
  );
}
