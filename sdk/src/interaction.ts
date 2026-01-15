// sdk/src/interaction.ts
import { Wallet, VoyageProvider, LogicDriver } from 'js-moi-sdk';
import {
  createProvider,
  createWallet,
  loadContract,
  getIdentifier,
} from './client.js';
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

  async enlist(sageoId: string): Promise<void> {
    const driver = this.ensureSigner();

    try {
      const ix = await driver.routines.Enlist(sageoId);
      const result = await ix.send({ fuelPrice: 1, fuelLimit: 1000 });
      await result.wait();
    } catch (error) {
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

      const result = await ix.send({ fuelPrice: 1, fuelLimit: 2000 });
      const receipt = await result.wait();

      // Extract interaction_id from receipt (try multiple locations)
      const interactionId =
        receipt.outputs?.[0] ??
        (receipt as any).interaction_id ??
        (receipt as any).result?.interaction_id ??
        (receipt as any).result?.result_interaction_id ??
        (receipt as any).output?.interaction_id ??
        (receipt as any).output?.result_interaction_id ??
        (receipt as any).ix_operations?.[0]?.data?.interaction_id ??
        (receipt as any).ix_operations?.[0]?.data?.result?.interaction_id;

      if (!interactionId || typeof interactionId !== 'string') {
        throw new TransactionError(
          'No interaction_id returned from LogRequest',
          receipt.hash,
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

      const result = await ix.send({ fuelPrice: 1, fuelLimit: 2000 });
      await result.wait();
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
      const result = await this.readDriver.routines.GetInteraction(
        agentIdentifier,
        interactionId
      );
      const [record, found] = result;

      return {
        record: found ? this.parseRecord(record) : ({} as InteractionRecord),
        found: Boolean(found),
      };
    } catch (error) {
      throw new QueryError(
        `Failed to get interaction: ${interactionId}`,
        error
      );
    }
  }

  async listInteractionsByAgent(
    input: ListInteractionsInput
  ): Promise<ListInteractionsOutput> {
    try {
      const result = await this.readDriver.routines.ListInteractionsByAgent(
        input.agentIdentifier,
        input.limit,
        input.offset
      );

      const [records, total] = result;

      return {
        records: (records as any[]).map((r) => this.parseRecord(r)),
        total: BigInt(total),
      };
    } catch (error) {
      throw new QueryError(
        `Failed to list interactions for: ${input.agentIdentifier}`,
        error
      );
    }
  }

  async getAgentStats(agentIdentifier: string): Promise<GetStatsOutput> {
    try {
      const result = await this.readDriver.routines.GetAgentInteractionStats(
        agentIdentifier
      );
      const [stats, found] = result;

      return {
        stats: found ? this.parseStats(stats) : ({} as AgentInteractionStats),
        found: Boolean(found),
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
