import forge from 'node-forge';
import fs from 'fs';
import { certificates as certificatesConfig } from '@config';
import { logger } from '@lib/pino';

// Create a Certificate signing request (CSR)
function createCSR(publicKey: forge.pki.rsa.PublicKey, machineId: number) {
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = publicKey;
  csr.setSubject([
    {
      name: 'commonName',
      value: machineId.toString(),
    },
    {
      name: 'organizationName',
      value: certificatesConfig.csr.organizationName,
    },
    {
      name: 'countryName',
      value: certificatesConfig.csr.countryName,
    },
  ]);
  logger.debug(
    `CSR has been created with /C=${certificatesConfig.csr.countryName}/O=${certificatesConfig.csr.organizationName}/CN=${machineId} subject`
  );
  return csr;
}

function createCerticate(
  csr: forge.pki.CertificateSigningRequest,
  caCert: forge.pki.Certificate,
  machineExternalIp: string
): forge.pki.Certificate {
  const clientCert = forge.pki.createCertificate();
  clientCert.publicKey = csr.publicKey as forge.pki.PublicKey;
  clientCert.validity.notBefore = new Date();
  clientCert.validity.notAfter = new Date();
  clientCert.validity.notAfter.setFullYear(clientCert.validity.notBefore.getFullYear() + 1);

  clientCert.setSubject(csr.subject.attributes);
  clientCert.setIssuer(caCert.subject.attributes);

  clientCert.setExtensions([
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 7, // IP
          ip: machineExternalIp,
        },
      ],
    },
  ]);
  return clientCert;
}

function createKeys() {
  return forge.pki.rsa.generateKeyPair(2048);
}

// Use self signed CA to create certificate based on csr and sign it with ca
function signCSR(csr: forge.pki.CertificateSigningRequest, ip: string): forge.pki.Certificate {
  const caCertPem = fs.readFileSync(certificatesConfig.ca.certificate, 'utf8');
  const caKeyPem = fs.readFileSync(certificatesConfig.ca.privateKey, 'utf8');
  const caCert = forge.pki.certificateFromPem(caCertPem);
  const caKey = forge.pki.privateKeyFromPem(caKeyPem);

  const clientCert = createCerticate(csr, caCert, ip);
  clientCert.sign(caKey, forge.md.sha256.create());
  logger.debug(`Certificate with CN=${csr.subject.attributes[0].value} has been signed by CA`);
  return clientCert;
}

function generateSignedCertificateAndSecretKey(body: {
  machineId: number;
  machineExternalIp: string;
}) {
  const { machineId, machineExternalIp } = body;
  if (certificatesConfig.output.isEnabled && !fs.existsSync(certificatesConfig.output.path)) {
    fs.mkdirSync(certificatesConfig.output.path);
  }

  const keys = createKeys();
  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);

  const csr = createCSR(keys.publicKey, machineId);
  csr.sign(keys.privateKey);

  const signedCertificate = signCSR(csr, machineExternalIp);
  const clientCertPem = forge.pki.certificateToPem(signedCertificate);

  // NOTE: write generated certificates on disk for debug purposes only
  if (certificatesConfig.output.isEnabled) {
    if (!fs.existsSync(certificatesConfig.output.path)) {
      fs.mkdirSync(certificatesConfig.output.path);
    }
    fs.writeFileSync(`${certificatesConfig.output.path}/machine-${machineId}.key`, privateKeyPem);
    const csrPem = forge.pki.certificationRequestToPem(csr);
    fs.writeFileSync(`${certificatesConfig.output.path}/machine-${machineId}.csr`, csrPem);
    fs.writeFileSync(
      `${certificatesConfig.output.path}/machine-${machineId}.crt.pem`,
      clientCertPem
    );
    logger.debug(
      `CSR, private key and certificate have been written to ${certificatesConfig.output.path}`
    );
  }

  return {
    signedCertificate: clientCertPem,
    privateKey: privateKeyPem,
  };
}

export { generateSignedCertificateAndSecretKey };
