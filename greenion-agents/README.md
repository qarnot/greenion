# greenion-agents

This repo contains the code for the greenion agents client and server. These two softwares are to be installed on the VDI server (the computer we want to remote into) and on the VDI client (the computer we are using to remote into the VDI server).
The greenion-agents project aims to support both Windows (client and server) and Linux (client and server).

## How to run

See the documentation for the [server agent](./server.md) and for the [client agent](./client.md).

## Contributing

### Running integration tests
Requirements: `docker`

- Copy the deb installers to `./greenion-agents/tests/installers` (version 24.04)
- From the repository root, run `./greenion-agents/tests/test_local.sh`

