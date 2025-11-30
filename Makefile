# Absolute repo root, regardless of where make is invoked
ROOT := $(realpath $(dir $(lastword $(MAKEFILE_LIST))))

.PHONY: gen gen-py gen-ts

# Generate everything
gen: gen-py gen-ts

# Python gRPC stubs (.py + .pyi)
gen-py:
	@mkdir "$(ROOT)/packages/generated-py/generated" 2> NUL || exit 0
	cd "$(ROOT)/apps/server" && \
	uv run python -m grpc_tools.protoc \
		-I "$(ROOT)/packages/proto" \
		--python_out="$(ROOT)/packages/generated-py/generated" \
		--grpc_python_out="$(ROOT)/packages/generated-py/generated" \
		--pyi_out="$(ROOT)/packages/generated-py/generated" \
		"$(ROOT)/packages/proto/metrics.proto"

# TypeScript gRPC stubs (ts-proto)
gen-ts:
	@mkdir "$(ROOT)/packages/generated-ts/src" 2> NUL || exit 0
# TODO: enable once ts-proto is ready
# cd "$(ROOT)/apps/dashboard" && \
# npx protoc \
# 	-I "$(ROOT)/packages/proto" \
# 	--ts_proto_out "$(ROOT)/packages/generated-ts/src" \
# 	--ts_proto_opt esModuleInterop=true,outputServices=grpc-js \
# 	"$(ROOT)/packages/proto/metrics.proto"
