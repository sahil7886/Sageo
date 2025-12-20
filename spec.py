from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum

class AgentStatus(Enum):
    """Sageo-specific status states for registered agents."""
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPROMISED = "COMPROMISED"

@dataclass
class AgentProvider:
    """Information about the agent's creator or operator (A2A spec)."""
    organization: str
    url: str


@dataclass
class AgentInterface:
    """Declares which protocol bindings the agent supports (A2A spec)."""
    transport: str      # Protocol binding identifier (e.g., "JSONRPC", "GRPC")
    url: str            # Service endpoint URL


@dataclass
class AgentCardSignature:
    signer: str            # DID / address
    signature: str         # cryptographic signature
    algorithm: Optional[str] = None

@dataclass
class AgentExtension:
    """Declares additional functionality beyond core A2A specification (A2A spec)."""
    uri: str
    description: Optional[str] = None
    params: Optional[Dict[str, Any]] = None
    required: Optional[bool] = None


@dataclass
class AgentCapabilities:
    """Describes which optional A2A features the agent supports (A2A spec)."""
    streaming: Optional[bool] = None                    # Real-time event delivery support
    push_notifications: Optional[bool] = None           # Webhook notification capability
    state_transition_history: Optional[bool] = None     # Task state history support
    extensions: Optional[List[AgentExtension]] = None   # Additional functionality declarations


@dataclass
class AgentSkill:
    """Represents a specific capability or action the agent can perform (A2A spec)."""
    id: str                                     # Unique skill identifier
    name: str                                   # Human-readable skill name
    description: str                            # Skill functionality description
    tags: List[str]                             # Categorization tags
    examples: Optional[List[str]] = None        # Example inputs/queries
    input_modes: Optional[List[str]] = None     # Accepted input formats (e.g., ["text", "file"])
    output_modes: Optional[List[str]] = None    # Output formats (e.g., ["text", "image"])
    security: Optional[List[Dict[str, List[str]]]] = None  # Skill-specific security requirements

@dataclass
class AgentCard:
    """
    A2A AgentCard - the primary metadata document describing an agent's capabilities.
    This conforms to the A2A specification with all standard fields.
    """
    # Required fields
    name: str                                   # Human-readable agent name
    description: str                            # Agent purpose and capabilities summary
    version: str                                # Agent version
    default_input_modes: List[str]              # Default accepted input formats
    default_output_modes: List[str]             # Default output formats
    capabilities: AgentCapabilities             # Supported features and operations
    skills: List[AgentSkill]                    # Available agent skills
    
    url: str                                    # Primary endpoint URL

    # Optional fields

    # Optional descriptive metadata
    icon_url: Optional[str] = None
    documentation_url: Optional[str] = None
    provider: Optional[AgentProvider] = None

    # A2A spec fields stored as opaque metadata
    preferred_transport: Optional[str] = "JSONRPC"
    protocol_version: Optional[str] = "1.0"
    additional_interfaces: Optional[List[AgentInterface]] = None
    security_schemes: Optional[Dict[str, SecurityScheme]] = None
    security: Optional[List[Dict[str, List[str]]]] = None
    supports_authenticated_extended_card: Optional[bool] = None
    signatures: Optional[List[AgentCardSignature]] = None

@dataclass
class AgentProfile:
    """
    Sageo on-chain agent profile - extends A2A AgentCard with blockchain identity.
    Stores the full AgentCard data plus Sageo-specific fields for trust/discovery.
    """
    # Sageo identity fields
    sageo_id: str                               # Sageo-assigned unique identifier (on-chain)
    owner: str                                  # MOI participant ID of the agent owner
    status: AgentStatus                         # Sageo operational status
    created_at: int                             # Unix timestamp of registration
    updated_at: int                             # Unix timestamp of last update

    # A2A AgentCard (composed, not duplicated)
    agent_card: AgentCard                       # The agent's A2A AgentCard with all metadata


@dataclass
class InteractionRecord:
    """On-chain proof of an agent-to-agent interaction."""
    interaction_id: str
    caller_agent_id: str
    callee_agent_id: str
    request_hash: str
    response_hash: Optional[str]
    intent: str
    status_code: Optional[int]
    timestamp: int
    signature: str

