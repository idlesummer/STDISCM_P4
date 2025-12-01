# Repo root absolute path
ROOT := $(realpath $(dir $(lastword $(MAKEFILE_LIST))))

.PHONY: gen gen-py gen-ts

gen: gen-py gen-ts

gen-py:
	@mkdir -p "$(ROOT)/apps/server/src/proto"

	@echo Removing old Python proto files...
	@rm -f "$(ROOT)/apps/server/src/proto/metrics_pb2.py"
	@rm -f "$(ROOT)/apps/server/src/proto/metrics_pb2.pyi"
	@rm -f "$(ROOT)/apps/server/src/proto/metrics_pb2_grpc.py"

	@echo Generating Python proto files...
	@cd $(ROOT)/apps/server && \
	uv run python -m grpc_tools.protoc \
		-I "$(ROOT)/packages/proto" \
		--python_out="$(ROOT)/apps/server/src/proto" \
		--grpc_python_out="$(ROOT)/apps/server/src/proto" \
		--pyi_out="$(ROOT)/apps/server/src/proto" \
		"$(ROOT)/packages/proto/metrics.proto"

	@cd $(ROOT)/apps/server && \
	uv run python -c "open('src/proto/__init__.py', 'w').write('# Generated gRPC proto stubs\n')"

	@cd $(ROOT)/apps/server && \
	uv run python -c "import sys; data = open('src/proto/metrics_pb2_grpc.py').read(); open('src/proto/metrics_pb2_grpc.py', 'w').write(data.replace('import metrics_pb2 as metrics__pb2', 'from . import metrics_pb2 as metrics__pb2'))"

	@echo Python proto generation done


gen-ts:
	@mkdir -p "$(ROOT)/apps/dashboard/src/proto"

	@echo Removing old TypeScript proto files...
	@rm -f "$(ROOT)/apps/dashboard/src/proto/metrics_pb.js"
	@rm -f "$(ROOT)/apps/dashboard/src/proto/metrics_pb.d.ts"
	@rm -f "$(ROOT)/apps/dashboard/src/proto/metrics_grpc_pb.js"
	@rm -f "$(ROOT)/apps/dashboard/src/proto/metrics_grpc_pb.d.ts"

	@echo Generating TypeScript proto files...
	@cd $(ROOT)/apps/dashboard && \
	npx grpc_tools_node_protoc \
		--js_out=import_style=commonjs,binary:src/proto \
		--grpc_out=grpc_js:src/proto \
		--plugin=protoc-gen-grpc=node_modules/.bin/grpc_tools_node_protoc_plugin \
		-I "$(ROOT)/packages/proto" \
		"$(ROOT)/packages/proto/metrics.proto"

	@cd $(ROOT)/apps/dashboard && \
	npx grpc_tools_node_protoc \
		--plugin=protoc-gen-ts=node_modules/.bin/protoc-gen-ts \
		--ts_out=grpc_js:src/proto \
		-I "$(ROOT)/packages/proto" \
		"$(ROOT)/packages/proto/metrics.proto"

	@echo TypeScript proto generation done
