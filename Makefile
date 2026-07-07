# This makefile is strictly for building the Go application

.PHONY: build clean deploy synth eks-up eks-down

# build:
# 	mkdir -p lib/functions/build
# 	cd lib/functions && \
# 	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o build/bootstrap && \
# 	cd build && \
# 	zip -r function.zip bootstrap && \
# 	rm bootstrap

# clean:
# 	rm -rf lib/functions/build

deploy:
	cdk deploy

synth:
	cdk synth

# --- EKS lifecycle -----------------------------------------------------------
# Keep in sync with config.yaml's platform block. Override via env if needed.
AWS_REGION   ?= us-east-2
CLUSTER_NAME ?= adventurebrave-eks

# eks-up: create the EKS platform stack, point kubectl at it, deploy the app.
eks-up:
	cdk deploy PlatformStack
	aws eks update-kubeconfig --name $(CLUSTER_NAME) --region $(AWS_REGION)
	kubectl apply -f k8s/

# eks-down: SAFE-ORDER teardown. Delete k8s workloads FIRST so any AWS resources
# Kubernetes created (an Ingress ALB + ENIs, etc.) get cleaned up, THEN destroy the
# stack — wrong order can hang cdk destroy on orphaned ENIs. Leading `-` and
# --ignore-not-found keep a missing/unreachable cluster from blocking the destroy.
eks-down:
	-kubectl delete -f k8s/ --ignore-not-found
	cdk destroy PlatformStack