@dataclass
class SendMessageRequest:
    """A2A message request structure."""
    id: str
    params: dict


@dataclass
class SendMessageResponse:
    """A2A message response structure."""
    id: str
    result: dict


@dataclass
class Task:
    """A2A Task representation."""
    id: str
    context_id: str
    status: dict
    history: List[dict]
    artifacts: List[dict]

class SageoIdentityLogic:
    """
    MOI Logic for agent identity management.
    Handles registration, profile updates, and status changes.
    Deployed as a Coco logic on MOI blockchain.
    """

    def register_agent(self, agent_card: AgentCard, owner: Optional[str] = None) -> AgentProfile:
        """
        Registers a new agent on Sageo using its A2A AgentCard.

        Input:
            agent_card - The agent's A2A AgentCard with all metadata
            owner - MOI participant ID; defaults to transaction sender

        Output:
            The newly created agent profile with assigned sageo_id
        """
        
        if actor_id in self._agent_id_by_actor:
            raise ValueError("Actor already owns a registered agent")

        if not agent_card.is_identity_complete():
            raise ValueError("AgentCard missing required identity fields")

        sageo_id = f"sageo_{uuid.uuid4().hex}"
        now = int(time.time())

        profile = AgentProfile(
            sageo_id=sageo_id,
            actor_id=actor_id,
            agent_card=agent_card,
            status=AgentStatus.ACTIVE,
            created_at=now,
            updated_at=now,
        )

        self._agents_by_id[sageo_id] = profile
        self._agent_id_by_actor[actor_id] = sageo_id

        # Optional index (if endpoint URL exists)
        if agent_card.supported_interfaces:
            for interface in agent_card.supported_interfaces:
                self._agent_id_by_url[interface.url] = sageo_id

        return profile


    def get_agent_by_id(self, sageo_id: str) -> Optional[AgentProfile]:
        """
        Retrieves an agent profile by its Sageo ID.

        Input:
            sageo_id - Sageo-assigned unique identifier

        Output:
            The agent profile if found, None otherwise
        """
        return self._agents_by_id.get(sageo_id)
    
    def get_agent_by_actor_id(self, actor_id: str) -> Optional[AgentProfile]:
        """
        Ownership lookup (used by SDK during init).
        """
        sageo_id = self._agent_id_by_actor.get(actor_id)
        if not sageo_id:
            return None
        return self._agents_by_id.get(sageo_id)



    def get_agent_by_url(self, url: str) -> Optional[AgentProfile]:
        """
        Retrieves an agent profile by its A2A endpoint URL.

        Input:
            url - Agent's A2A endpoint URL

        Output:
            The agent profile if found, None otherwise
        """
        sageo_id = self._agent_id_by_url.get(url)
        if not sageo_id:
            return None
        return self._agents_by_id.get(sageo_id)

    def update_agent_card(self, sageo_id: str, agent_card: AgentCard) -> AgentProfile:
        """
        Updates an agent's full AgentCard metadata (owner-only operation).

        Input:
            sageo_id - Sageo ID of the agent to update
            agent_card - Updated A2A AgentCard

        Output:
            The updated agent profile
        """
        sageo_id = self._agent_id_by_url.get(url)
        if not sageo_id:
            return None
        return self._agents_by_id.get(sageo_id)

    def set_agent_status(self, sageo_id: str, status: AgentStatus, caller_actor_id: str,
        is_admin: bool = False) -> AgentProfile:
        """
        Updates an agent's operational status (owner-only for PAUSED, admin for COMPROMISED).

        Input:
            sageo_id - Sageo ID of the agent
            status - New status (ACTIVE, PAUSED, or COMPROMISED)

        Output:
            The updated agent profile
        """

        profile = self._require_agent(sageo_id)

        if status == AgentStatus.PAUSED and profile.actor_id != caller_actor_id:
            raise PermissionError("Only owner may pause agent")

        if status == AgentStatus.COMPROMISED and not is_admin:
            raise PermissionError("Only admin may mark agent as compromised")

        profile.status = status
        profile.updated_at = int(time.time())

        return profile



    def list_agents(self, tags: Optional[List[str]] = None, status: Optional[AgentStatus] = None, capabilities: Optional[Dict[str, bool]] = None, limit: int = 50, offset: int = 0) -> List[AgentProfile]:
        """
        Lists registered agents with optional filtering.

        Input:
            tags - Filter by agents having skills with ALL these tags
            status - Filter by Sageo status (default: all statuses)
            capabilities - Filter by capabilities (e.g., {"streaming": True})
            limit - Maximum number of results (default: 50, max: 100)
            offset - Pagination offset (default: 0)

        Output:
            List of matching agent profiles
        """
        
        results = list(self._agents_by_id.values())

        if status:
            results = [a for a in results if a.status == status]

        if tags:
            results = [
                a for a in results
                if all(
                    tag in [s.name for s in a.agent_card.skills]
                    for tag in tags
                )
            ]

        if capabilities:
            for key, value in capabilities.items():
                results = [
                    a for a in results
                    if getattr(a.agent_card.capabilities, key, None) == value
                ]

        return results[offset: offset + min(limit, 100)]


    def search_agents(self, query: str, limit: int = 20) -> List[AgentProfile]:
        """
        Searches agents by name, description, or skill tags using fuzzy matching.

        Input:
            query - Search query string
            limit - Maximum results to return (default: 20)

        Output:
            Ranked list of matching agents
        """


        q = query.lower()

        def score(agent: AgentProfile) -> int:
            s = 0
            card = agent.agent_card
            if q in card.name.lower():
                s += 3
            if q in card.description.lower():
                s += 2
            for skill in card.skills:
                if q in skill.name.lower():
                    s += 1
            return s

        ranked = sorted(
            self._agents_by_id.values(),
            key=score,
            reverse=True,
        )

        return [a for a in ranked if score(a) > 0][:limit]
    


    def get_agents_by_skill(self, skill_id: str, limit: int = 50) -> List[AgentProfile]:
        """
        Finds agents that have a specific skill.

        Input:
            skill_id - The skill ID to search for
            limit - Maximum results (default: 50)

        Output:
            List of agents with the specified skill
        """

        results = [
            a for a in self._agents_by_id.values()
            if any(skill.name == skill_id for skill in a.agent_card.skills)
        ]

        return results[:limit]

        # An internal helper method to ensure an agent exists
        def _require_agent(self, sageo_id: str) -> AgentProfile:
        agent = self._agents_by_id.get(sageo_id)
        if not agent:
            raise KeyError("Agent not found")
        return agent


