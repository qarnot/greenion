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
        value="VDI SESSION"
        :icon="PrimeIcons.PLAY"
        severity="secondary"
        :pt="{ icon: { class: 'mr-2' } }" />
    </template>

    <div class="grow-0">
      <div class="flex flex-col mt-6">
        <span>VDI Session ID</span>
        <span class="opacity-60">
          {{ session.id }}
        </span>
      </div>

      <div class="flex flex-col mt-6">
        <span class="opacity-40">
          Start date
        </span>
        <span>
          {{ formatDate(session.createdAt) }}
        </span>
      </div>

      <div class="flex flex-col mt-6">
        <span class="opacity-40">
          End date
        </span>
        <span>
          {{ formatDate(session.closedAt) ?? '--' }}
        </span>
      </div>
    </div>

    <Divider class="!my-8 before:!border-t-zinc-800 grow-0" />

    <div class="flex flex-col grow">
      <div class="grow">
        <p>Machine</p>
        <Button
          class="!bg-zinc-800 w-full !justify-between mt-4"
          severity="secondary"
          :label="`${machine?.name || machine?.id}`"
          :icon="PrimeIcons.EXTERNAL_LINK"
          icon-pos="right"
          @click="goToMachine(machine?.id)" />

        <div class="flex flex-col mt-6">
          <span class="opacity-60">
            Public IP address
          </span>
          <CodeLine
            :text="`${machine?.externalIp}:${machine?.externalPort}`" />
        </div>

        <div class="flex flex-col mt-6">
          <span class="opacity-60">
            Internal IP address
          </span>
          <CodeLine
            :text="`${machine?.ip}:${machine?.port}`" />
        </div>
      </div>

      <Button
        v-if="!session.closedAt"
        class="grow-0 w-full mt-4 !text-white"
        label="Close session"
        :icon="PrimeIcons.TIMES_CIRCLE"
        severity="danger"
        icon-pos="right"
        @click="handleSessionCloseAction" />
    </div>
  </Drawer>
</template>

<script lang="ts" setup>
import { PrimeIcons } from '@primevue/core/api';
import {
  computed, ComputedRef, inject, PropType,
} from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import globalEmitter from '../../services/emitter';
import { Session } from '../../types/session';
import CodeLine from '../common/CodeLine.vue';
import { useUserStore } from '../../stores/user';
import { Machine } from '../../types/machine';
import { Logger } from '../../types/logger';

const props = defineProps({
  session: {
    type: Object as PropType<Session>,
    default: () => ({}),
  },
});

const logger = inject<Logger>('logger');
const store = useUserStore();
const toast = useToast();
const model = defineModel({ type: Boolean });
const emit = defineEmits(['hide-drawer', 'update-session']);
const router = useRouter();
const machine: ComputedRef<Machine | undefined> = computed(
  () => props.session.userMachine?.machine,
);

const goToMachine = (machineId?: number) => {
  if (machineId) {
    globalEmitter.emit('select-machine-view');
    router.push({
      name: 'machines',
      query: { id: machineId },
    });
  }
};

const handleSessionCloseAction = async () => {
  try {
    await store.closeSession(props.session);
    emit('hide-drawer');
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Session succesfully closed',
      life: 3000,
    });
  } catch (error: any) {
    logger?.error('Unable to close session. Error:', error.message);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occured while closing your session',
      life: 3000,
    });
  }
};

const formatDate = (date: string | null) => {
  if (date) {
    return new Date(date).toLocaleDateString('en-EN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return null;
};
</script>
