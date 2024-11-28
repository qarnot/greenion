import { createMachine } from '@services/catalog';
import * as iam from '@services/iam';
import { MachineInput } from 'types/catalog';

async function create(body: MachineInput, headers: { accessToken: string }) {
  const machine = await createMachine(body, headers);
  const { privateKey, signedCertificate } = await iam.createCertificates(
    { machineId: machine.id, machineExternalIp: machine.externalIp },
    headers
  );
  return { machine, privateKey, signedCertificate };
}

export { create };
