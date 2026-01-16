// sdk/src/interaction.ts
import { Wallet, VoyageProvider, LogicDriver } from 'js-moi-sdk';
import {
  createProvider,
  createWallet,
  loadContract,
  getIdentifier,
} from './client.js';
import { normalizeIdentifier } from './utils.js';
import {
  SDKConfig,
  InteractionRecord,
  AgentInteractionStats,
  LogRequestInput,
  LogResponseInput,
  ListInteractionsInput,
  GetInteractionOutput,
  ListInteractionsOutput,
  GetStatsOutput,
} from './types.js';
import {
  ContractLoadError,
  SignerRequiredError,
  NotEnlistedError,
  InteractionNotFoundError,
  TransactionError,
  QueryError,
} from './errors.js';

export class SageoInteractionSDK {
  private provider: VoyageProvider;
  private wallet?: Wallet;
  private readDriver: LogicDriver;
  private writeDriver?: LogicDriver;
  private logicId: string;
  private static readonly STORAGE_NOT_FOUND = 'logic storage tree not found';

  private constructor(
    provider: VoyageProvider,
    wallet: Wallet | undefined,
    readDriver: LogicDriver,
    writeDriver: LogicDriver | undefined,
    logicId: string
  ) {
    this.provider = provider;
    this.wallet = wallet;
    this.readDriver = readDriver;
    this.writeDriver = writeDriver;
    this.logicId = logicId;
  }

  static async init(config: SDKConfig): Promise<SageoInteractionSDK> {
    const provider = await createProvider(config.rpcUrl);
    
    let wallet: Wallet | undefined;
    let writeDriver: LogicDriver | undefined;

    if (config.privateKey) {
      wallet = await createWallet(config.privateKey, provider);
      try {
        writeDriver = await loadContract(
          { logicId: config.logicId, manifest: config.manifest },
          wallet
        );
      } catch (error) {
        throw new ContractLoadError(config.logicId, error);
      }
    }

    let readDriver: LogicDriver;
    try {
      if (!wallet) {
        
        // Create a temporary wallet for read operations if no wallet provided
        wallet = await createWallet(config.privateKey || '', provider);
      }
      readDriver = await loadContract(
        { logicId: config.logicId, manifest: config.manifest },
        wallet
      );
    } catch (error) {
      throw new ContractLoadError(config.logicId, error);
    }

    return new SageoInteractionSDK(
      provider,
      wallet,
      readDriver,
      writeDriver,
      config.logicId
    );
  }

