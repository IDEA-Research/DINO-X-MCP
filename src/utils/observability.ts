import { AsyncLocalStorage } from "async_hooks";

export interface RequestLogContext {
  requestId: string;
}

type LogFields = Record<string, unknown>;

const requestLogContext = new AsyncLocalStorage<RequestLogContext>();

function isObservabilityEnabled(context: RequestLogContext | undefined): boolean {
  if (context?.requestId) {
    return true;
  }

  return process.env.DINOX_MCP_OBSERVABILITY === "true";
}

function normalizeError(error: unknown): LogFields {
  if (error instanceof Error) {
    return {
      error_name: error.name,
      error_message: error.message,
    };
  }

  return {
    error_message: String(error),
  };
}

export function runWithRequestLogContext<T>(context: RequestLogContext, callback: () => T): T {
  return requestLogContext.run(context, callback);
}

export function getRequestId(): string | undefined {
  return requestLogContext.getStore()?.requestId;
}

export function logEvent(event: string, fields: LogFields = {}): void {
  const context = requestLogContext.getStore();
  if (!isObservabilityEnabled(context)) {
    return;
  }

  const payload = {
    level: "info",
    event,
    timestamp: new Date().toISOString(),
    ...(context?.requestId ? { request_id: context.requestId } : {}),
    ...fields,
  };

  console.error(JSON.stringify(payload));
}

export function logError(event: string, error: unknown, fields: LogFields = {}): void {
  logEvent(event, {
    ...fields,
    ...normalizeError(error),
    level: "error",
  });
}
