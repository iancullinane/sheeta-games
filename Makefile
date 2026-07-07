# This makefile is strictly for building the Go application

.PHONY: build clean

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
