import type { RouteConfig } from '@asteasolutions/zod-to-openapi';
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

import * as config from '@config';
import { z } from './zod';
import { Schemas } from './validators';

// using commonJS `require` otherwise TS is complaining about package.json being outside src/
const packageJson = require('../../../package.json');

const registry = new OpenAPIRegistry();
const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  description: `Access token must contain ${config.hydra.jwks.accessToken.audience} as audience`,
  bearerFormat: 'JWT',
});

// use same type definition as express
type StatusCode = number;

const formatDoc = {
  request(schema: Schemas<z.ZodRawShape>) {
    const requestDocumentation: RouteConfig['request'] = {};

    if (schema.params) {
      requestDocumentation.params = schema.params;
    }
    if (schema.query) {
      requestDocumentation.query = schema.query;
    }
    if (schema.body) {
      requestDocumentation.body = {
        content: {
          'application/json': {
            schema: schema.body,
          },
        },
      };
    }

    return requestDocumentation;
  },

  response(statusCode: StatusCode, description: string) {
    return {
      [statusCode]: { description },
    } satisfies RouteConfig['responses'];
  },
};

function generateOpenapi() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const docs = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
    },
  });
  return docs;
}

export { registry, bearerAuth, formatDoc, generateOpenapi };
