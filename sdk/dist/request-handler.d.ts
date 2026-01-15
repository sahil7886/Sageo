import type { Message, MessageSendParams, AgentCard, Task, TaskStatusUpdateEvent, TaskArtifactUpdateEvent, TaskQueryParams, TaskIdParams, TaskPushNotificationConfig, GetTaskPushNotificationConfigParams, ListTaskPushNotificationConfigParams, DeleteTaskPushNotificationConfigParams } from '@a2a-js/sdk';
import type { A2ARequestHandler, ServerCallContext } from '@a2a-js/sdk/server';
import type { SageoClient } from './sageo-client.js';
type StreamEvent = Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
export declare class SageoRequestHandler implements A2ARequestHandler {
    private underlying;
    private sageoClient;
    constructor(underlying: A2ARequestHandler, sageoClient: SageoClient);
    getAgentCard(): Promise<AgentCard>;
    getAuthenticatedExtendedAgentCard(context?: ServerCallContext): Promise<AgentCard>;
    sendMessage(params: MessageSendParams, context?: ServerCallContext): Promise<Message | Task>;
    sendMessageStream(params: MessageSendParams, context?: ServerCallContext): AsyncGenerator<StreamEvent, void, undefined>;
    getTask(params: TaskQueryParams, context?: ServerCallContext): Promise<Task>;
    cancelTask(params: TaskIdParams, context?: ServerCallContext): Promise<Task>;
    setTaskPushNotificationConfig(params: TaskPushNotificationConfig, context?: ServerCallContext): Promise<TaskPushNotificationConfig>;
    getTaskPushNotificationConfig(params: TaskIdParams | GetTaskPushNotificationConfigParams, context?: ServerCallContext): Promise<TaskPushNotificationConfig>;
    listTaskPushNotificationConfigs(params: ListTaskPushNotificationConfigParams, context?: ServerCallContext): Promise<TaskPushNotificationConfig[]>;
    deleteTaskPushNotificationConfig(params: DeleteTaskPushNotificationConfigParams, context?: ServerCallContext): Promise<void>;
    resubscribe(params: TaskIdParams, context?: ServerCallContext): AsyncGenerator<Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent, void, undefined>;
    private ensureInitialized;
    private buildRequestHash;
    private sanitizeMessage;
    private logIncomingRequest;
    private logResponse;
}
export {};
//# sourceMappingURL=request-handler.d.ts.map