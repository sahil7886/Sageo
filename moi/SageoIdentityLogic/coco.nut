[coco]
version = "0.7.1"

[module]
name = "SageoIdentityLogic"
version = "0.0.1"
license = []
repository = ""
authors = []

[target]
os = "MOI"
arch = "PISA"

[target.moi]
format = "YAML"
output = "sageoidentitylogic"

[target.pisa]
format = "ASM"
version = "0.6.0"

[lab.render]
big_int_as_hex = true
bytes_as_hex = false

[lab.config.default]
env = "main"

[lab.scripts]
test-identity = [
    "users",
    "logics",
    "register agent1",
    "register agent2",
    "set default.sender agent1",
    "deploy SageoIdentityLogic.Deploy()",
    "logics",
    "invoke SageoIdentityLogic.RegisterAgent(name: \"WeatherBot\", description: \"A bot that provides weather info\", version: \"1.0.0\", url: \"https://weather.example.com\", protocol_version: \"0.3.0\", icon_url: \"https://weather.example.com/icon.png\", documentation_url: \"https://weather.example.com/docs\")",
    "invoke SageoIdentityLogic.GetAgentCount()",
    "invoke SageoIdentityLogic.GetAgentById(sageo_id: \"agent_1\")",
    "invoke SageoIdentityLogic.GetAgentByUrl(url: \"https://weather.example.com\")",
    "wipe default.sender",
    "set default.sender agent2",
    "invoke SageoIdentityLogic.RegisterAgent(name: \"FlightBot\", description: \"A bot that books flights\", version: \"1.0.0\", url: \"https://flight.example.com\", protocol_version: \"0.3.0\", icon_url: \"https://flight.example.com/icon.png\", documentation_url: \"https://flight.example.com/docs\")",
    "invoke SageoIdentityLogic.GetAgentCount()",
    "invoke SageoIdentityLogic.ListAgents(limit: 10, offset: 0)",
    "wipe default.sender",
    "set default.sender agent1",
    "invoke SageoIdentityLogic.SetAgentStatus(sageo_id: \"agent_1\", status: \"PAUSED\")",
    "invoke SageoIdentityLogic.GetAgentById(sageo_id: \"agent_1\")",
    "invoke SageoIdentityLogic.UpdateAgentCard(sageo_id: \"agent_1\", name: \"WeatherBot v2\", description: \"Updated weather bot\", version: \"2.0.0\", url: \"https://weather.example.com\", protocol_version: \"0.3.0\", icon_url: \"https://weather.example.com/icon.png\", documentation_url: \"https://weather.example.com/docs\")"
]

[scripts]
test-script = "coco compile .; pwd; uname -a"
