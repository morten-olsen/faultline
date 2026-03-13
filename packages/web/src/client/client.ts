import { messageSchema, protocol } from "@faultline/protocol"

import type {
  InferCallInput,
  InferCallOutput,
  InferEventPayload,
  ProtocolDefinition,
} from "@faultline/protocol"

type PendingCall = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

type EventHandler = (payload: unknown) => void

type ClientOptions = {
  url: string
}

type ClientCalls<P extends ProtocolDefinition> = {
  [K in keyof P["calls"] & string]: (
    input: InferCallInput<P["calls"][K]>,
  ) => Promise<InferCallOutput<P["calls"][K]>>
}

type ClientEvents<P extends ProtocolDefinition> = {
  [K in keyof P["events"] & string]: (
    handler: (payload: InferEventPayload<P["events"][K]>) => void,
  ) => () => void
}

type FaultlineClient = {
  call: ClientCalls<typeof protocol>
  on: ClientEvents<typeof protocol>
  connect: () => Promise<void>
  disconnect: () => void
}

const createBrowserClient = (options: ClientOptions): FaultlineClient => {
  let ws: WebSocket | null = null
  const pending = new Map<string, PendingCall>()
  const listeners = new Map<string, Set<EventHandler>>()

  const connect = (): Promise<void> =>
    new Promise((resolve, reject) => {
      ws = new WebSocket(options.url)

      ws.addEventListener("open", () => resolve())
      ws.addEventListener("error", () => reject(new Error("WebSocket connection failed")))

      ws.addEventListener("message", (event) => {
        const parsed = messageSchema.safeParse(JSON.parse(String(event.data)))
        if (!parsed.success) return

        const msg = parsed.data

        if (msg.type === "response") {
          const call = pending.get(msg.id)
          if (call) {
            pending.delete(msg.id)
            call.resolve(msg.result)
          }
        }

        if (msg.type === "error") {
          const call = pending.get(msg.id)
          if (call) {
            pending.delete(msg.id)
            call.reject(new Error(`${msg.error.code}: ${msg.error.message}`))
          }
        }

        if (msg.type === "event") {
          const handlers = listeners.get(msg.event)
          if (handlers) {
            for (const handler of handlers) {
              handler(msg.payload)
            }
          }
        }
      })
    })

  const disconnect = (): void => {
    if (ws) {
      ws.close()
      ws = null
    }

    for (const [, call] of pending) {
      call.reject(new Error("Client disconnected"))
    }
    pending.clear()
  }

  const sendCall = (method: string, params: unknown): Promise<unknown> =>
    new Promise((resolve, reject) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error("Not connected"))
        return
      }

      const id = crypto.randomUUID()
      pending.set(id, { resolve, reject })

      ws.send(JSON.stringify({ type: "call", id, method, params }))
    })

  const call = new Proxy({} as ClientCalls<typeof protocol>, {
    get: (_target, method: string) => (input: unknown) =>
      sendCall(method, input),
  })

  const on = new Proxy({} as ClientEvents<typeof protocol>, {
    get: (_target, event: string) => (handler: EventHandler) => {
      if (!listeners.has(event)) {
        listeners.set(event, new Set())
      }
      listeners.get(event)!.add(handler)

      return (): void => {
        listeners.get(event)?.delete(handler)
      }
    },
  })

  return { call, on, connect, disconnect }
}

export type { FaultlineClient, ClientOptions }
export { createBrowserClient }
