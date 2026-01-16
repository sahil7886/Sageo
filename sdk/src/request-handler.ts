// sdk/src/request-handler.ts
import type {
  Message,
  MessageSendParams,
  AgentCard,
  Task,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  TaskQueryParams,
  TaskIdParams,
  TaskPushNotificationConfig,
  GetTaskPushNotificationConfigParams,
  ListTaskPushNotificationConfigParams,
  DeleteTaskPushNotificationConfigParams,
} from '@a2a-js/sdk';
import type { A2ARequestHandler, ServerCallContext } from '@a2a-js/sdk/server';
import { randomUUID } from 'crypto';
import type { SageoClient } from './sageo-client.js';
import { extractIntent, extractSageoMetadata, hashPayload, SAGEO_EXTENSION_URI } from './utils.js';
import type { SageoTraceMetadata } from './types.js';

type StreamEvent = Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent;

export class SageoRequestHandler implements A2ARequestHandler {
  private underlying: A2ARequestHandler;
  private sageoClient: SageoClient;
  private logTimeoutMs: number;

  constructor(underlying: A2ARequestHandler, sageoClient: SageoClient) {
    this.underlying = underlying;
    this.sageoClient = sageoClient;
    const envTimeout =
      typeof process !== 'undefined'
        ? Number(process.env.SAGEO_LOG_TIMEOUT_MS || '')
        : NaN;
    this.logTimeoutMs = Number.isFinite(envTimeout) && envTimeout > 0
      ? envTimeout
      : 30000;
  }

  async getAgentCard(): Promise<AgentCard> {
    return this.underlying.getAgentCard();
  }

  async getAuthenticatedExtendedAgentCard(context?: ServerCallContext): Promise<AgentCard> {
    return this.underlying.getAuthenticatedExtendedAgentCard(context);
  }

  async sendMessage(
    params: MessageSendParams,
    context?: ServerCallContext
  ): Promise<Message | Task> {
    let trace = extractSageoMetadata(params.message);
    if (!trace) {
      trace = this.buildFallbackTrace(params, context);
      this.injectTraceMetadata(params.message, trace);
    }

    const loggedInteractionId = await this.runWithTimeout(
      this.logIncomingRequest(trace, params),
      'incoming request'
    );
    if (!trace.interaction_id && loggedInteractionId) {
      trace.interaction_id = loggedInteractionId;
      this.injectTraceMetadata(params.message, trace);
    }

    try {
      const response = await this.underlying.sendMessage(params, context);
      await this.runWithTimeout(
        this.logResponse(trace, response, 200n),
        'response'
      );
      return response;
    } catch (error) {
      await this.runWithTimeout(
        this.logResponse(
          trace,
          { error: error instanceof Error ? error.message : String(error) },
          500n
        ),
        'response (error)'
      );
      throw error;
    }
  }

  async *sendMessageStream(
    params: MessageSendParams,
    context?: ServerCallContext
  ): AsyncGenerator<StreamEvent, void, undefined> {
    let trace = extractSageoMetadata(params.message);
    if (!trace) {
      trace = this.buildFallbackTrace(params, context);
      this.injectTraceMetadata(params.message, trace);
    }

    const loggedInteractionId = await this.runWithTimeout(
      this.logIncomingRequest(trace, params),
      'incoming request'
    );
    if (!trace.interaction_id && loggedInteractionId) {
      trace.interaction_id = loggedInteractionId;
      this.injectTraceMetadata(params.message, trace);
    }

    let lastEvent: StreamEvent | null = null;
    try {
      for await (const event of this.underlying.sendMessageStream(params, context)) {
        lastEvent = event;
        yield event;
      }
      await this.runWithTimeout(
        this.logResponse(trace, lastEvent ?? { status: 'completed' }, 200n),
        'response'
      );
    } catch (error) {
      await this.runWithTimeout(
        this.logResponse(
          trace,
          { error: error instanceof Error ? error.message : String(error) },
          500n
        ),
        'response (error)'
      );
      throw error;
    }
  }

  async getTask(params: TaskQueryParams, context?: ServerCallContext): Promise<Task> {
    return this.underlying.getTask(params, context);
  }

  async cancelTask(params: TaskIdParams, context?: ServerCallContext): Promise<Task> {
    return this.underlying.cancelTask(params, context);
  }

