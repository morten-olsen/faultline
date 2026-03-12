import { z } from "zod";
import { callMessageSchema } from "@faultline/protocol";

import type { WebSocket } from "ws";
import type {
  ProtocolDefinition,
  InferCallInput,
  InferCallOutput,
  CallMessage,
  ResponseMessage,
  ErrorMessage,
} from "@faultline/protocol";
import type { Services } from "../services/services.js";

type CallContext = {
  services: Services;
  ws: WebSocket;
};

type CallHandler<TInput, TOutput> = (
  input: TInput,
  context: CallContext,
) => Promise<TOutput>;

type RouterHandlers<P extends ProtocolDefinition> = {
  [K in keyof P["calls"] & string]: CallHandler<
    InferCallInput<P["calls"][K]>,
    InferCallOutput<P["calls"][K]>
  >;
};

type Router<P extends ProtocolDefinition> = {
  handle: (raw: string, context: CallContext) => Promise<void>;
  handlers: RouterHandlers<P>;
};

const createRouter = <P extends ProtocolDefinition>(
  protocol: P,
  handlers: RouterHandlers<P>,
): Router<P> => {
  const handle = async (raw: string, context: CallContext): Promise<void> => {
    let msg: CallMessage;

    try {
      msg = callMessageSchema.parse(JSON.parse(raw));
    } catch {
      return;
    }

    const callDef = protocol.calls[msg.method];
    const handler = handlers[msg.method as keyof typeof handlers];

    if (!callDef || !handler) {
      const error: ErrorMessage = {
        type: "error",
        id: msg.id,
        error: {
          code: "METHOD_NOT_FOUND",
          message: `Unknown method: ${msg.method}`,
        },
      };
      context.ws.send(JSON.stringify(error));
      return;
    }

    try {
      const input = callDef.input.parse(msg.params);
      const result = await handler(input, context);
      const output = callDef.output.parse(result);

      const response: ResponseMessage = {
        type: "response",
        id: msg.id,
        result: output,
      };
      context.ws.send(JSON.stringify(response));
    } catch (err) {
      const error: ErrorMessage = {
        type: "error",
        id: msg.id,
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Unknown error",
        },
      };
      context.ws.send(JSON.stringify(error));
    }
  };

  return { handle, handlers };
};

export type { CallContext, CallHandler, RouterHandlers, Router };
export { createRouter };
