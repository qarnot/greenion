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
        <span class="w-12 sm:w-36">
          {{ item.id }}
        </span>

        <span>
          {{ machine?.externalIp }}:{{ machine?.externalPort }}
        </span>
      </div>
      <div
        v-if="item.closedAt"
        class="bg-zinc-900 p-2 rounded-lg">
        CLOSED
      </div>
      <div
        v-else
        class="bg-primary text-zinc-900 p-2 rounded-lg">
        RUNNING
      </div>
    </template>
  </Card>
</template>

<script lang="ts" setup>
import {
  PropType, ref, ComputedRef, computed,
} from 'vue';
import { Session } from '../../types/session';
import { Machine } from '../../types/machine';

const emit = defineEmits(['toggle-selection']);
const props = defineProps({
  item: {
    type: Object as PropType<Session>,
    default: () => ({}),
  },
});

const isSelected = ref(false);
const selectedCardClasses = ref('border border-primary');
const machine: ComputedRef<Machine | undefined> = computed(
  () => props.item.userMachine?.machine,
);

const toggleMachineSelection = () => {
  isSelected.value = !isSelected.value;
  emit('toggle-selection', props.item);
};

defineExpose({
  itemId: props.item.id,
  isSelected,
  select: toggleMachineSelection,
  unselect: () => {
    isSelected.value = false;
  },
});
</script>
