# This makefile is strictly for building the Go application

.PHONY: build clean deploy synth eks-up eks-down eks-url

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
#   1. cdk deploy with --require-approval never so the IAM/IRSA change prompt
#      doesn't block an otherwise one-command bring-up.
#   2. Apply namespace.yaml FIRST: `kubectl apply -f k8s/` processes files
#      alphabetically, so on a fresh cluster the namespaced objects would race
#      ahead of namespace.yaml ("namespace not found"). Applying it explicitly
#      first makes the subsequent full apply idempotent.
#   3. Wait for the ALB controller: it registers an admission webhook for
#      Ingresses, so applying the Ingress before its Pods are Ready fails with
#      "connection refused calling webhook". rollout status blocks until ready.
eks-up:
	cdk deploy PlatformStack --require-approval never
	aws eks update-kubeconfig --name $(CLUSTER_NAME) --region $(AWS_REGION)
	kubectl apply -f k8s/00-namespace.yaml
	kubectl -n kube-system rollout status deploy/aws-load-balancer-controller --timeout=180s
	kubectl apply -f k8s/

# eks-down: SAFE-ORDER teardown. Delete k8s workloads FIRST so any AWS resources
# Kubernetes created (an Ingress ALB + ENIs, etc.) get cleaned up, THEN destroy the
# stack — wrong order can hang cdk destroy on orphaned ENIs. Leading `-` and
# --ignore-not-found keep a missing/unreachable cluster from blocking the destroy.
eks-down:
	-kubectl delete -f k8s/ --ignore-not-found
	cdk destroy PlatformStack

# eks-url: print the app's current ALB hostname. It changes on every redeploy
# (a fresh Ingress = a fresh ALB) until ExternalDNS/M3c gives us a stable name.
eks-url:
	@kubectl get ingress -n prisoner \
	  -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}'; echo
