<template>
  <div>
    <InputText
      placeholder="Search"
      class="mx-auto my-8 block !bg-white !text-zinc-800 !rounded-full"
      @update:model-value="search(store.sessions, $event)" />

    <DataList
      ref="sessionList"
      class="lg:w-1/2 mx-auto"
      :first="first"
      :items="filteredSessions"
      item-component="SessionListItem"
      @item-selected="selectedSession = $event">
      <template #header>
        <div class="h-[42px] flex items-center">
          <span class="w-12 sm:w-36">
            ID
          </span>
          <span>
            Public Machine IP
          </span>
        </div>
      </template>
    </DataList>

    <SessionSideView
      v-model="showSideView"
      :session="selectedSession"
      @update-session="handleSesionUpdate"
      @hide-drawer="hideDrawer" />
  </div>
</template>

<script lang="ts" setup>
import {
  inject,
  onMounted,
  onUnmounted,
  Ref,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import DataList from '../components/common/DataList.vue';
import SessionSideView from '../components/sessions/SessionSideView.vue';
import { Session } from '../types/session';
import { useUserStore } from '../stores/user.ts';
import { useSearch } from '../composables/useSearch.ts';
import { useIntervalRefresh } from '../composables/useIntervalRefresh.ts';
import { Logger } from '../types/logger';

const logger = inject<Logger>('logger');
const sessionListRef = useTemplateRef<typeof DataList>('sessionList');
const router = useRouter();
const store = useUserStore();
const route = useRoute();
const { search, filteredItems: filteredSessions } = useSearch<Session>({ filter: 'id' });
const toast = useToast();

store.$subscribe((_, state) => {
  filteredSessions.value = state.sessions;
});

const selectedSession: Ref<Session> = ref({} as Session);
const showSideView: Ref<boolean> = ref(false);
const first: Ref<number> = ref(0);

const fetchSessions = async () => {
  try {
    await store.fetchSessions();
  } catch (error: any) {
    logger?.error('Unable to fetch sessions. Error:', error.message);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occured while fetching sessions list',
      life: 3000,
    });
  }
};
const { startInterval, stopInterval } = useIntervalRefresh(fetchSessions);

const handleSesionUpdate = (session: Session) => {
  const sessionIndex = store.sessions.findIndex((s) => s.id === session.id);
  store.sessions[sessionIndex] = session;
};

const hideDrawer = () => {
  showSideView.value = false;
  sessionListRef.value?.unselectItem(selectedSession.value);
  selectedSession.value = {} as Session;
};

watch(() => selectedSession.value, (value) => {
  showSideView.value = !!Object.values(value).length;
  router.push({ name: route.name, query: { id: value.id } });
});

onMounted(async () => {
  startInterval();
  filteredSessions.value = store.sessions;
  if (route.query.id) {
    // ignoring that route.query.id may be null because
    // we already test if route.query.id is defined with a value earlier
    // @ts-ignore
    const itemIndex = store.sessions.findIndex((s: Session) => s.id === +route.query.id);
    if (itemIndex !== -1) {
      first.value = Math.floor(itemIndex / 10) * 10;
      setTimeout(() => {
        sessionListRef.value?.selectItem(store.sessions[itemIndex]);
      }, 100);
      selectedSession.value = store.sessions[itemIndex];
      showSideView.value = true;
    }
  }
});

onUnmounted(stopInterval);
</script>
