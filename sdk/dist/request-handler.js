import { extractIntent, extractSageoMetadata, hashPayload, SAGEO_EXTENSION_URI } from './utils.js';
export class SageoRequestHandler {
    underlying;
    sageoClient;
    constructor(underlying, sageoClient) {
        this.underlying = underlying;
        this.sageoClient = sageoClient;
    }
    async getAgentCard() {
        return this.underlying.getAgentCard();
    }
    async getAuthenticatedExtendedAgentCard(context) {
        return this.underlying.getAuthenticatedExtendedAgentCard(context);
    }
    async sendMessage(params, context) {
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
        }
        catch (error) {
            if (trace) {
                await this.logResponse(trace, { error: error instanceof Error ? error.message : String(error) }, 500n);
            }
            throw error;
        }
    }
    async *sendMessageStream(params, context) {
        const trace = extractSageoMetadata(params.message);
        if (trace) {
            await this.logIncomingRequest(trace, params);
        }
        let lastEvent = null;
        try {
            for await (const event of this.underlying.sendMessageStream(params, context)) {
                lastEvent = event;
                yield event;
            }
            if (trace) {
                await this.logResponse(trace, lastEvent ?? { status: 'completed' }, 200n);
            }
        }
        catch (error) {
            if (trace) {
                await this.logResponse(trace, { error: error instanceof Error ? error.message : String(error) }, 500n);
            }
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
        }
        catch (error) {
            console.warn('Failed to log Sageo request on server:', error);
        }
    }
    async logResponse(trace, payload, statusCode) {
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
        }
        catch (error) {
            console.warn('Failed to log Sageo response on server:', error);
        }
    }
}
//# sourceMappingURL=request-handler.js.map