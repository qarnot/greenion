import axios from 'axios';
import * as config from '@config';
import { MachineInput } from 'types/catalog';

async function createSession(
  body: { userId: number; machineId: number },
  headers: { accessToken: string }
) {
  const { data } = await axios.post(`${config.services.catalog.url}/api/v1/sessions`, body, {
    headers: {
      Authorization: headers.accessToken,
    },
  });
  return data;
}

async function getUsers(userUuid: string, headers: { accessToken: string }) {
  const params: Record<string, string> = {};
  if (userUuid) params.uuid = userUuid;
  const { data } = await axios.get(`${config.services.catalog.url}/api/v1/users`, {
    params,
    headers: {
      Authorization: headers.accessToken,
    },
  });
  return data;
}

async function createMachine(machine: MachineInput, headers: { accessToken: string }) {
  const { data } = await axios.post(`${config.services.catalog.url}/api/v1/machines`, machine, {
    headers: {
      Authorization: headers.accessToken,
    },
  });
  return data;
}

async function createUser(body: { uuid: string }, headers: { accessToken: string }) {
  const { data } = await axios.post(`${config.services.catalog.url}/api/v1/users`, body, {
    headers: {
      Authorization: headers.accessToken,
    },
  });
  return data;
}
export { createSession, getUsers, createMachine, createUser };
