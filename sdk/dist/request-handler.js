import { randomUUID } from 'crypto';
import { extractIntent, extractSageoMetadata, hashPayload, SAGEO_EXTENSION_URI } from './utils.js';
export class SageoRequestHandler {
    underlying;
    sageoClient;
    logTimeoutMs;
    constructor(underlying, sageoClient) {
        this.underlying = underlying;
        this.sageoClient = sageoClient;
        const envTimeout = typeof process !== 'undefined'
            ? Number(process.env.SAGEO_LOG_TIMEOUT_MS || '')
            : NaN;
        this.logTimeoutMs = Number.isFinite(envTimeout) && envTimeout > 0
            ? envTimeout
            : 30000;
    }
    async getAgentCard() {
        return this.underlying.getAgentCard();
    }
    async getAuthenticatedExtendedAgentCard(context) {
        return this.underlying.getAuthenticatedExtendedAgentCard(context);
    }
    async sendMessage(params, context) {
        let trace = extractSageoMetadata(params.message);
        if (!trace) {
            trace = this.buildFallbackTrace(params, context);
            this.injectTraceMetadata(params.message, trace);
        }
        const loggedInteractionId = await this.runWithTimeout(this.logIncomingRequest(trace, params), 'incoming request');
        if (!trace.interaction_id && loggedInteractionId?.interactionId) {
            trace.interaction_id = loggedInteractionId.interactionId;
            this.injectTraceMetadata(params.message, trace);
        }
        try {
            const response = await this.underlying.sendMessage(params, context);
            await this.runWithTimeout(this.logResponse(trace, response, 200n), 'response');
            return response;
        }
        catch (error) {
            await this.runWithTimeout(this.logResponse(trace, { error: error instanceof Error ? error.message : String(error) }, 500n), 'response (error)');
            throw error;
        }
    }
    async *sendMessageStream(params, context) {
        let trace = extractSageoMetadata(params.message);
        if (!trace) {
            trace = this.buildFallbackTrace(params, context);
            this.injectTraceMetadata(params.message, trace);
        }
        const loggedInteractionId = await this.runWithTimeout(this.logIncomingRequest(trace, params), 'incoming request');
        if (!trace.interaction_id && loggedInteractionId?.interactionId) {
            trace.interaction_id = loggedInteractionId.interactionId;
            this.injectTraceMetadata(params.message, trace);
        }
        let lastEvent = null;
        try {
            for await (const event of this.underlying.sendMessageStream(params, context)) {
                lastEvent = event;
                yield event;
            }
            await this.runWithTimeout(this.logResponse(trace, lastEvent ?? { status: 'completed' }, 200n), 'response');
        }
        catch (error) {
            await this.runWithTimeout(this.logResponse(trace, { error: error instanceof Error ? error.message : String(error) }, 500n), 'response (error)');
            throw error;
        }
    }
    async getTask(params, context) {
        return this.underlying.getTask(params, context);
    }
    async cancelTask(params, context) {
        return this.underlying.cancelTask(params, context);
    }
    async setTaskPushNotificationConfig(params, context) {
        return this.underlying.setTaskPushNotificationConfig(params, context);
    }
    async getTaskPushNotificationConfig(params, context) {
        return this.underlying.getTaskPushNotificationConfig(params, context);
    }
    async listTaskPushNotificationConfigs(params, context) {
        return this.underlying.listTaskPushNotificationConfigs(params, context);
    }
    async deleteTaskPushNotificationConfig(params, context) {
        return this.underlying.deleteTaskPushNotificationConfig(params, context);
    }
    async *resubscribe(params, context) {
        for await (const event of this.underlying.resubscribe(params, context)) {
            yield event;
        }
    }
    async ensureInitialized() {
        if (!this.sageoClient.mySageoIdValue) {
            await this.sageoClient.getMyProfile();
        }
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
    async logIncomingRequest(trace, params) {
        if (!trace.caller_sageo_id) {
            return null;
        }
        await this.ensureInitialized();
        const timestamp = BigInt(Math.floor(Date.now() / 1000));
        const requestHash = this.buildRequestHash(params);
        const message = params.message;
        try {
            const loggedRequest = await this.sageoClient.interaction.logRequestWithTx({
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
            if (loggedRequest.txHash) {
                await this.sageoClient.reportInteractionTxEvent({
                    interaction_id: loggedRequest.interactionId,
                    tx_hash: loggedRequest.txHash,
                    event_type: 'request',
                    is_sender: false,
                    actor_sageo_id: this.sageoClient.mySageoIdValue || '',
                    counterparty_sageo_id: trace.caller_sageo_id,
                    a2a_context_id: trace.a2a?.contextId ?? message.contextId ?? undefined,
                    a2a_task_id: trace.a2a?.taskId ?? message.taskId ?? undefined,
                    a2a_message_id: trace.a2a?.messageId ?? message.messageId ?? undefined,
                    end_user_id: trace.end_user?.id ?? undefined,
                    end_user_session_id: trace.end_user?.session_id ?? undefined,
                    timestamp: Number(timestamp),
                });
            }
            return {
                interactionId: loggedRequest.interactionId,
                txHash: loggedRequest.txHash,
                timestamp: Number(timestamp),
            };
        }
        catch (error) {
            console.warn('Failed to log Sageo request on server:', error);
        }
        return null;
    }
    async logResponse(trace, payload, statusCode) {
        if (!trace.interaction_id || !trace.caller_sageo_id) {
            return;
        }
        await this.ensureInitialized();
        const timestamp = BigInt(Math.floor(Date.now() / 1000));
        const responseHash = hashPayload(payload);
        try {
            const loggedResponse = await this.sageoClient.interaction.logResponseWithTx({
                interactionId: trace.interaction_id,
                counterpartySageoId: trace.caller_sageo_id,
                isSender: true,
                responseHash,
                statusCode,
                timestamp,
            });
            if (loggedResponse.txHash) {
                await this.sageoClient.reportInteractionTxEvent({
                    interaction_id: trace.interaction_id,
                    tx_hash: loggedResponse.txHash,
                    event_type: 'response',
                    is_sender: true,
                    actor_sageo_id: this.sageoClient.mySageoIdValue || '',
                    counterparty_sageo_id: trace.caller_sageo_id,
                    a2a_context_id: trace.a2a?.contextId ?? undefined,
                    a2a_task_id: trace.a2a?.taskId ?? undefined,
                    a2a_message_id: trace.a2a?.messageId ?? undefined,
                    end_user_id: trace.end_user?.id ?? undefined,
                    end_user_session_id: trace.end_user?.session_id ?? undefined,
                    status_code: Number(statusCode),
                    timestamp: Number(timestamp),
                });
            }
        }
        catch (error) {
            console.warn('Failed to log Sageo response on server:', error);
        }
    }
    buildFallbackTrace(params, context) {
        const message = params.message;
        const contextId = message.contextId || message.taskId || message.messageId || randomUUID();
        const messageId = message.messageId || '';
        const taskId = message.taskId || '';
        const userName = context?.user?.userName || '';
        const callerId = userName ? `external_${userName}` : `external_${contextId}`;
        const defaultEndUser = this.sageoClient.getDefaultEndUserContext();
        const endUserId = defaultEndUser?.id || userName || '';
        const endUserSessionId = defaultEndUser?.session_id || '';
        return {
            conversation_id: contextId,
            interaction_id: '',
            caller_sageo_id: callerId,
            callee_sageo_id: this.sageoClient.mySageoIdValue || '',
            end_user: endUserId ? { id: endUserId, session_id: endUserSessionId } : undefined,
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
    injectTraceMetadata(message, metadata) {
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
//# sourceMappingURL=request-handler.js.map