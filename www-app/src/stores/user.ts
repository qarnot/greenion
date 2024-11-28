import axios from 'axios';
import { defineStore } from 'pinia';
import { Ref, ref } from 'vue';
import type { User } from '../types/user';
import { Machine } from '../types/machine';
import { api } from '../services/api';
import { Session } from '../types/session';

export const useUserStore = defineStore('user', () => {
  const isLogged = ref(false);
  const message = ref(null);
  const userInfos: Ref<User> = ref({} as User);
  const machines: Ref<Machine[]> = ref([]);
  const sessions: Ref<Session[]> = ref([]);
  const vdiSessionToken: Ref<string> = ref('');

  const checkUserSession = async () => {
    try {
      const response = await axios.get('/api/v1/auth/user/info');
      isLogged.value = true;
      userInfos.value = response.data;
    } catch (error: any) {
      isLogged.value = false;
      if (error.response.data.redirect_to) {
        window.location.href = error.response.data.redirect_to;
      }
    }
  };

  const fetchMachines = async () => {
    if (!isLogged.value) await checkUserSession();
    machines.value = await api.machines.getMachinesOfUser(userInfos.value.id);
  };

  const fetchSessions = async () => {
    if (!isLogged.value) await checkUserSession();
    const userSessions = await api.sessions.getSessionsOfUser(userInfos.value.id);
    sessions.value = userSessions.sort((a, b) => {
      if (a.id > b.id) return -1;
      if (a.id < b.id) return 1;
      return 0;
    });
  };

  const openVdiSession = () => {
    const link = document.createElement('a');
    link.href = `${window.config.vdiSession.protocol}://${vdiSessionToken.value}`;
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  const createSession = async (machineId: number) => {
    const { jwt } = await api.sessions.createSession(machineId);
    vdiSessionToken.value = jwt;
    await fetchMachines();
    await fetchSessions();
    openVdiSession();
  };

  const closeSession = async (session: Session) => {
    const closedSession = await api.sessions.closeSession(session);
    const sessionIndex = sessions.value.findIndex((s) => s.id === closedSession.id);
    sessions.value[sessionIndex] = closedSession;
    await fetchMachines();
  };

  return {
    isLogged,
    message,
    userInfos,
    machines,
    sessions,

    checkUserSession,
    fetchMachines,
    fetchSessions,
    createSession,
    closeSession,
  };
});