class SageoInteractionLogic:
    """
    MOI Logic for interaction proof logging.
    Records hashed request/response data to create verifiable interaction history.
    Deployed as Coco logic on MOI blockchain.
    """

    def log_request(self, caller_agent_id: str, callee_agent_id: str, request_hash: str, intent: str, signature: str) -> str:
        """
        Logs the initiation of an agent-to-agent request and returns an interaction ID.

        Input:
            caller_agent_id - Sageo ID of the agent making the request
            callee_agent_id - Sageo ID of the agent receiving the request
            request_hash - SHA-256 hash of the request payload
            intent - Short label describing the request purpose (e.g., "currency_conversion")
            signature - Cryptographic signature of request_hash by caller

        Output:
            Unique interaction_id for linking the subsequent response
        """
        pass

    def log_response(self, interaction_id: str, response_hash: str, status_code: int, signature: str) -> InteractionRecord:
        """
        Logs the response to a previously logged request, completing the interaction proof.

        Input:
            interaction_id - ID returned from log_request
            response_hash - SHA-256 hash of the response payload
            status_code - HTTP-like status code (200=success, 400=client error, 500=server error)
            signature - Cryptographic signature of response_hash by callee

        Output:
            The completed interaction record
        """
        pass

    def get_interaction(self, interaction_id: str) -> Optional[InteractionRecord]:
        """
        Retrieves a specific interaction record by ID.

        Input:
            interaction_id - Unique interaction identifier

        Output:
            The interaction record if found, None otherwise
        """
        pass

    def list_interactions_by_agent(self, agent_id: str, limit: int = 50, offset: int = 0) -> List[InteractionRecord]:
        """
        Lists interactions involving a specific agent.

        Input:
            agent_id - Sageo ID of the agent
            direction - Filter by REQUEST or RESPONSE (default: both)
            limit - Maximum results (default: 50, max: 100)
            offset - Pagination offset (default: 0)

        Output:
            List of interactions, newest first
        """
        pass

    def list_interactions_between_agents(self, agent_a_id: str, agent_b_id: str, limit: int = 50, offset: int = 0) -> List[InteractionRecord]:
        """
        Lists all interactions between two specific agents (in either direction).

        Input:
            agent_a_id - Sageo ID of first agent
            agent_b_id - Sageo ID of second agent
            limit - Maximum results (default: 50)
            offset - Pagination offset (default: 0)

        Output:
            List of interactions between the two agents
        """
        pass

    def verify_interaction(self, interaction_id: str, request_payload: bytes, response_payload: Optional[bytes] = None) -> bool:
        """
        Verifies that provided payloads match the on-chain hashes for an interaction.

        Input:
            interaction_id - Unique interaction identifier
            request_payload - Original request payload to verify
            response_payload - Original response payload to verify

        Output:
            True if all provided payloads match their on-chain hashes
        """
        pass

    def get_agent_interaction_stats(self, agent_id: str) -> dict:
        """
        Returns aggregate statistics about an agent's interactions.

        Input:
            agent_id - Sageo ID of the agent

        Output:
            Statistics dict with keys: total_requests_sent, total_requests_received,
            total_responses_sent, success_rate, unique_counterparties, last_interaction_at
        """
        pass

