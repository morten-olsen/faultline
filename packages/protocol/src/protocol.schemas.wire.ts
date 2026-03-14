import { z } from 'zod';

// --- Wire message envelopes ---

const callMessageSchema = z.object({
  type: z.literal('call'),
  id: z.string(),
  method: z.string(),
  params: z.unknown(),
});

type CallMessage = z.infer<typeof callMessageSchema>;

const responseMessageSchema = z.object({
  type: z.literal('response'),
  id: z.string(),
  result: z.unknown(),
});

type ResponseMessage = z.infer<typeof responseMessageSchema>;

const errorMessageSchema = z.object({
  type: z.literal('error'),
  id: z.string(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

type ErrorMessage = z.infer<typeof errorMessageSchema>;

const eventMessageSchema = z.object({
  type: z.literal('event'),
  event: z.string(),
  payload: z.unknown(),
});

type EventMessage = z.infer<typeof eventMessageSchema>;

const messageSchema = z.discriminatedUnion('type', [
  callMessageSchema,
  responseMessageSchema,
  errorMessageSchema,
  eventMessageSchema,
]);

type Message = z.infer<typeof messageSchema>;

export type { CallMessage, ResponseMessage, ErrorMessage, EventMessage, Message };
export { callMessageSchema, responseMessageSchema, errorMessageSchema, eventMessageSchema, messageSchema };