  private ensureSigner(): LogicDriver {
    if (!this.writeDriver || !this.wallet) {
      throw new SignerRequiredError('write operation');
    }
    return this.writeDriver;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'bigint') {
      return Number(value);
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private isStorageNotFound(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes(SageoInteractionSDK.STORAGE_NOT_FOUND);
  }

  private async readActorValue<T>(
    address: string,
    build: (builder: any) => any
  ): Promise<T> {
    if (!this.readDriver.ephemeralState) {
      throw new Error('Interaction logic does not expose actor state');
    }
    return this.readDriver.ephemeralState.get(address, build) as Promise<T>;
  }

  private async readInteractionRecord(
    address: string,
    index: number
  ): Promise<InteractionRecord> {
    const [
      interaction_id,
      caller_sageo_id,
      callee_sageo_id,
      request_hash,
      response_hash,
      intent,
      status_code,
      timestamp,
      a2a_context_id,
      a2a_task_id,
      a2a_message_id,
      end_user_id,
      end_user_session_id,
    ] = await Promise.all([
      this.readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('interaction_id')),
      this.readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('caller_sageo_id')),
      this.readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('callee_sageo_id')),
      this.readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('request_hash')),
      this.readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('response_hash')),
      this.readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('intent')),
      this.readActorValue<number>(address, (b) => b.entity('interactions').at(index).field('status_code')),
      this.readActorValue<number>(address, (b) => b.entity('interactions').at(index).field('timestamp')),
      this.readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('a2a_context_id')),
      this.readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('a2a_task_id')),
      this.readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('a2a_message_id')),
      this.readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('end_user_id')),
      this.readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('end_user_session_id')),
    ]);

    return this.parseRecord({
      interaction_id,
      caller_sageo_id,
      callee_sageo_id,
      request_hash,
      response_hash,
      intent,
      status_code: this.toNumber(status_code),
      timestamp: this.toNumber(timestamp),
      a2a_context_id,
      a2a_task_id,
      a2a_message_id,
      end_user_id,
      end_user_session_id,
    });
  }

  private async getActorInteractionById(
    address: string,
    interactionId: string
  ): Promise<InteractionRecord | null> {
    try {
      const totalValue = await this.readActorValue<number>(
        address,
        (b) => b.entity('interactions').length()
      );
      const total = this.toNumber(totalValue);
      for (let idx = 0; idx < total; idx += 1) {
        const currentId = await this.readActorValue<string>(
          address,
          (b) => b.entity('interactions').at(idx).field('interaction_id')
        );
        if (currentId === interactionId) {
          return this.readInteractionRecord(address, idx);
        }
      }
      return null;
    } catch (error) {
      if (this.isStorageNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  private async getActorInteractions(
    address: string,
    limit: bigint,
    offset: bigint
  ): Promise<ListInteractionsOutput> {
    try {
      const totalValue = await this.readActorValue<number>(
        address,
        (b) => b.entity('interactions').length()
      );
      const total = this.toNumber(totalValue);
      const offsetNum = Number(offset);
      if (offsetNum >= total) {
        return { records: [], total: BigInt(total) };
      }
      const count = Math.min(Number(limit), total - offsetNum);
      const records: InteractionRecord[] = [];
      for (let i = 0; i < count; i += 1) {
        const idx = total - offsetNum - 1 - i;
        records.push(await this.readInteractionRecord(address, idx));
      }
      return { records, total: BigInt(total) };
    } catch (error) {
      if (this.isStorageNotFound(error)) {
        return { records: [], total: 0n };
      }
      throw error;
    }
  }

  async enlist(sageoId: string): Promise<void> {
    const driver = this.ensureSigner();

    try {
      const ix = await driver.routines.Enlist(sageoId);
      
      // Handle different interaction object patterns
      if (!ix) {
        throw new TransactionError('Enlist returned null/undefined', undefined, new Error('Enlist returned null/undefined'));
      }

      if (typeof (ix as any).send === 'function') {
        // Prefer send() for dynamic writes to ensure a transaction is submitted
        const result = await (ix as any).send({ fuelPrice: 1, fuelLimit: 1000 });
        await result.wait();
      } else if (typeof (ix as any).wait === 'function') {
        // Fallback: direct wait pattern
        await (ix as any).wait();
      } else {
        throw new TransactionError('Enlist did not return a valid interaction object', undefined, new Error('Invalid interaction object'));
      }
    } catch (error) {
      const errorMsg = String(error);
      // Check if already enlisted (might be a revert or different error format)
      if (errorMsg.includes('already') || errorMsg.includes('enlisted')) {
        // Already enlisted - this is OK
        return;
      }
      throw new TransactionError(`Failed to enlist: ${sageoId}`, undefined, error);
    }
  }

  async logRequest(input: LogRequestInput): Promise<string> {
    const driver = this.ensureSigner();

    try {
      const ix = await driver.routines.LogRequest(
        input.interactionId,
        input.counterpartySageoId,
        input.isSender,
        input.requestHash,
        input.intent,
        input.timestamp,
        input.a2aContextId,
        input.a2aTaskId,
        input.a2aMessageId,
        input.endUserId,
        input.endUserSessionId
      );

      // Handle different interaction object patterns
      let receipt: any;
      if (!ix) {
        throw new TransactionError(
          'LogRequest returned null/undefined',
          undefined,
          new Error('LogRequest returned null/undefined')
        );
      }

      if (typeof (ix as any).send === 'function') {
        // Prefer send() for dynamic writes to ensure a transaction is submitted
        const result = await (ix as any).send({ fuelPrice: 1, fuelLimit: 2000 });
        receipt = await result.wait();
      } else if (typeof (ix as any).wait === 'function') {
        receipt = await (ix as any).wait();
      } else {
        const errorDetails = `Type: ${typeof ix}, keys: ${Object.keys(ix || {}).join(', ')}, hasWait: ${typeof (ix as any).wait}, hasSend: ${typeof (ix as any).send}`;
        throw new TransactionError(
          'LogRequest did not return a valid interaction object',
          undefined,
          new Error(`Expected interaction object with wait() or send() method, got: ${errorDetails}`)
        );
      }

      // Try to use interaction.result() method first (decodes POLO outputs)
      let interactionId: string | undefined;
      if (typeof (ix as any).result === 'function') {
        try {
          const decoded = await (ix as any).result();
          // decoded has { output: {...}, error: null } structure
          const resultData = decoded?.output ?? decoded;
          interactionId = resultData?.interaction_id ?? resultData?.result_interaction_id;
        } catch (resultError) {
          // Fall through to receipt extraction if result() fails
        }
      }

      // Extract interaction_id from receipt (try multiple locations)
      if (!interactionId) {
        // Check receipt.ix_operations[0].data first (most common location)
        const opData = receipt.ix_operations?.[0]?.data;
        interactionId =
          opData?.interaction_id ??
          opData?.result?.interaction_id ??
          opData?.result_interaction_id ??
          opData?.output?.interaction_id ??
          // Check receipt.outputs (POLO-encoded, might need decoding)
          receipt.outputs?.[0] ??
          // Check receipt top-level
          (receipt as any).interaction_id ??
          (receipt as any).result?.interaction_id ??
          (receipt as any).result?.result_interaction_id ??
          (receipt as any).output?.interaction_id ??
          (receipt as any).output?.result_interaction_id;
      }

      // If still not found, try extracting from POLO-encoded outputs
      if (!interactionId && receipt.ix_operations?.[0]?.data?.outputs) {
        const outputsHex = receipt.ix_operations[0].data.outputs;
        if (typeof outputsHex === 'string' && outputsHex.startsWith('0x')) {
          // Try to extract "ix_" pattern from hex
          try {
            const buffer = Buffer.from(outputsHex.slice(2), 'hex');
            const ixMarker = Buffer.from('ix_', 'utf-8');
            const ixIndex = buffer.indexOf(ixMarker);
            if (ixIndex !== -1) {
              let idEnd = ixIndex + 3; // "ix_"
              while (idEnd < buffer.length && buffer[idEnd] >= 0x30 && buffer[idEnd] <= 0x39) {
                idEnd++;
              }
              const extracted = buffer.slice(ixIndex, idEnd).toString('utf-8');
              if (extracted.startsWith('ix_')) {
                interactionId = extracted;
              }
            }
          } catch (e) {
            // Ignore extraction errors
          }
        }
      }

      if (!interactionId || typeof interactionId !== 'string') {
        // Log receipt structure for debugging
        console.error('Receipt structure:', JSON.stringify({
          hasOutputs: !!receipt.outputs,
          outputsLength: receipt.outputs?.length,
          hasIxOperations: !!receipt.ix_operations,
          ixOpsLength: receipt.ix_operations?.length,
          firstOpData: receipt.ix_operations?.[0]?.data ? Object.keys(receipt.ix_operations[0].data) : null,
        }, null, 2));
        throw new TransactionError(
          'No interaction_id returned from LogRequest',
          receipt.ix_hash || receipt.hash,
          receipt
        );
      }

      return interactionId;
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('not enlisted')) {
        const callerAddr = await getIdentifier(this.wallet!);
        throw new NotEnlistedError(callerAddr, 'caller');
      }
      throw new TransactionError('Failed to log request', undefined, error);
    }
  }

  async logResponse(input: LogResponseInput): Promise<void> {
    const driver = this.ensureSigner();

    try {
      const ix = await driver.routines.LogResponse(
        input.interactionId,
        input.counterpartySageoId,
        input.isSender,
        input.responseHash,
        input.statusCode,
        input.timestamp
      );

      // Handle different interaction object patterns
      if (!ix) {
        throw new TransactionError(
          'LogResponse returned null/undefined',
          undefined,
          new Error('LogResponse returned null/undefined')
        );
      }

      if (typeof (ix as any).send === 'function') {
        // Prefer send() for dynamic writes to ensure a transaction is submitted
        const result = await (ix as any).send({ fuelPrice: 1, fuelLimit: 2000 });
        await result.wait();
      } else if (typeof (ix as any).wait === 'function') {
        await (ix as any).wait();
      } else {
        const errorDetails = `Type: ${typeof ix}, keys: ${Object.keys(ix || {}).join(', ')}, hasWait: ${typeof (ix as any).wait}, hasSend: ${typeof (ix as any).send}`;
        throw new TransactionError(
          'LogResponse did not return a valid interaction object',
          undefined,
          new Error(`Expected interaction object with wait() or send() method, got: ${errorDetails}`)
        );
      }
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('Interaction not found')) {
        throw new InteractionNotFoundError(input.interactionId);
      }
      throw new TransactionError('Failed to log response', undefined, error);
    }
  }

  async getInteraction(
    agentIdentifier: string,
    interactionId: string
  ): Promise<GetInteractionOutput> {
    try {
      const normalizedIdentifier = normalizeIdentifier(agentIdentifier);
      const result = await this.readDriver.routines.GetInteraction(
        normalizedIdentifier,
        interactionId
      );
      const output = Array.isArray(result)
        ? { record: result[0], found: result[1] }
        : (result as any)?.output ?? result;
      const record = (output as any)?.record;
      const found = Boolean((output as any)?.found);

      if (found) {
        return {
          record: this.parseRecord(record),
          found,
        };
      }

      if (this.readDriver.ephemeralState) {
        const fallback = await this.getActorInteractionById(
          normalizedIdentifier,
          interactionId
        );
        if (fallback) {
          return { record: fallback, found: true };
        }
      }

      return { record: {} as InteractionRecord, found: false };
    } catch (error) {
      if (this.readDriver.ephemeralState) {
        const normalizedIdentifier = normalizeIdentifier(agentIdentifier);
        const fallback = await this.getActorInteractionById(
          normalizedIdentifier,
          interactionId
        );
        if (fallback) {
          return { record: fallback, found: true };
        }
        return { record: {} as InteractionRecord, found: false };
      }
      throw new QueryError(`Failed to get interaction: ${interactionId}`, error);
    }
  }

  async listInteractionsByAgent(
    input: ListInteractionsInput
  ): Promise<ListInteractionsOutput> {
    try {
      const normalizedIdentifier = normalizeIdentifier(input.agentIdentifier);
      const result = await this.readDriver.routines.ListInteractionsByAgent(
        normalizedIdentifier,
        input.limit,
        input.offset
      );

      const output = Array.isArray(result)
        ? { records: result[0], total: result[1] }
        : (result as any)?.output ?? result;
      const records = (output as any)?.records ?? [];
      const total = (output as any)?.total ?? 0;

      return {
        records: (records as any[]).map((r) => this.parseRecord(r)),
        total: BigInt(total),
      };
    } catch (error) {
      if (this.readDriver.ephemeralState) {
        const normalizedIdentifier = normalizeIdentifier(input.agentIdentifier);
        return this.getActorInteractions(
          normalizedIdentifier,
          input.limit,
          input.offset
        );
      }
      throw new QueryError(
        `Failed to list interactions for: ${input.agentIdentifier}`,
        error
      );
    }
  }

  async listInteractionsByAgentFromState(
    input: ListInteractionsInput
  ): Promise<ListInteractionsOutput> {
    const normalizedIdentifier = normalizeIdentifier(input.agentIdentifier);
    if (!this.readDriver.ephemeralState) {
      throw new QueryError(
        `Ephemeral state not available for: ${input.agentIdentifier}`,
        new Error('Interaction logic does not expose actor state')
      );
    }
    return this.getActorInteractions(
      normalizedIdentifier,
      input.limit,
      input.offset
    );
  }

  async getAgentStats(agentIdentifier: string): Promise<GetStatsOutput> {
    try {
      const normalizedIdentifier = normalizeIdentifier(agentIdentifier);
      const result = await this.readDriver.routines.GetAgentInteractionStats(
        normalizedIdentifier
      );
      const output = Array.isArray(result)
        ? { stats: result[0], found: result[1] }
        : (result as any)?.output ?? result;
      const stats = (output as any)?.stats;
      const found = Boolean((output as any)?.found);

      return {
        stats: found ? this.parseStats(stats) : ({} as AgentInteractionStats),
        found,
      };
    } catch (error) {
      throw new QueryError(`Failed to get stats for: ${agentIdentifier}`, error);
    }
  }

  async getWalletIdentifier(): Promise<string> {
    if (!this.wallet) {
      throw new SignerRequiredError('getWalletIdentifier');
    }
    return getIdentifier(this.wallet);
  }

  private parseRecord(raw: any): InteractionRecord {
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

  private parseStats(raw: any): AgentInteractionStats {
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
