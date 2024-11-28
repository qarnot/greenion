<template>
  <DataView
    :first="first"
    :value="items"
    :rows="10"
    :pt="{
      header: { class: '!bg-transparent !border-0' },
      content: { class: '!bg-transparent' },
    }"
    class="!border-transparent"
    data-key="id"
    paginator
    paginator-template="
      PrevPageLink
      PageLinks
      NextPageLink
    ">
    <template #header>
      <slot name="header" />
    </template>

    <template #list="{ items: list }">
      <component
        :is="component"
        v-for="item in list"
        :key="item.id"
        ref="itemsList"
        :item="item"
        class="mb-3"
        @toggle-selection="handleItemSelection" />
    </template>
  </DataView>
</template>

<script lang="ts" setup>
import {
  computed, PropType, Ref, ref, useTemplateRef,
} from 'vue';
import type { Machine } from '../../types/machine';
import type { Session } from '../../types/session';
import MachineListItem from '../machines/MachineListItem.vue';
import SessionListItem from '../sessions/SessionListItem.vue';

type ListItemComponentName = 'MachineListItem' | 'SessionListItem';
type ListItemComponent = typeof MachineListItem | typeof SessionListItem;

const emit = defineEmits(['item-selected']);
const props = defineProps({
  items: {
    type: Array as PropType<Array<Machine | Session>>,
    default: () => [],
  },
  itemComponent: {
    type: String as PropType<ListItemComponentName>,
    default: 'MachineListItem',
  },
  first: {
    type: Number,
    default: 0,
  },
});

const component = computed(() => {
  switch (props.itemComponent) {
    case 'MachineListItem':
      return MachineListItem;
    case 'SessionListItem':
      return SessionListItem;
    default:
      return null;
  }
});
const itemsRef = useTemplateRef<ListItemComponent>('itemsList');
const isDrawerOpen: Ref<boolean> = ref(false);

const getItemRef = (item: Machine | Session) => itemsRef.value?.find(
  (templateRef: any) => templateRef?.itemId === item.id,
);

const handleItemSelection = (item: Machine | Session) => {
  isDrawerOpen.value = true;
  emit('item-selected', item);
};

defineExpose({
  selectItem: (item: Machine | Session) => {
    getItemRef(item)?.select();
  },
  unselectItem: (item: Machine | Session) => {
    getItemRef(item)?.unselect();
  },
});
</script>

<style scoped>
.p-dataview :deep(.p-paginator-page),
.p-dataview :deep(.p-paginator-prev),
.p-dataview :deep(.p-paginator-next) {
  border-radius: .5rem;
}

.p-dataview :deep(.p-dataview-paginator-bottom) {
  border: none;
}

.p-dataview :deep(.p-paginator) {
  background: none;
}
</style>
