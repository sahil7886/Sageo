[coco]
version = "0.7.1"

[module]
name = "SageoLogic"
version = "0.0.1"
license = []
repository = ""
authors = []

[target]
os = "MOI"
arch = "PISA"

[target.moi]
format = "YAML"
output = "sageologic"

[target.pisa]
format = "ASM"
version = "0.6.0"

[lab.render]
big_int_as_hex = true
bytes_as_hex = false

[lab.config.default]
env = "main"

[lab.scripts]
test-contract = [
    "users",
    "logics",
    "register caller_agent",
    "register callee_agent",
    "set default.sender caller_agent",
    "deploy SageoLogic.Deploy()",
    "logics",
    "invoke SageoLogic.Enlist()",
    "invoke SageoLogic.RegisterAgent(name: \"Weather Agent\", description: \"Provides weather data\", version: \"1.0.0\", url: \"http://weather.example.com\", protocol_version: \"2025-01-01\", default_input_modes: \"[\\\"text\\\"]\", default_output_modes: \"[\\\"text\\\"]\", streaming: false, push_notifications: false, state_transition_history: false, icon_url: \"\", documentation_url: \"\", preferred_transport: \"JSONRPC\", wallet_address: \"0x123\")",
    "observe SageoLogic.Sender.agent_id",
    "observe SageoLogic.Sender.owned_agents",
    "wipe default.sender",
    "set default.sender callee_agent",
    "invoke SageoLogic.Enlist()",
    "invoke SageoLogic.RegisterAgent(name: \"Data Agent\", description: \"Processes data\", version: \"1.0.0\", url: \"http://data.example.com\", protocol_version: \"2025-01-01\", default_input_modes: \"[\\\"text\\\"]\", default_output_modes: \"[\\\"text\\\"]\", streaming: true, push_notifications: false, state_transition_history: false, icon_url: \"\", documentation_url: \"\", preferred_transport: \"JSONRPC\", wallet_address: \"0x456\")",
    "observe SageoLogic.Sender.agent_id",
    "wipe default.sender",
    "set default.sender caller_agent",
    "invoke SageoLogic.LogRequest(callee_identifier: callee_agent, request_hash: \"req_hash_123\", intent: \"get_weather\", timestamp: 1234567890, a2a_context_id: \"ctx_001\", a2a_task_id: \"task_001\", a2a_message_id: \"msg_001\", end_user_id: \"user_001\", end_user_session_id: \"session_001\")",
    "wipe default.sender",
    "set default.sender callee_agent",
    "invoke SageoLogic.LogResponse(ix_id: \"ix_1\", response_hash: \"resp_hash_456\", status_code: 200, timestamp: 1234567900)",
    "invoke SageoLogic.GetInteraction(ix_id: \"ix_1\")",
    "invoke SageoLogic.GetAgentInteractionStats(agent_identifier: caller_agent)",
    "invoke SageoLogic.GetAgentInteractionStats(agent_identifier: callee_agent)",
    "invoke SageoLogic.ListInteractionsByAgent(agent_identifier: caller_agent, limit: 10, offset: 0)",
    "invoke SageoLogic.GetAgentProfile(sageo_id: \"agent_1\")",
    "invoke SageoLogic.GetAgentCard(sageo_id: \"agent_1\")",
    "invoke SageoLogic.GetAllAgentIds()",
    "invoke SageoLogic.GetAgentCount()"
]

[scripts]
test-script = "coco compile .; pwd; uname -a"
