import axios from 'axios';
import type { Machine } from '../../types/machine';

const getMachinesOfUser = async (userId: number): Promise<Machine[]> => {
  const { data } = await axios.get(`/api_catalog/v1/users/${userId}/machines?includes=session`);
  return data.machines;
};

export { getMachinesOfUser };
