# rest-app

REST API for web app

## Setup

```bash
npm ci
cp src/config/config.sample.ts src/config/config.ts
# update what needs to be updated in src/config/config.ts
```

### Env var
|Name|description|
|---|---|
|DB_USERNAME|database's username|
|DB_PASSWORD|database's password|
|SEQUELIZE_MIGRATION|enum to apply sequelize migration. Possible values are 'up', 'down' or 'none'. Any other value will result in 'none' value|
|SEQUELIZE_SEEDS|enum to apply sequelize seed. Possible values are 'up', 'down' or 'none'. Any other value will result in 'none' value|
|HYDRA_JWKS_VDI_SESSION_KID|Key id of jwks used to sign session vdi jwt|

## Run

```bash
npm run debug
```

## Authentification
### Authorization code flow
It is the flow used to connect to the webapp.

To perform it, follow these simple steps:

1. Go to the web app at http://127.0.0.1:5001
2. You will be redirect by the navigator to http://127.0.0.1:5002 with the correct query params
3. Login with your credential (you can use the admin user defined during installation steps)
4. Then, you are redirected to the web app.
5. An access token is set in cookie, named `web_app_session`.

From here you have the two following possibilities.
#### In header
This method has been added as the default way to interact with this API:

1. From web app page, tap F12 to open developer console and navigate to Storage > Cookies
2. Get value of the web_app_session cookie.
3. Put it in authorization header. Note that "Bearer" pefix is optional
#### As cookie
This method has been added because we have exposed rest-catalog through rest-app on `/api_catalog` path. This allow web app frontend to reach rest-catalog using its cookie set during authorization code flow.

To work, frontend must have its session cookie set. Nginx will handle forwarding it to rest-catalog.

### With session vdi cookie
As greenion client agent should be able to close a session, authentification using session vdi jtw has been added. It is the token retrieved on this [route of rest-app](http://127.0.0.1:5001/openapi/#/sessions/post_api_v1_sessions).

Rest-catalog middleware will limit operations offered to this cookie on the session which id is contained in jwt (in `sessionId` field)

## Dev tools

```bash
npm run lint # run linter
npm run style # run formatter
npm test # run tests
npm run coverage # run tests and collect coverage
npm run build # compile TS
```
