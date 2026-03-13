import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { createBrowserClient } from "./client.js"

import type { FaultlineClient } from "./client.js"

type ClientState = {
  client: FaultlineClient
  connected: boolean
}

const ClientContext = createContext<ClientState | null>(null)

type ClientProviderProps = {
  url: string
  children: React.ReactNode
}

const ClientProvider = ({ url, children }: ClientProviderProps): React.ReactElement => {
  const client = useMemo(() => createBrowserClient({ url }), [url])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    client.connect().then(
      () => setConnected(true),
      () => setConnected(false),
    )

    return () => {
      client.disconnect()
      setConnected(false)
    }
  }, [client])

  return (
    <ClientContext.Provider value={{ client, connected }}>
      {children}
    </ClientContext.Provider>
  )
}

const useClient = (): FaultlineClient => {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error("useClient must be used within a ClientProvider")
  return ctx.client
}

const useClientStatus = (): { connected: boolean } => {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error("useClientStatus must be used within a ClientProvider")
  return { connected: ctx.connected }
}

export type { ClientProviderProps }
export { ClientProvider, useClient, useClientStatus }
