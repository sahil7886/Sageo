// sdk/src/a2a-wrapper.ts
import type {
  AgentCard,
  MessageSendParams,
  Message,
  Task,
} from '@a2a-js/sdk';
import type { A2AClient } from './types.js';
import { SageoClient } from './sageo-client.js';
import { hashPayload, extractIntent } from './utils.js';
import { SAGEO_EXTENSION_URI } from './config.js';
import type { SageoTraceMetadata } from './types.js';

export class SageoA2AClientWrapper {
  private a2aClient: A2AClient;
  private sageoClient: SageoClient;
  private remoteAgentCard: AgentCard;
  private callerSageoId: string;
  private remoteSageoId?: string;
  private logTimeoutMs: number;

  constructor(
    a2aClient: A2AClient,
    sageoClient: SageoClient,
    remoteAgentCard: AgentCard,
    callerSageoId: string,
    remoteSageoId?: string
  ) {
    this.a2aClient = a2aClient;
    this.sageoClient = sageoClient;
    this.remoteAgentCard = remoteAgentCard;
    this.callerSageoId = callerSageoId;
    this.remoteSageoId = remoteSageoId;
    const envTimeout =
      typeof process !== 'undefined'
        ? Number(process.env.SAGEO_LOG_TIMEOUT_MS || '')
        : NaN;
    this.logTimeoutMs = Number.isFinite(envTimeout) && envTimeout > 0
      ? envTimeout
      : 30000;
  }

  async sendMessage(params: MessageSendParams): Promise<Task | Message> {

    // Extract A2A metadata from message params
    const message = params.message;
    const contextId = message.contextId || '';
    const taskId = message.taskId || '';
    const messageId = message.messageId || '';

    // Generate intent from message
    const intent = extractIntent(message);

    // Hash the request payload
    const requestHash = this.buildRequestHash(params);

   
    let calleeSageoId = this.remoteSageoId || '';
    try {

      if (!calleeSageoId) {
        // Try to find agent by URL
        const profileByUrl = await this.sageoClient.identity.getAgentByUrl(
          this.remoteAgentCard.url
        );
        if (profileByUrl) {
          calleeSageoId = profileByUrl.sageo_id;
        } else {

          // If not found by URL, agent may not be registered
          throw new Error(
            `Agent with URL ${this.remoteAgentCard.url} not found in Sageo registry. Agent must be registered before interactions can be logged.`
          );
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to resolve remote agent address: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Create trace metadata (interaction_id will be set after logging)
    const traceMetadata: SageoTraceMetadata = {
      conversation_id: contextId,
      interaction_id: '',
      caller_sageo_id: this.callerSageoId,
      callee_sageo_id: calleeSageoId,
      a2a: {
        contextId,
        taskId,
        messageId,
        method: 'message/send',
      },
      intent,
      a2a_client_timestamp_ms: Date.now(),
    };

    // Inject trace metadata into request (before logging so it's included in hash)
    this.injectTraceMetadata(params, traceMetadata);

    // Log request to InteractionLogic BEFORE sending
    let interactionId: string | null = null;
    try {
      interactionId = await this.runWithTimeout(
        this.sageoClient.interaction.logRequest({
          interactionId: '',
          counterpartySageoId: calleeSageoId,
          isSender: true,
          requestHash,
          intent,
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
          a2aContextId: contextId,
          a2aTaskId: taskId,
          a2aMessageId: messageId,
          endUserId: traceMetadata.end_user?.id || '',
          endUserSessionId: traceMetadata.end_user?.session_id || '',
        }),
        'outgoing request'
      );

      // Update trace metadata with real interaction ID
      if (interactionId) {
        traceMetadata.interaction_id = interactionId;
        this.injectTraceMetadata(params, traceMetadata);
      }
    } catch (error) {

      // Log warning but continue with A2A call
      console.warn('Failed to log interaction to Sageo:', error);
    }

    // Send the A2A request
    try {
      const response = await this.a2aClient.sendMessage(params);
      if (interactionId) {
        const responseHash = hashPayload(response);
        await this.runWithTimeout(
          this.sageoClient.interaction.logResponse({
            interactionId,
            counterpartySageoId: calleeSageoId,
            isSender: false,
            responseHash,
            statusCode: 200n,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
          }),
          'outgoing response'
        );
      }
      return response;
    } catch (error) {
      if (interactionId) {
        const responseHash = hashPayload({
          error: error instanceof Error ? error.message : String(error),
        });
        try {
          await this.runWithTimeout(
            this.sageoClient.interaction.logResponse({
              interactionId,
              counterpartySageoId: calleeSageoId,
              isSender: false,
              responseHash,
              statusCode: 500n,
              timestamp: BigInt(Math.floor(Date.now() / 1000)),
            }),
            'outgoing response (error)'
          );
        } catch (logError) {
          console.warn('Failed to log response to Sageo:', logError);
        }
      }
      throw error;
    }
  }

  async getTask(taskId: string): Promise<Task> {
    return this.a2aClient.getTask(taskId);
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

  private injectTraceMetadata(
    params: MessageSendParams,
    metadata: SageoTraceMetadata
  ): void {
    
    // Add to metadata
    if (!params.message.metadata) {
      params.message.metadata = {};
    }
    params.message.metadata[SAGEO_EXTENSION_URI] = metadata;

    // Add extension URI to extensions array (per A2A extension spec)
    if (!params.message.extensions) {
      params.message.extensions = [];
    }
    if (!params.message.extensions.includes(SAGEO_EXTENSION_URI)) {
      params.message.extensions.push(SAGEO_EXTENSION_URI);
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
