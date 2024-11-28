// import all routers to load openapi components
import '@api/router';

import fs from 'fs';
import { generateOpenapi } from '@api/lib/openapi';

function writeOpenApiJsonFile() {
  const openapi = generateOpenapi();
  fs.writeFileSync('openapi.json', JSON.stringify(openapi, null, 2), 'utf-8');
}

writeOpenApiJsonFile();
