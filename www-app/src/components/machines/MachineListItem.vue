<template>
  <Card
    class="!bg-zinc-700 hover:!bg-zinc-700/90 transition-colors cursor-pointer"
    :class="isSelected ? selectedCardClasses : ''"
    :pt="{
      content: { class: 'flex items-center justify-between' },
      body: { class: '!py-3' },
    }"
    @click="toggleMachineSelection">
    <template #content>
      <div class="h-[42px] flex items-center">
        <span class="w-12">
          {{ item.id }}
        </span>
        <span class="mr-8 w-24 md:w-32 truncate">
          {{ item.name }}
        </span>
        <span class="mr-8 w-32">
          {{ item.externalIp }}:{{ item.externalPort }}
        </span>
      </div>
      <div v-if="!!activeSession">
        <Button
          label="Session"
          severity="secondary"
          :icon="PrimeIcons.CARET_RIGHT"
          icon-pos="right"
          class="hover:!bg-zinc-800/50"
          @click.stop="goToSession(activeSession.id)" />
      </div>
    </template>
  </Card>
</template>

<script lang="ts" setup>
import { PrimeIcons } from '@primevue/core/api';
import {
  ref, PropType, ComputedRef, computed,
} from 'vue';
import { useRouter } from 'vue-router';
import globalEmitter from '../../services/emitter';
import type { Machine } from '../../types/machine';
import type { Session } from '../../types/session';

const emit = defineEmits(['toggle-selection']);
const router = useRouter();

const props = defineProps({
  item: {
    type: Object as PropType<Machine>,
    default: () => ({}),
  },
});

const isSelected = ref(false);
const selectedCardClasses = ref('border border-primary');
const activeSession: ComputedRef<Session | undefined> = computed(
  () => props.item.sessions?.find((session) => !session.closedAt),
);

const toggleMachineSelection = () => {
  isSelected.value = !isSelected.value;
  emit('toggle-selection', props.item);
};

const goToSession = (sessionId: number) => {
  globalEmitter.emit('select-session-view');
  router.push({
    name: 'vdiSessions',
    query: { id: sessionId },
  });
};

defineExpose({
  itemId: props.item.id,
  isSelected,
  select: toggleMachineSelection,
  unselect: () => {
    isSelected.value = false;
  },
  unselectAllButOneById: (id: number) => {
    if (id !== props.item.id) isSelected.value = false;
  },
});
</script>
