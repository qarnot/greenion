import fs from 'fs';
import { generateOpenapi } from '@api/lib/openapi';

function writeSwaggerFile() {
  const openapi = generateOpenapi();
  fs.writeFileSync('swagger.json', JSON.stringify(openapi, null, 2), 'utf-8');
}

writeSwaggerFile();
