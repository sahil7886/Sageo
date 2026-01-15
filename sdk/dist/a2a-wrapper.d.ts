import type { AgentCard, SendMessageRequest, Message, Task } from '@a2a-js/sdk';
import type { A2AClient } from './types.js';
import { SageoClient } from './sageo-client.js';
export declare class SageoA2AClientWrapper {
    private a2aClient;
    private sageoClient;
    private remoteAgentCard;
    private callerSageoId;
    constructor(a2aClient: A2AClient, sageoClient: SageoClient, remoteAgentCard: AgentCard, callerSageoId: string);
    /**
     * Send a message with automatic Sageo logging
     */
    sendMessage(request: SendMessageRequest): Promise<Task | Message>;
    /**
     * Get task by ID (passthrough, no logging)
     */
    getTask(taskId: string): Promise<Task>;
    /**
     * Inject SageoTraceMetadata into request
     */
    private injectTraceMetadata;
}
//# sourceMappingURL=a2a-wrapper.d.ts.map