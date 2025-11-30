# Repo root absolute path
ROOT := $(realpath $(dir $(lastword $(MAKEFILE_LIST))))

.PHONY: gen gen-py gen-ts

gen: gen-py gen-ts

gen-py:
	@cmd /c if not exist "$(ROOT)\apps\server\src\proto" mkdir "$(ROOT)\apps\server\src\proto"
	@cd $(ROOT)/apps/server && \
	uv run python -m grpc_tools.protoc \
		-I "$(ROOT)/packages/proto" \
		--python_out="$(ROOT)/apps/server/src/proto" \
		--grpc_python_out="$(ROOT)/apps/server/src/proto" \
		--pyi_out="$(ROOT)/apps/server/src/proto" \
		"$(ROOT)/packages/proto/metrics.proto"
	@echo Python proto generation done

gen-ts:
	@cmd /c if not exist "$(ROOT)\apps\dashboard\src\proto" mkdir "$(ROOT)\apps\dashboard\src\proto"
	@echo TypeScript proto generation not yet configured
