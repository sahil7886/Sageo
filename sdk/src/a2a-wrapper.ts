// sdk/src/a2a-wrapper.ts
import type {
  AgentCard,
  SendMessageRequest,
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
  }

  async sendMessage(request: SendMessageRequest): Promise<Task | Message> {

    // Extract A2A metadata from request
    const message = request.params.message;
    const contextId = message.contextId || '';
    const taskId = message.taskId || '';
    const messageId = message.messageId || '';

    // Generate intent from message
    const intent = extractIntent(message);

    // Hash the request payload
    const requestHash = hashPayload(request);

   
    let calleeSageoId = this.remoteSageoId ?? '';
    if (!calleeSageoId) {
      try {
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
      } catch (error) {
        throw new Error(
          `Failed to resolve remote agent address: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
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
    this.injectTraceMetadata(request, traceMetadata);

    // Log request to InteractionLogic BEFORE sending
    let interactionId: string | null = null;
    try {
      interactionId = await this.sageoClient.interaction.logRequest({
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
      });

      // Update trace metadata with real interaction ID
      traceMetadata.interaction_id = interactionId;
      this.injectTraceMetadata(request, traceMetadata);
    } catch (error) {

      // Log warning but continue with A2A call
      console.warn('Failed to log interaction to Sageo:', error);
    }

    // Send the A2A request
    try {
      const response = await this.a2aClient.sendMessage(request);
      if (interactionId) {
        const responseHash = hashPayload(response);
        await this.sageoClient.interaction.logResponse({
          interactionId,
          counterpartySageoId: calleeSageoId,
          isSender: false,
          responseHash,
          statusCode: 200n,
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
        });
      }
      return response;
    } catch (error) {
      if (interactionId) {
        const responseHash = hashPayload({
          error: error instanceof Error ? error.message : String(error),
        });
        try {
          await this.sageoClient.interaction.logResponse({
            interactionId,
            counterpartySageoId: calleeSageoId,
            isSender: false,
            responseHash,
            statusCode: 500n,
            timestamp: BigInt(Math.floor(Date.now() / 1000)),
          });
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

  private injectTraceMetadata(
    request: SendMessageRequest,
    metadata: SageoTraceMetadata
  ): void {
    
    // Add to metadata
    if (!request.params.message.metadata) {
      request.params.message.metadata = {};
    }
    request.params.message.metadata[SAGEO_EXTENSION_URI] = metadata;

    // Add extension URI to extensions array (per A2A extension spec)
    if (!request.params.message.extensions) {
      request.params.message.extensions = [];
    }
    if (!request.params.message.extensions.includes(SAGEO_EXTENSION_URI)) {
      request.params.message.extensions.push(SAGEO_EXTENSION_URI);
    }
  }
}
