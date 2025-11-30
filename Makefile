# Absolute repo root, regardless of where make is invoked
ROOT := $(realpath $(dir $(lastword $(MAKEFILE_LIST))))

.PHONY: gen gen-py gen-ts

# Generate everything
gen: gen-py gen-ts

# Python gRPC stubs (.py + .pyi)
gen-py:
	@mkdir -p "$(ROOT)/apps/server/src/proto"
	cd "$(ROOT)/apps/server" && \
	uv run python -m grpc_tools.protoc \
		-I "$(ROOT)/packages/proto" \
		--python_out="$(ROOT)/apps/server/src/proto" \
		--grpc_python_out="$(ROOT)/apps/server/src/proto" \
		--pyi_out="$(ROOT)/apps/server/src/proto" \
		"$(ROOT)/packages/proto/metrics.proto"

# TypeScript gRPC stubs (ts-proto)
gen-ts:
	@mkdir -p "$(ROOT)/apps/dashboard/src/proto"
	@echo "TypeScript proto generation not yet configured"
# TODO: enable once ts-proto is ready
# cd "$(ROOT)/apps/dashboard" && \
# npx protoc \
# 	-I "$(ROOT)/packages/proto" \
# 	--ts_proto_out "$(ROOT)/apps/dashboard/src/proto" \
# 	--ts_proto_opt esModuleInterop=true,outputServices=grpc-js \
# 	"$(ROOT)/packages/proto/metrics.proto"
