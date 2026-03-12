import { Server, Globe, HardDrive, Wifi, Box, type LucideIcon } from 'lucide-react'

type ResourceKind = 'node' | 'pod' | 'deployment' | 'service' | 'ingress' | 'pvc' | 'disk' | 'network-device'
type ResourceHealth = 'healthy' | 'degraded' | 'failed' | 'unknown'

type ResourceChipProps = {
  kind: ResourceKind
  name: string
  health: ResourceHealth
  detail?: string
}

const kindIcons: Record<ResourceKind, LucideIcon> = {
  node: Server,
  pod: Box,
  deployment: Box,
  service: Globe,
  ingress: Globe,
  pvc: HardDrive,
  disk: HardDrive,
  'network-device': Wifi,
}

const healthColor: Record<ResourceHealth, string> = {
  healthy: 'text-green-400',
  degraded: 'text-amber-400',
  failed: 'text-red-400',
  unknown: 'text-text-muted',
}

const healthLabel: Record<ResourceHealth, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  failed: 'Failed',
  unknown: 'Unknown',
}

const ResourceChip = ({ kind, name, health, detail }: ResourceChipProps): React.ReactElement => {
  const Icon = kindIcons[kind]
  return (
    <div className="flex items-center gap-2.5 bg-white/3 ring-1 ring-white/6 rounded-xl px-3 py-2.5 flex-shrink-0">
      <Icon size={14} className="text-text-muted" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text">{name}</span>
          <span className={`text-xs ${healthColor[health]}`}>{healthLabel[health]}</span>
        </div>
        {detail && (
          <span className="text-xs text-text-muted">{detail}</span>
        )}
      </div>
    </div>
  )
}

export type { ResourceChipProps, ResourceKind, ResourceHealth }
export { ResourceChip }
