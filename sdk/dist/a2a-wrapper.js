import { hashPayload, extractIntent, extractSageoMetadata } from './utils.js';
import { SAGEO_EXTENSION_URI } from './config.js';
export class SageoA2AClientWrapper {
    a2aClient;
    sageoClient;
    remoteAgentCard;
    callerSageoId;
    remoteSageoId;
    logTimeoutMs;
    constructor(a2aClient, sageoClient, remoteAgentCard, callerSageoId, remoteSageoId) {
        this.a2aClient = a2aClient;
        this.sageoClient = sageoClient;
        this.remoteAgentCard = remoteAgentCard;
        this.callerSageoId = callerSageoId;
        this.remoteSageoId = remoteSageoId;
        const envTimeout = typeof process !== 'undefined'
            ? Number(process.env.SAGEO_LOG_TIMEOUT_MS || '')
            : NaN;
        this.logTimeoutMs = Number.isFinite(envTimeout) && envTimeout > 0
            ? envTimeout
            : 30000;
    }
    async sendMessage(params) {
        // Extract A2A metadata from message params
        const message = params.message;
        const existingTrace = extractSageoMetadata(message);
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
                const profileByUrl = await this.sageoClient.identity.getAgentByUrl(this.remoteAgentCard.url);
                if (profileByUrl) {
                    calleeSageoId = profileByUrl.sageo_id;
                }
                else {
                    // If not found by URL, agent may not be registered
                    throw new Error(`Agent with URL ${this.remoteAgentCard.url} not found in Sageo registry. Agent must be registered before interactions can be logged.`);
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to resolve remote agent address: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Create trace metadata (interaction_id will be set after logging)
        const traceMetadata = {
            conversation_id: existingTrace?.conversation_id || contextId,
            interaction_id: existingTrace?.interaction_id || '',
            caller_sageo_id: this.callerSageoId,
            callee_sageo_id: calleeSageoId,
            end_user: existingTrace?.end_user || this.sageoClient.getDefaultEndUserContext(),
            a2a: {
                contextId: existingTrace?.a2a?.contextId || contextId,
                taskId: existingTrace?.a2a?.taskId || taskId,
                messageId: existingTrace?.a2a?.messageId || messageId,
                method: 'message/send',
            },
            intent: existingTrace?.intent || intent,
            a2a_client_timestamp_ms: Date.now(),
        };
        // Inject trace metadata into request (before logging so it's included in hash)
        this.injectTraceMetadata(params, traceMetadata);
        // Log request to InteractionLogic BEFORE sending
        let interactionId = null;
        try {
            const requestTimestamp = BigInt(Math.floor(Date.now() / 1000));
            const loggedRequest = await this.runWithTimeout(this.sageoClient.interaction.logRequestWithTx({
                interactionId: traceMetadata.interaction_id || '',
                counterpartySageoId: calleeSageoId,
                isSender: true,
                requestHash,
                intent: traceMetadata.intent,
                timestamp: requestTimestamp,
                a2aContextId: contextId,
                a2aTaskId: taskId,
                a2aMessageId: messageId,
                endUserId: traceMetadata.end_user?.id || '',
                endUserSessionId: traceMetadata.end_user?.session_id || '',
            }), 'outgoing request');
            interactionId = loggedRequest?.interactionId || null;
            // Update trace metadata with real interaction ID
            if (interactionId) {
                traceMetadata.interaction_id = interactionId;
                this.injectTraceMetadata(params, traceMetadata);
            }
            if (loggedRequest?.txHash && interactionId) {
                await this.sageoClient.reportInteractionTxEvent({
                    interaction_id: interactionId,
                    tx_hash: loggedRequest.txHash,
                    event_type: 'request',
                    is_sender: true,
                    actor_sageo_id: this.callerSageoId,
                    counterparty_sageo_id: calleeSageoId,
                    a2a_context_id: contextId || undefined,
                    a2a_task_id: taskId || undefined,
                    a2a_message_id: messageId || undefined,
                    end_user_id: traceMetadata.end_user?.id || undefined,
                    end_user_session_id: traceMetadata.end_user?.session_id || undefined,
                    timestamp: Number(requestTimestamp),
                });
            }
        }
        catch (error) {
            // Log warning but continue with A2A call
            console.warn('Failed to log interaction to Sageo:', error);
        }
        // Send the A2A request
        try {
            const response = await this.a2aClient.sendMessage(params);
            if (interactionId) {
                const responseHash = hashPayload(response);
                const responseTimestamp = BigInt(Math.floor(Date.now() / 1000));
                const loggedResponse = await this.runWithTimeout(this.sageoClient.interaction.logResponseWithTx({
                    interactionId,
                    counterpartySageoId: calleeSageoId,
                    isSender: false,
                    responseHash,
                    statusCode: 200n,
                    timestamp: responseTimestamp,
                }), 'outgoing response');
                if (loggedResponse?.txHash) {
                    await this.sageoClient.reportInteractionTxEvent({
                        interaction_id: interactionId,
                        tx_hash: loggedResponse.txHash,
                        event_type: 'response',
                        is_sender: false,
                        actor_sageo_id: this.callerSageoId,
                        counterparty_sageo_id: calleeSageoId,
                        a2a_context_id: contextId || undefined,
                        a2a_task_id: taskId || undefined,
                        a2a_message_id: messageId || undefined,
                        end_user_id: traceMetadata.end_user?.id || undefined,
                        end_user_session_id: traceMetadata.end_user?.session_id || undefined,
                        status_code: 200,
                        timestamp: Number(responseTimestamp),
                    });
                }
            }
            return response;
        }
        catch (error) {
            if (interactionId) {
                const responseHash = hashPayload({
                    error: error instanceof Error ? error.message : String(error),
                });
                try {
                    const responseTimestamp = BigInt(Math.floor(Date.now() / 1000));
                    const loggedResponse = await this.runWithTimeout(this.sageoClient.interaction.logResponseWithTx({
                        interactionId,
                        counterpartySageoId: calleeSageoId,
                        isSender: false,
                        responseHash,
                        statusCode: 500n,
                        timestamp: responseTimestamp,
                    }), 'outgoing response (error)');
                    if (loggedResponse?.txHash) {
                        await this.sageoClient.reportInteractionTxEvent({
                            interaction_id: interactionId,
                            tx_hash: loggedResponse.txHash,
                            event_type: 'response',
                            is_sender: false,
                            actor_sageo_id: this.callerSageoId,
                            counterparty_sageo_id: calleeSageoId,
                            a2a_context_id: contextId || undefined,
                            a2a_task_id: taskId || undefined,
                            a2a_message_id: messageId || undefined,
                            end_user_id: traceMetadata.end_user?.id || undefined,
                            end_user_session_id: traceMetadata.end_user?.session_id || undefined,
                            status_code: 500,
                            timestamp: Number(responseTimestamp),
                        });
                    }
                }
                catch (logError) {
                    console.warn('Failed to log response to Sageo:', logError);
                }
            }
            throw error;
        }
    }
    async getTask(taskId) {
        return this.a2aClient.getTask(taskId);
    }
    buildRequestHash(params) {
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
    sanitizeMessage(message) {
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
    injectTraceMetadata(params, metadata) {
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
    async runWithTimeout(promise, label) {
        if (!this.logTimeoutMs || this.logTimeoutMs <= 0) {
            try {
                return await promise;
            }
            catch (error) {
                console.warn(`Sageo log ${label} failed:`, error);
                return null;
            }
        }
        let timeoutHandle;
        const timeoutPromise = new Promise((resolve) => {
            timeoutHandle = setTimeout(() => resolve(null), this.logTimeoutMs);
        });
        try {
            const result = await Promise.race([promise, timeoutPromise]);
            if (result === null) {
                console.warn(`Sageo log ${label} timed out after ${this.logTimeoutMs}ms`);
            }
            return result;
        }
        catch (error) {
            console.warn(`Sageo log ${label} failed:`, error);
            return null;
        }
        finally {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
        }
    }
}
//# sourceMappingURL=a2a-wrapper.js.map