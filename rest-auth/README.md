# rest-app

REST API for web app

## Setup

```bash
npm run create:ca
npm ci
cp src/config/config.sample.ts src/config/config.ts
# update what needs to be updated in src/config/config.ts
```

### Env var
|Name|description|
|---|---|
|CERTIFICATES_CA_CERTIFICATE|Path to root CA certificate (can be generated thanks to `npm run ca-files`)|
|CERTIFICATES_CA_PRIVATE_KEY|path to root CA key (can be generated thanks to `npm run ca-files`)|
|CERTIFICATES_CSR_ORGANIZATION_NAME|name of organization requesting certificate|
|CERTIFICATES_CSR_COUNTRY_NAME|country where organization is based|
|CERTIFICATES_OUTPUT_IS_ENABLED|feature flag to enable writing of generated files on disk|
|CERTIFICATES_OUTPUT_PATH|path where generated certificate are output|

## Run

```bash
npm run debug
```

## Dev tools

```bash
npm run lint # run linter
npm run style # run formatter
npm test # run tests
npm run coverage # run tests and collect coverage
npm run build # compile TS
```