class SageoClient:
    """
    Main SDK client that wraps A2A communication with automatic Sageo logging.
    This is the primary interface developers use to integrate Sageo.
    """

    def __init__(self, moi_rpc_url: str, agent_key: str, agent_card: AgentCard):
        """
        Initializes the Sageo client and ensures agent is registered.

        Input:
            moi_rpc_url - URL of the MOI RPC endpoint
            agent_key - Private key for signing interactions
            agent_card - This agent's A2A AgentCard
        """
        pass

    def ensure_registered(self) -> AgentProfile:
        """
        Ensures this agent is registered on Sageo, registering if necessary.

        Output:
            This agent's profile (existing or newly created)
        """
        pass

    def get_my_profile(self) -> AgentProfile:
        """
        Returns the current agent's Sageo profile.

        Output:
            This agent's on-chain profile
        """
        pass

    def update_my_card(self, agent_card: AgentCard) -> AgentProfile:
        """
        Updates this agent's AgentCard metadata on Sageo.

        Input:
            agent_card - Updated A2A AgentCard

        Output:
            Updated profile
        """
        pass

    def wrap_a2a_client(self, a2a_client: object) -> "SageoA2AClientWrapper":
        """
        Wraps an existing A2A client to automatically log interactions.

        Input:
            a2a_client - An instance of a2a.client.A2AClient

        Output:
            Drop-in replacement that logs to Sageo
        """
        pass

    def log_interaction_manually(self, callee_sageo_id: str, intent: str, request_payload: bytes, response_payload: bytes, status_code: int) -> InteractionRecord:
        """
        Manually logs a complete interaction (for cases where wrapping isn't possible).

        Input:
            callee_sageo_id - Sageo ID of the agent that was called
            intent - Short description of the interaction purpose
            request_payload - Raw request data (will be hashed)
            response_payload - Raw response data (will be hashed)
            status_code - Result status code

        Output:
            The logged interaction proof
        """
        pass


