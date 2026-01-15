import { createProvider, createWallet, loadContract, getIdentifier, } from './client.js';
import { normalizeIdentifier } from './utils.js';
import { ContractLoadError, SignerRequiredError, NotEnlistedError, InteractionNotFoundError, TransactionError, QueryError, } from './errors.js';
export class SageoInteractionSDK {
    provider;
    wallet;
    readDriver;
    writeDriver;
    logicId;
    constructor(provider, wallet, readDriver, writeDriver, logicId) {
        this.provider = provider;
        this.wallet = wallet;
        this.readDriver = readDriver;
        this.writeDriver = writeDriver;
        this.logicId = logicId;
    }
    static async init(config) {
        const provider = await createProvider();
        let wallet;
        let writeDriver;
        if (config.privateKey) {
            wallet = await createWallet(config.privateKey, provider);
            try {
                writeDriver = await loadContract({ logicId: config.logicId, manifest: config.manifest }, wallet);
            }
            catch (error) {
                throw new ContractLoadError(config.logicId, error);
            }
        }
        let readDriver;
        try {
            if (!wallet) {
                // Create a temporary wallet for read operations if no wallet provided
                wallet = await createWallet(config.privateKey || '', provider);
            }
            readDriver = await loadContract({ logicId: config.logicId, manifest: config.manifest }, wallet);
        }
        catch (error) {
            throw new ContractLoadError(config.logicId, error);
        }
        return new SageoInteractionSDK(provider, wallet, readDriver, writeDriver, config.logicId);
    }
    ensureSigner() {
        if (!this.writeDriver || !this.wallet) {
            throw new SignerRequiredError('write operation');
        }
        return this.writeDriver;
    }
    async enlist(sageoId) {
        const driver = this.ensureSigner();
        try {
            const ix = await driver.routines.Enlist(sageoId);
            const result = await ix.send({ fuelPrice: 1, fuelLimit: 1000 });
            await result.wait();
        }
        catch (error) {
            throw new TransactionError(`Failed to enlist: ${sageoId}`, undefined, error);
        }
    }
    async logRequest(input) {
        const driver = this.ensureSigner();
        try {
            const ix = await driver.routines.LogRequest(input.interactionId, input.counterpartySageoId, input.isSender, input.requestHash, input.intent, input.timestamp, input.a2aContextId, input.a2aTaskId, input.a2aMessageId, input.endUserId, input.endUserSessionId);
            const result = await ix.send({ fuelPrice: 1, fuelLimit: 2000 });
            const receipt = await result.wait();
            // Extract interaction_id from receipt (try multiple locations)
            const interactionId = receipt.outputs?.[0] ??
                receipt.interaction_id ??
                receipt.result?.interaction_id ??
                receipt.result?.result_interaction_id ??
                receipt.output?.interaction_id ??
                receipt.output?.result_interaction_id ??
                receipt.ix_operations?.[0]?.data?.interaction_id ??
                receipt.ix_operations?.[0]?.data?.result?.interaction_id;
            if (!interactionId || typeof interactionId !== 'string') {
                throw new TransactionError('No interaction_id returned from LogRequest', receipt.hash, receipt);
            }
            return interactionId;
        }
        catch (error) {
            const errorMsg = String(error);
            if (errorMsg.includes('not enlisted')) {
                const callerAddr = await getIdentifier(this.wallet);
                throw new NotEnlistedError(callerAddr, 'caller');
            }
            throw new TransactionError('Failed to log request', undefined, error);
        }
    }
    async logResponse(input) {
        const driver = this.ensureSigner();
        try {
            const ix = await driver.routines.LogResponse(input.interactionId, input.counterpartySageoId, input.isSender, input.responseHash, input.statusCode, input.timestamp);
            const result = await ix.send({ fuelPrice: 1, fuelLimit: 2000 });
            await result.wait();
        }
        catch (error) {
            const errorMsg = String(error);
            if (errorMsg.includes('Interaction not found')) {
                throw new InteractionNotFoundError(input.interactionId);
            }
            throw new TransactionError('Failed to log response', undefined, error);
        }
    }
    async getInteraction(agentIdentifier, interactionId) {
        try {
            const normalizedIdentifier = normalizeIdentifier(agentIdentifier);
            const result = await this.readDriver.routines.GetInteraction(normalizedIdentifier, interactionId);
            const output = Array.isArray(result)
                ? { record: result[0], found: result[1] }
                : result?.output ?? result;
            const record = output?.record;
            const found = Boolean(output?.found);
            return {
                record: found ? this.parseRecord(record) : {},
                found,
            };
        }
        catch (error) {
            throw new QueryError(`Failed to get interaction: ${interactionId}`, error);
        }
    }
    async listInteractionsByAgent(input) {
        try {
            const normalizedIdentifier = normalizeIdentifier(input.agentIdentifier);
            const result = await this.readDriver.routines.ListInteractionsByAgent(normalizedIdentifier, input.limit, input.offset);
            const output = Array.isArray(result)
                ? { records: result[0], total: result[1] }
                : result?.output ?? result;
            const records = output?.records ?? [];
            const total = output?.total ?? 0;
            return {
                records: records.map((r) => this.parseRecord(r)),
                total: BigInt(total),
            };
        }
        catch (error) {
            throw new QueryError(`Failed to list interactions for: ${input.agentIdentifier}`, error);
        }
    }
    async getAgentStats(agentIdentifier) {
        try {
            const normalizedIdentifier = normalizeIdentifier(agentIdentifier);
            const result = await this.readDriver.routines.GetAgentInteractionStats(normalizedIdentifier);
            const output = Array.isArray(result)
                ? { stats: result[0], found: result[1] }
                : result?.output ?? result;
            const stats = output?.stats;
            const found = Boolean(output?.found);
            return {
                stats: found ? this.parseStats(stats) : {},
                found,
            };
        }
        catch (error) {
            throw new QueryError(`Failed to get stats for: ${agentIdentifier}`, error);
        }
    }
    async getWalletIdentifier() {
        if (!this.wallet) {
            throw new SignerRequiredError('getWalletIdentifier');
        }
        return getIdentifier(this.wallet);
    }
    parseRecord(raw) {
        return {
            interaction_id: String(raw.interaction_id || ''),
            caller_sageo_id: String(raw.caller_sageo_id || ''),
            callee_sageo_id: String(raw.callee_sageo_id || ''),
            request_hash: String(raw.request_hash || ''),
            response_hash: String(raw.response_hash || ''),
            intent: String(raw.intent || ''),
            status_code: BigInt(raw.status_code || 0),
            timestamp: BigInt(raw.timestamp || 0),
            a2a_context_id: String(raw.a2a_context_id || ''),
            a2a_task_id: String(raw.a2a_task_id || ''),
            a2a_message_id: String(raw.a2a_message_id || ''),
            end_user_id: String(raw.end_user_id || ''),
            end_user_session_id: String(raw.end_user_session_id || ''),
        };
    }
    parseStats(raw) {
        return {
            total_requests_sent: BigInt(raw.total_requests_sent || 0),
            total_requests_received: BigInt(raw.total_requests_received || 0),
            total_responses_sent: BigInt(raw.total_responses_sent || 0),
            success_count: BigInt(raw.success_count || 0),
            unique_counterparties: BigInt(raw.unique_counterparties || 0),
            last_interaction_at: BigInt(raw.last_interaction_at || 0),
        };
    }
}
//# sourceMappingURL=interaction.js.map