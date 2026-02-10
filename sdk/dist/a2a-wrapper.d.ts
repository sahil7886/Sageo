import type { AgentCard, MessageSendParams, Message, Task } from '@a2a-js/sdk';
import type { A2AClient } from './types.js';
import { SageoClient } from './sageo-client.js';
export declare class SageoA2AClientWrapper {
    private a2aClient;
    private sageoClient;
    private remoteAgentCard;
    private callerSageoId;
    private remoteSageoId?;
    private logTimeoutMs;
    constructor(a2aClient: A2AClient, sageoClient: SageoClient, remoteAgentCard: AgentCard, callerSageoId: string, remoteSageoId?: string);
    sendMessage(params: MessageSendParams): Promise<Task | Message>;
    getTask(taskId: string): Promise<Task>;
    private buildRequestHash;
    private sanitizeMessage;
    private injectTraceMetadata;
    private runWithTimeout;
}
//# sourceMappingURL=a2a-wrapper.d.ts.map