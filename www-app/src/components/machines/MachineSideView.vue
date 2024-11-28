<template>
  <Drawer
    v-model:visible="model"
    :modal="false"
    position="right"
    class="!bg-zinc-700 rounded-xl"
    :pt="{
      content: { class: 'flex flex-col' },
    }"
    @hide="emit('hide-drawer')">
    <template #header>
      <Tag
        value="Machine"
        :icon="PrimeIcons.DESKTOP"
        severity="secondary"
        :pt="{ icon: { class: 'mr-2' } }" />
    </template>

    <div class="grow-0">
      <div class="flex flex-col mt-6">
        <span>Machine name</span>
        <span class="opacity-60">
          {{ machine.name }}
        </span>
      </div>

      <div class="flex flex-col mt-6">
        <span>Machine ID</span>
        <span class="opacity-60">
          {{ machine.id }}
        </span>
      </div>

      <div class="flex flex-col mt-6">
        <span class="opacity-60">
          Public IP address
        </span>
        <CodeLine
          :text="`${machine.externalIp}:${machine.externalPort}`" />
      </div>

      <div class="flex flex-col mt-6">
        <span class="opacity-60">
          Internal IP address
        </span>
        <CodeLine
          :text="`${machine.ip}:${machine.port}`" />
      </div>
    </div>

    <Divider
      class="!my-8 before:!border-t-zinc-800 grow-0" />

    <div
      v-if="!activeSession"
      class="grow flex flex-col justify-end">
      <Button
        class="w-full"
        icon="pi pi-play-circle"
        icon-pos="right"
        label="Start VDI session"
        @click="createSession" />
    </div>
    <div v-else>
      <p>Active session</p>
      <Button
        class="!bg-zinc-800 w-full !justify-between mt-4"
        severity="secondary"
        :label="`${activeSession?.id}`"
        :icon="PrimeIcons.EXTERNAL_LINK"
        icon-pos="right"
        @click="goToSession(activeSession?.id)" />
      <RouterLink
        class="underline text-center block mt-4"
        :to="{ name: 'vdiSessions' }">
        see previous sessions
      </RouterLink>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { PrimeIcons } from '@primevue/core/api';
import {
  computed,
  ComputedRef,
  inject,
  PropType,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import globalEmitter from '../../services/emitter';
import type { Machine } from '../../types/machine';
import type { Session } from '../../types/session';
import CodeLine from '../common/CodeLine.vue';
import { useUserStore } from '../../stores/user';
import { Logger } from '../../types/logger';

const props = defineProps({
  machine: {
    type: Object as PropType<Machine>,
    default: () => ({}),
  },
});

const logger = inject<Logger>('logger');
const store = useUserStore();
const toast = useToast();
const model = defineModel({ type: Boolean });
const emit = defineEmits(['hide-drawer']);
const router = useRouter();
const activeSession: ComputedRef<Session | undefined> = computed(
  () => props.machine.sessions?.find((session) => !session.closedAt),
);

const createSession = async () => {
  try {
    await store.createSession(props.machine.id);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Session succesfully created',
      life: 3000,
    });
  } catch (error: any) {
    logger?.error('Unable to create session. Error:', error.message);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occured while creating a new session',
      life: 3000,
    });
  }
};

const goToSession = (sessionId: number) => {
  if (sessionId) {
    globalEmitter.emit('select-session-view');
    router.push({
      name: 'vdiSessions',
      query: { id: sessionId },
    });
  }
};

watch(model, async (value) => {
  if (!value) {
    emit('hide-drawer');
  }
});
</script>
