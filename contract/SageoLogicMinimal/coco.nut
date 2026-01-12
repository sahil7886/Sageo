[coco]
version = "0.7.1"

[module]
name = "SageoLogicMinimal"
version = "0.0.1"
license = []
repository = ""
authors = []

[target]
os = "MOI"
arch = "PISA"

[target.moi]
format = "YAML"
output = "sageologicminimal"

[target.pisa]
format = "ASM"
version = "0.6.0"

[lab.render]
big_int_as_hex = true
bytes_as_hex = false

[lab.config.default]
env = "main"
