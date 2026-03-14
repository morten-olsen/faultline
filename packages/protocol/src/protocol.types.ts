import { z } from 'zod';

type CallDefinition<TInput extends z.ZodType = z.ZodType, TOutput extends z.ZodType = z.ZodType> = {
  input: TInput;
  output: TOutput;
};

type EventDefinition<TPayload extends z.ZodType = z.ZodType> = {
  payload: TPayload;
};

type ProtocolDefinition = {
  calls: Record<string, CallDefinition>;
  events: Record<string, EventDefinition>;
};

type InferCallInput<T extends CallDefinition> = z.infer<T['input']>;
type InferCallOutput<T extends CallDefinition> = z.infer<T['output']>;
type InferEventPayload<T extends EventDefinition> = z.infer<T['payload']>;

const defineProtocol = <T extends ProtocolDefinition>(protocol: T): T => protocol;

export type { CallDefinition, EventDefinition, ProtocolDefinition, InferCallInput, InferCallOutput, InferEventPayload };
export { defineProtocol };
