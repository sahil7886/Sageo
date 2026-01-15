import type { AgentCard, SendMessageRequest, Message, Task } from '@a2a-js/sdk';
import type { A2AClient } from './types.js';
import { SageoClient } from './sageo-client.js';
export declare class SageoA2AClientWrapper {
    private a2aClient;
    private sageoClient;
    private remoteAgentCard;
    private callerSageoId;
    constructor(a2aClient: A2AClient, sageoClient: SageoClient, remoteAgentCard: AgentCard, callerSageoId: string);
    sendMessage(request: SendMessageRequest): Promise<Task | Message>;
    getTask(taskId: string): Promise<Task>;
    private injectTraceMetadata;
}
//# sourceMappingURL=a2a-wrapper.d.ts.map