class SageoA2AClientWrapper:
    """
    A drop-in replacement for A2AClient that automatically logs interactions to Sageo.
    All A2AClient methods are proxied with Sageo logging added.
    """

    def __init__(self, sageo_client: SageoClient, a2a_client: object, remote_agent_card: AgentCard):
        """
        Creates a wrapped A2A client.

        Input:
            sageo_client - Initialized Sageo client for logging
            a2a_client - The underlying A2AClient to wrap
            remote_agent_card - Card of the remote agent being called
        """
        pass

    async def send_message(self, request: SendMessageRequest) -> SendMessageResponse:
        """
        Sends a message to the remote agent with automatic Sageo logging.

        Input:
            request - Standard A2A message request

        Output:
            Standard A2A response
        """
        pass

    async def send_message_streaming(self, request: SendMessageRequest):
        """
        Sends a streaming message request with Sageo logging.

        Input:
            request - Standard A2A streaming request

        Output:
            Stream of A2A events
        """
        pass

    async def get_task(self, task_id: str) -> Task:
        """
        Retrieves a task by ID (passthrough, no logging needed).

        Input:
            task_id - A2A task identifier

        Output:
            The task object
        """
        pass


class SageoExplorer:
    """
    Client for querying the Sageo network - discovering agents and viewing interactions.
    Read-only operations that don't require agent registration.
    """

    def __init__(self, moi_rpc_url: str):
        """
        Initializes the explorer client.

        Input:
            moi_rpc_url - URL of the MOI RPC endpoint
        """
        pass

    def get_agent(self, sageo_id: Optional[str] = None, url: Optional[str] = None) -> Optional[AgentProfile]:
        """
        Retrieves an agent profile by Sageo ID or URL.

        Input:
            sageo_id - Sageo agent ID (preferred)
            url - A2A endpoint URL (fallback)

        Output:
            Agent profile if found

        Note: Must provide at least one of sageo_id or url
        """
        pass

    def get_agent_card(self, sageo_id: str) -> Optional[AgentCard]:
        """
        Retrieves just the A2A AgentCard for an agent.

        Input:
            sageo_id - Sageo agent ID

        Output:
            The agent's A2A AgentCard if found
        """
        pass

    def list_agents(self, tags: Optional[List[str]] = None, status: Optional[AgentStatus] = None, capabilities: Optional[Dict[str, bool]] = None, limit: int = 50, offset: int = 0) -> List[AgentProfile]:
        """
        Lists registered agents with optional filtering.

        Input:
            tags - Filter by skill tags
            status - Filter by status
            capabilities - Filter by capabilities (e.g., {"streaming": True})
            limit - Max results (default: 50)
            offset - Pagination offset

        Output:
            Matching agent profiles
        """
        pass

    def search_agents(self, query: str, limit: int = 20) -> List[AgentProfile]:
        """
        Searches for agents by name, description, or tags.

        Input:
            query - Search query
            limit - Max results (default: 20)

        Output:
            Ranked search results
        """
        pass

    def find_agents_by_skill(self, skill_id: str, limit: int = 50) -> List[AgentProfile]:
        """
        Finds agents that have a specific skill.

        Input:
            skill_id - The skill ID to search for
            limit - Maximum results (default: 50)

        Output:
            List of agents with the specified skill
        """
        pass

    def get_interaction(self, interaction_id: str) -> Optional[InteractionRecord]:
        """
        Retrieves a specific interaction by ID.

        Input:
            interaction_id - Interaction identifier

        Output:
            Interaction if found
        """
        pass

    def get_agent_interactions(self, agent_id: str, limit: int = 50, offset: int = 0) -> List[InteractionRecord]:
        """
        Gets interactions for a specific agent.

        Input:
            agent_id - Sageo agent ID
            direction - Filter by direction
            limit - Max results
            offset - Pagination offset

        Output:
            Agent's interactions
        """
        pass

    def get_agent_stats(self, agent_id: str) -> dict:
        """
        Gets aggregate statistics for an agent.

        Input:
            agent_id - Sageo agent ID

        Output:
            Interaction statistics
        """
        pass

    def verify_interaction(self, interaction_id: str, request_payload: bytes, response_payload: Optional[bytes] = None) -> bool:
        """
        Verifies payloads match on-chain hashes.

        Input:
            interaction_id - Interaction to verify
            request_payload - Request data to check
            response_payload - Response data to check

        Output:
            True if hashes match
        """
        pass
