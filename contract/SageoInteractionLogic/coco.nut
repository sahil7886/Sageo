[coco]
version = "0.7.1"

[module]
name = "SageoInteractionLogic"
version = "0.0.1"
license = []
repository = ""
authors = []

[target]
os = "MOI"
arch = "PISA"

[target.moi]
format = "YAML"
output = "sageointeractionlogic"

[target.pisa]
format = "ASM"
version = "0.6.0"

[lab.render]
big_int_as_hex = true
bytes_as_hex = false

[lab.config.default]
env = "main"

[lab.scripts]
test-toggle = ["engines", "users", "logics"]
test-contract = [
    "compile .",
    "users",
    "logics",
    "register caller_agent",
    "register callee_agent",
    "set default.sender caller_agent",
    "deploy SageoInteractionLogic.Deploy()",
    "logics",
    "enlist SageoInteractionLogic.Enlist(sageo_id: \"agent_caller\")",
    "observe SageoInteractionLogic.Sender.agent_id",
    "wipe default.sender",
    "set default.sender callee_agent",
    "enlist SageoInteractionLogic.Enlist(sageo_id: \"agent_callee\")",
    "observe SageoInteractionLogic.Sender.agent_id",
    "wipe default.sender",
    "set default.sender caller_agent",
    "invoke SageoInteractionLogic.LogRequest(callee_identifier: callee_agent, request_hash: \"req_hash_123\", intent: \"get_weather\", timestamp: 1234567890, a2a_context_id: \"ctx_001\", a2a_task_id: \"task_001\", a2a_message_id: \"msg_001\", end_user_id: \"user_001\", end_user_session_id: \"session_001\")",
    "wipe default.sender",
    "set default.sender callee_agent",
    "invoke SageoInteractionLogic.LogResponse(ix_id: \"ix_1\", response_hash: \"resp_hash_456\", status_code: 200, timestamp: 1234567900)",
    "invoke SageoInteractionLogic.GetInteraction(ix_id: \"ix_1\")",
    "invoke SageoInteractionLogic.GetAgentInteractionStats(agent_identifier: caller_agent)",
    "invoke SageoInteractionLogic.GetAgentInteractionStats(agent_identifier: callee_agent)",
    "invoke SageoInteractionLogic.ListInteractionsByAgent(agent_identifier: caller_agent, limit: 10, offset: 0)"
]

[scripts]
test-script = "coco compile .; pwd; uname -a"
