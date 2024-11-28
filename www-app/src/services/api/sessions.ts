import axios from 'axios';
import type { Session } from '../../types/session';

const getSessionsOfUser = async (userId: number): Promise<Session[]> => {
  const { data } = await axios.get(`/api_catalog/v1/sessions?userId=${userId}&includes=machine`);
  return data;
};

const createSession = async (machineId: number) => {
  const { data } = await axios.post('/api/v1/sessions', { machineId });
  return data;
};

const closeSession = async (session: Session) => {
  const { data } = await axios.put(`/api_catalog/v1/sessions/${session.id}?includes=machine`, {
    closedAt: new Date().toISOString(),
    name: session.name,
  });
  return data;
};

export {
  getSessionsOfUser,
  createSession,
  closeSession,
};