  async setTaskPushNotificationConfig(
    params: TaskPushNotificationConfig,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfig> {
    return this.underlying.setTaskPushNotificationConfig(params, context);
  }

  async getTaskPushNotificationConfig(
    params: TaskIdParams | GetTaskPushNotificationConfigParams,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfig> {
    return this.underlying.getTaskPushNotificationConfig(params, context);
  }

  async listTaskPushNotificationConfigs(
    params: ListTaskPushNotificationConfigParams,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfig[]> {
    return this.underlying.listTaskPushNotificationConfigs(params, context);
  }

  async deleteTaskPushNotificationConfig(
    params: DeleteTaskPushNotificationConfigParams,
    context?: ServerCallContext
  ): Promise<void> {
    return this.underlying.deleteTaskPushNotificationConfig(params, context);
  }

  async *resubscribe(
    params: TaskIdParams,
    context?: ServerCallContext
  ): AsyncGenerator<Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent, void, undefined> {
    for await (const event of this.underlying.resubscribe(params, context)) {
      yield event;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.sageoClient.mySageoIdValue) {
      await this.sageoClient.getMyProfile();
    }
  }

  private buildRequestHash(params: MessageSendParams): string {
    const sanitizedMessage = this.sanitizeMessage(params.message);
    const sanitizedParams = {
      ...params,
      message: sanitizedMessage,
    };

    return hashPayload({
      method: 'message/send',
      params: sanitizedParams,
    });
  }

  private sanitizeMessage(message: Message): Message {
    const sanitizedMetadata = message.metadata ? { ...message.metadata } : undefined;
    if (sanitizedMetadata && SAGEO_EXTENSION_URI in sanitizedMetadata) {
      delete sanitizedMetadata[SAGEO_EXTENSION_URI];
    }

    const sanitizedExtensions = Array.isArray(message.extensions)
      ? message.extensions.filter((uri) => uri !== SAGEO_EXTENSION_URI)
      : message.extensions;

    return {
      ...message,
      metadata: sanitizedMetadata,
      extensions: sanitizedExtensions,
    };
  }

  private async logIncomingRequest(
    trace: SageoTraceMetadata,
    params: MessageSendParams
  ): Promise<string | null> {
    if (!trace.caller_sageo_id) {
      return null;
    }

    await this.ensureInitialized();

    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    const requestHash = this.buildRequestHash(params);
    const message = params.message;

    try {
      const interactionId = await this.sageoClient.interaction.logRequest({
        interactionId: trace.interaction_id || '',
        counterpartySageoId: trace.caller_sageo_id,
        isSender: false,
        requestHash,
        intent: trace.intent || extractIntent(message),
        timestamp,
        a2aContextId: trace.a2a?.contextId ?? message.contextId ?? '',
        a2aTaskId: trace.a2a?.taskId ?? message.taskId ?? '',
        a2aMessageId: trace.a2a?.messageId ?? message.messageId ?? '',
        endUserId: trace.end_user?.id ?? '',
        endUserSessionId: trace.end_user?.session_id ?? '',
      });
      return interactionId;
    } catch (error) {
      console.warn('Failed to log Sageo request on server:', error);
    }
    return null;
  }

  private async logResponse(
    trace: SageoTraceMetadata,
    payload: unknown,
    statusCode: bigint
  ): Promise<void> {
    if (!trace.interaction_id || !trace.caller_sageo_id) {
      return;
    }

    await this.ensureInitialized();

    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    const responseHash = hashPayload(payload);

    try {
      await this.sageoClient.interaction.logResponse({
        interactionId: trace.interaction_id,
        counterpartySageoId: trace.caller_sageo_id,
        isSender: true,
        responseHash,
        statusCode,
        timestamp,
      });
    } catch (error) {
      console.warn('Failed to log Sageo response on server:', error);
    }
  }

  private buildFallbackTrace(
    params: MessageSendParams,
    context?: ServerCallContext
  ): SageoTraceMetadata {
    const message = params.message;
    const contextId =
      message.contextId || message.taskId || message.messageId || randomUUID();
    const messageId = message.messageId || '';
    const taskId = message.taskId || '';
    const userName = context?.user?.userName || '';
    const callerId = userName ? `external_${userName}` : `external_${contextId}`;
    const endUserId = 'user_1';
    const endUserSessionId = 'session_1';

    return {
      conversation_id: contextId,
      interaction_id: '',
      caller_sageo_id: callerId,
      callee_sageo_id: this.sageoClient.mySageoIdValue || '',
      end_user: { id: endUserId, session_id: endUserSessionId },
      a2a: {
        contextId,
        taskId,
        messageId,
        method: 'message/send',
      },
      intent: extractIntent(message),
      a2a_client_timestamp_ms: Date.now(),
    };
  }

  private injectTraceMetadata(message: Message, metadata: SageoTraceMetadata): void {
    if (!message.metadata) {
      message.metadata = {};
    }
    message.metadata[SAGEO_EXTENSION_URI] = metadata;

    if (!message.extensions) {
      message.extensions = [];
    }
    if (!message.extensions.includes(SAGEO_EXTENSION_URI)) {
      message.extensions.push(SAGEO_EXTENSION_URI);
    }
  }

  private async runWithTimeout<T>(
    promise: Promise<T>,
    label: string
  ): Promise<T | null> {
    if (!this.logTimeoutMs || this.logTimeoutMs <= 0) {
      try {
        return await promise;
      } catch (error) {
        console.warn(`Sageo log ${label} failed:`, error);
        return null;
      }
    }

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutHandle = setTimeout(() => resolve(null), this.logTimeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      if (result === null) {
        console.warn(`Sageo log ${label} timed out after ${this.logTimeoutMs}ms`);
      }
      return result as T | null;
    } catch (error) {
      console.warn(`Sageo log ${label} failed:`, error);
      return null;
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}
