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
import type { SageoClient } from './sageo-client.js';
import { extractIntent, extractSageoMetadata, hashPayload, SAGEO_EXTENSION_URI } from './utils.js';
import type { SageoTraceMetadata } from './types.js';

type StreamEvent = Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent;

export class SageoRequestHandler implements A2ARequestHandler {
  private underlying: A2ARequestHandler;
  private sageoClient: SageoClient;

  constructor(underlying: A2ARequestHandler, sageoClient: SageoClient) {
    this.underlying = underlying;
    this.sageoClient = sageoClient;
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
    const trace = extractSageoMetadata(params.message);
    if (trace) {
      await this.logIncomingRequest(trace, params);
    }

    try {
      const response = await this.underlying.sendMessage(params, context);
      if (trace) {
        await this.logResponse(trace, response, 200n);
      }
      return response;
    } catch (error) {
      if (trace) {
        await this.logResponse(
          trace,
          { error: error instanceof Error ? error.message : String(error) },
          500n
        );
      }
      throw error;
    }
  }

  async *sendMessageStream(
    params: MessageSendParams,
    context?: ServerCallContext
  ): AsyncGenerator<StreamEvent, void, undefined> {
    const trace = extractSageoMetadata(params.message);
    if (trace) {
      await this.logIncomingRequest(trace, params);
    }

    let lastEvent: StreamEvent | null = null;
    try {
      for await (const event of this.underlying.sendMessageStream(params, context)) {
        lastEvent = event;
        yield event;
      }
      if (trace) {
        await this.logResponse(trace, lastEvent ?? { status: 'completed' }, 200n);
      }
    } catch (error) {
      if (trace) {
        await this.logResponse(
          trace,
          { error: error instanceof Error ? error.message : String(error) },
          500n
        );
      }
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
  ): Promise<void> {
    if (!trace.interaction_id || !trace.caller_sageo_id) {
      return;
    }

    await this.ensureInitialized();

    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    const requestHash = this.buildRequestHash(params);
    const message = params.message;

    try {
      await this.sageoClient.interaction.logRequest({
        interactionId: trace.interaction_id,
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
    } catch (error) {
      console.warn('Failed to log Sageo request on server:', error);
    }
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
}
