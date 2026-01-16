// sdk/src/identity.ts
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
  AgentCard,
  AgentSkill,
  AgentProfile,
  AgentProfileMeta,
  AgentStatus,
  RegisterAgentInput,
  GetAgentProfileOutput,
  GetAgentCardOutput,
  GetAgentSkillsOutput,
} from './types.js';
import {
  ContractLoadError,
  SignerRequiredError,
  TransactionError,
  QueryError,
} from './errors.js';

export class SageoIdentitySDK {
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

  static async init(config: SDKConfig): Promise<SageoIdentitySDK> {
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
        wallet = await createWallet(config.privateKey || '', provider);
      }

      readDriver = await loadContract(
        { logicId: config.logicId, manifest: config.manifest },
        wallet
      );
    } catch (error) {
      throw new ContractLoadError(config.logicId, error);
    }

    return new SageoIdentitySDK(
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

  async enlist(): Promise<void> {
    const driver = this.ensureSigner();

    try {
      const ix = await driver.routines.Enlist();
      await ix.wait();
    } catch (error) {
      throw new TransactionError('Failed to enlist', undefined, error);
    }
  }

  async registerAgent(input: RegisterAgentInput): Promise<AgentProfile> {
    const driver = this.ensureSigner();
    const card = input.agentCard;

    const walletAddress = await getIdentifier(this.wallet!);

    const defaultInputModes = JSON.stringify(card.defaultInputModes || []);
    const defaultOutputModes = JSON.stringify(card.defaultOutputModes || []);

    try {
      let ix;
      try {
        const registerAgentCall = driver.routines.RegisterAgent(
          card.name,
          card.description,
          card.version,
          card.url,
          card.protocolVersion,
          defaultInputModes,
          defaultOutputModes,
          card.capabilities?.streaming || false,
          card.capabilities?.pushNotifications || false,
          card.capabilities?.stateTransitionHistory || false,
          card.iconUrl || '',
          card.documentationUrl || '',
          card.preferredTransport || 'JSONRPC',
          walletAddress,
          BigInt(Math.floor(Date.now() / 1000))
        );

        // Add timeout to detect hanging calls
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('RegisterAgent call timed out after 30 seconds - account may not exist on-chain'));
          }, 30000);
        });
        ix = await Promise.race([registerAgentCall, timeoutPromise]) as any;

      } catch (createIxError) {
        const errorMsg = createIxError instanceof Error ? createIxError.message : String(createIxError);
        if (errorMsg.includes('account not found') || errorMsg.includes('timed out')) {
          throw new TransactionError(
            `Account at address ${walletAddress} does not exist on MOI devnet. The account must be funded and initialized before registering an agent. Please ensure the mnemonic corresponds to a funded account.`,
            undefined,
            createIxError
          );
        }
        throw createIxError;
      }

      const receipt = await ix.wait();
      let decoded: any = null;
      try {
        decoded = await ix.result();
      } catch (decodeError) {
        decoded = null;
      }

      const sageoId =
        decoded?.output?.sageo_id ??
        decoded?.sageo_id ??
        receipt.outputs?.[0] ??
        (receipt as any).sageo_id ??
        (receipt as any).result?.sageo_id ??
        (receipt as any).output?.sageo_id ??
        (receipt as any).ix_operations?.[0]?.data?.sageo_id ??
        (receipt as any).ix_operations?.[0]?.data?.result?.sageo_id;

      if (!sageoId || typeof sageoId !== 'string') {
        throw new TransactionError(
          'No sageo_id returned from RegisterAgent',
          receipt.hash,
          receipt
        );
      }

      // Fetch the full profile
      const profileResult = await this.getAgentProfile(sageoId);
      if (!profileResult.found || !profileResult.profile) {
        throw new TransactionError('Failed to fetch registered agent profile');
      }

      return profileResult.profile;
    } catch (error) {
      throw new TransactionError('Failed to register agent', undefined, error);
    }
  }


  async getAgentProfile(sageoId: string): Promise<GetAgentProfileOutput> {
    try {
      const result = await this.readDriver.routines.GetAgentProfile(sageoId);
      const output = Array.isArray(result)
        ? { profile: result[0], found: result[1] }
        : (result as any)?.output ?? result;
      const profileData = (output as any)?.profile;
      const found = Boolean((output as any)?.found);

      if (!found) {
        return { profile: null, found: false };
      }

      // Fetch card and skills separately
      const cardResult = await this.getAgentCard(sageoId);
      const skillsResult = await this.getAgentSkills(sageoId);

      const profile = this.parseProfile(profileData);
      if (cardResult.found && cardResult.card) {
        profile.agent_card = cardResult.card;
        if (skillsResult.found) {
          profile.agent_card.skills = skillsResult.skills;
        }
      }

      return { profile, found: true };
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('map key does not exist')) {
        return { profile: null, found: false };
      }
      throw new QueryError(`Failed to get agent profile: ${sageoId}`, error);
    }
  }


  async getAgentCard(sageoId: string): Promise<GetAgentCardOutput> {
    try {
      const result = await this.readDriver.routines.GetAgentCard(sageoId);
      const output = Array.isArray(result)
        ? { card: result[0], found: result[1] }
        : (result as any)?.output ?? result;
      const cardData = (output as any)?.card;
      const found = Boolean((output as any)?.found);

      if (!found) {
        return { card: null, found: false };
      }

      const card = this.parseCard(cardData);
      return { card, found: true };
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('map key does not exist')) {
        return { card: null, found: false };
      }
      throw new QueryError(`Failed to get agent card: ${sageoId}`, error);
    }
  }


  async getAgentSkills(sageoId: string): Promise<GetAgentSkillsOutput> {
    try {
      const result = await this.readDriver.routines.GetAgentSkills(sageoId);
      const output = Array.isArray(result)
        ? { skills: result[0], found: result[1] }
        : (result as any)?.output ?? result;
      const rawSkills = (output as any)?.skills ?? [];
      const skills = Array.isArray(rawSkills)
        ? rawSkills.map((s) => this.parseSkill(s))
        : [];
      const found = Boolean((output as any)?.found ?? skills.length > 0);

      return { skills, found };
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('map key does not exist')) {
        return { skills: [], found: false };
      }
      throw new QueryError(`Failed to get agent skills: ${sageoId}`, error);
    }
  }


  async getMyProfile(): Promise<AgentProfile | null> {
    if (!this.wallet) {
      throw new SignerRequiredError('getMyProfile');
    }

    const walletAddress = await getIdentifier(this.wallet);

    try {
      let idsResult;
      try {
        idsResult = await this.readDriver.routines.GetAllAgentIds();
      } catch (getAllError) {
        throw getAllError;
      }
      const output = Array.isArray(idsResult)
        ? { ids: idsResult[0] }
        : (idsResult as any)?.output ?? idsResult;
      const ids = (output as any)?.ids || [];

      for (const id of ids) {
        const profileResult = await this.getAgentProfile(String(id));
        if (
          profileResult.found &&
          normalizeIdentifier(profileResult.profile?.wallet_address || '') ===
            normalizeIdentifier(walletAddress)
        ) {
          return profileResult.profile;
        }
      }

      return null;
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('account not found')) {
        return null;
      }
      throw new QueryError('Failed to get my profile', error);
    }
  }


  async getAgentByUrl(url: string): Promise<AgentProfileMeta | null> {
    try {
      const result = await this.readDriver.routines.GetAgentByUrl(url);
      const output = Array.isArray(result)
        ? { profile: result[0], found: result[1] }
        : (result as any)?.output ?? result;
      const profileData = (output as any)?.profile;
      const found = Boolean((output as any)?.found);

      if (!found) {
        return null;
      }

      return this.parseProfileMeta(profileData);
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('map key does not exist')) {
        return null;
      }
      throw new QueryError(`Failed to get agent by URL: ${url}`, error);
    }
  }


  async addSkill(sageoId: string, skill: AgentSkill): Promise<void> {
    const driver = this.ensureSigner();

    try {
      const examples = JSON.stringify(skill.examples || []);
      const inputModes = JSON.stringify(skill.inputModes || []);
      const outputModes = JSON.stringify(skill.outputModes || []);

      const ix = await driver.routines.AddSkill(
        sageoId,
        skill.id,
        skill.name,
        skill.description,
        skill.tags || '',
        examples,
        inputModes,
        outputModes
      );

      await ix.wait();
    } catch (error) {
      throw new TransactionError(
        `Failed to add skill to agent: ${sageoId}`,
        undefined,
        error
      );
    }
  }

  private parseProfile(raw: any): AgentProfile {
    return {
      sageo_id: String(raw.sageo_id || ''),
      owner: String(raw.owner || ''),
      wallet_address: normalizeIdentifier(String(raw.wallet_address || '')),
      status: (raw.status as AgentStatus) || AgentStatus.ACTIVE,
      created_at: BigInt(raw.created_at || 0),
      updated_at: BigInt(raw.updated_at || 0),
      agent_card: {} as AgentCard,
    };
  }

  private parseProfileMeta(raw: any): AgentProfileMeta {
    return {
      sageo_id: String(raw.sageo_id || ''),
      owner: String(raw.owner || ''),
      wallet_address: normalizeIdentifier(String(raw.wallet_address || '')),
      status: (raw.status as AgentStatus) || AgentStatus.ACTIVE,
      created_at: BigInt(raw.created_at || 0),
      updated_at: BigInt(raw.updated_at || 0),
    };
  }

  private parseCard(raw: any): AgentCard {
    const defaultInputModes = this.parseJsonArray(
      raw.default_input_modes || '[]'
    );
    const defaultOutputModes = this.parseJsonArray(
      raw.default_output_modes || '[]'
    );

    return {
      name: String(raw.name || ''),
      description: String(raw.description || ''),
      version: String(raw.version || ''),
      url: String(raw.url || ''),
      protocolVersion: String(raw.protocol_version || ''),
      defaultInputModes,
      defaultOutputModes,
      capabilities: {
        streaming: Boolean(raw.capabilities?.streaming || false),
        pushNotifications: Boolean(
          raw.capabilities?.push_notifications || false
        ),
        stateTransitionHistory: Boolean(
          raw.capabilities?.state_transition_history || false
        ),
      },
      skills: [],
      iconUrl: raw.icon_url ? String(raw.icon_url) : undefined,
      documentationUrl: raw.documentation_url
        ? String(raw.documentation_url)
        : undefined,
      preferredTransport: raw.preferred_transport
        ? (raw.preferred_transport as 'JSONRPC' | 'GRPC' | 'HTTP+JSON')
        : undefined,
    };
  }

  private parseSkill(raw: any): AgentSkill {

    const tagsString = String(raw.tags || '');
    const tags = tagsString ? tagsString.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : [];
    
    return {
      id: String(raw.id || ''),
      name: String(raw.name || ''),
      description: String(raw.description || ''),
      tags: tags,
      examples: this.parseJsonArray(raw.examples || '[]'),
      inputModes: this.parseJsonArray(raw.input_modes || '[]'),
      outputModes: this.parseJsonArray(raw.output_modes || '[]'),
    };
  }

  private parseJsonArray(jsonString: string): string[] {
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
