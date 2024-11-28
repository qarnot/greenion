import { Schemas } from '@api/lib/validators';
import { z } from '@api/lib/zod';

const schemas = {
  generateSignedCertificate: {
    request: {
      body: z.object({
        machineId: z.number().positive(),
        machineExternalIp: z.coerce.string().ip().openapi({ example: '127.0.0.1' }),
      }),
    },
    response: {
      200: z.object({
        signedCertificate: z.string().openapi({
          example:
            '-----BEGIN CERTIFICATE-----\r\nMIIC2jCCAcKgAwIBAgIBADANBgkqhkiG9w0BAQsFADA1MQswCQYDVQQGEwJGUjEP\r\nMA0GA1UECgwGUUFSTk9UMRUwEwYDVQQDDAxHUkVFTklPTlMtQ0EwHhcNMjQwOTIz\r\nMTQ1OTMxWhcNMjUwOTIzMTQ1OTMxWjAsMQowCAYDVQQDEwEzMREwDwYDVQQKEwhH\r\nUkVFTklPTjELMAkGA1UEBhMCRlIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK\r\nAoIBAQCjT+mwqGbFxThcF1iDAzHqfhfTsjw8fAwSBH0aDDI3fm4OKXd/+sq/8fhF\r\nFXyNoWkWQnXsdaQl3oLFEzZn8BeFDovtN6Uu1yt53i6P8vdFjb1mcSzp3Vld4Wkg\r\n5PqhSMOziLim27yHvCciZKU+Q9oW6tVMHt2cc7ucffBGqoSCTfDZWNwjVL758oht\r\nPbFvJbPsFdwJ3ZhYXIdDofW8lR59MnvdW8TL9tXf6iQsm/LNS8XMrPoZCck8GrdU\r\nso99Z4pPgSrfXSbv20QP8mI8XSEz3Vy/JehLGvQRu/i51AIDs5hR+ZqTfqbliZE0\r\nY31XYEa6eSPu3z0CGGLQdAN0+PYBAgMBAAEwDQYJKoZIhvcNAQELBQADggEBACP5\r\n5vTicXVXtA1LkKMi5QKn4E2oTvdVzbIaViqkpPu0Fs35uCrzy72BpYoxu5eoQQAv\r\nGqUhDo7c/bAyzrD/Jjn5DdtWOBCifyA3nAK8zvUUl9p/f+1vbbts8FeO26ELRfjx\r\nBWGKLqxyW8k1yymep496ySHkzGSgxyrL83KfdmF9E2TlCOB7/6RyDBGRxkWGRBpk\r\neK8oaPDIwk7TGLv3FCIRYv1Na/UfqM+QEM6MbL97HvoocacD49eXIdj0MuufM/LU\r\n8cvQBdrl4Soldt9eXCTEztAYJWcYoKzGqHhoAO+/fWit1rexOU/DzOSIqYS8Zco5\r\n60USktviXsFNsQQufgQ=\r\n-----END CERTIFICATE-----\r\n',
        }),
        privateKey: z.string().openapi({
          example:
            '-----BEGIN RSA PRIVATE KEY-----\r\nMIIEowIBAAKCAQEAo0/psKhmxcU4XBdYgwMx6n4X07I8PHwMEgR9GgwyN35uDil3\r\nf/rKv/H4RRV8jaFpFkJ17HWkJd6CxRM2Z/AXhQ6L7TelLtcred4uj/L3RY29ZnEs\r\n6d1ZXeFpIOT6oUjDs4i4ptu8h7wnImSlPkPaFurVTB7dnHO7nH3wRqqEgk3w2Vjc\r\nI1S++fKIbT2xbyWz7BXcCd2YWFyHQ6H1vJUefTJ73VvEy/bV3+okLJvyzUvFzKz6\r\nGQnJPBq3VLKPfWeKT4Eq310m79tED/JiPF0hM91cvyXoSxr0Ebv4udQCA7OYUfma\r\nk36m5YmRNGN9V2BGunkj7t89Ahhi0HQDdPj2AQIDAQABAoIBABLakPISHvtKD32i\r\nPFezsLmPoRSRiR66e3JBDmhJbCq37+C2rNMbkvih6LWhC2YWclldhturoS22CIbT\r\n9v3829pCmajjObC0qpJBMkLwG9ftyyXefv7ozP5nnYlspfqkueMqL5cj2xoYgLQZ\r\nxnHvx2fJ6KIHFjKPseMZLvoZiX65bZC6FZv7mzjz3BYpKEcNOpg7KIFhNjgzPzJ5\r\nVdMqgBxHCPKmuwsPybTH41wN8VAEWKuMqRyfFeORcdVllvs4xccSBZ2JesKQNDyJ\r\nnl0vywXbw7Es1AW6ckE8Db1MKmP/hKXRp+vNI6KT5677JOhkhoCPu+g51MpmIyG5\r\n9EOVAbkCgYEA0ciq9rFareYq2xYhdCilJ97t2sKj7HH4A8LsgBkEomZFMimArcUF\r\nJqZlTd81F1QR+kGpJJEfHnbu7mvJtgxhi3LfBQsK4EwS7R1/Z4S5C4qSbLSk2nwz\r\ndIQtm9MNqlOs7mgt5sRWS236m+9wHKdtw0OhQXrD7QWrskBFwz3wHicCgYEAx0pY\r\n0n65vQLCBnZmZGHbpPj/pedpmKIyumS+HH/BXicPwjxKsKXOzs7QsRXMuU0MS/yF\r\nrDVIk868Nx4eXU4dCaB7ArkUnhHIg/2v/P2s3/EzVewI1FYpv7dMfGP4OgrGsU/V\r\nY13XGnHSatoR5rEd7Zp/fX1RnjTDZHARWwdIi5cCgYEAoNgCfPKuW/bFlQT60Vz4\r\nhAFgzQG/PWKEjh29xtlnvDw9gaBgkNsmf+PEeFhTFHfY8M+3J9o8ydbWiucJ2RLV\r\nF14TsIIu7JpnSHX9YRlZ54dvjPlUDFB+Ay/06CyBpb5SMNifmPegUmUYaMbEZrPY\r\nbIZF9TZzUh+u7RRqaK/skrECgYAMZc6iwalyXbKOTl1OT1wnpinZO00xZp27RLsi\r\n8LupzMpJLhEDbj0wVmNbMNz8hhOGwp3aObJbJ5hD4YbIDSz3RVmBsNvcfYS42VZS\r\nacGQaOPlq3pdI0MTnyaN8nYlvjfgHfRLazIPfhc1+Hz2mfwfpOXbe6lRKz0giWw6\r\n+ngD3wKBgBXovDO7LDX104afodnaigivTUJ2qgDy5+SKeBF+nNt5GKmWagShVtTm\r\nw+TpuwPQYa94uyYwidgZe0PkOokib11x5+3l6AxbfgdPHB8c22UJvWNCgT/sS/q3\r\nUtIoQDKlaBeWNo47OgHFfnTGqAbBmzl3wk38iZ4Sv0QJGysUpKIQ\r\n-----END RSA PRIVATE KEY-----\r\n',
        }),
      }),
    },
  },
} satisfies {
  [routeKey: string]: {
    request: Schemas<z.ZodRawShape>;
    response: { [key: number]: z.ZodObject<z.ZodRawShape> };
  };
};

export { schemas };
