<template>
  <div>
    <InputText
      placeholder="Search"
      class="mx-auto my-8 block !bg-white !text-zinc-800 !rounded-full"
      @update:model-value="search(store.machines, $event)" />

    <DataList
      ref="machineList"
      class="lg:w-1/2 mx-auto"
      :items="filteredMachines"
      :first="first"
      @item-selected="selectedMachine = $event">
      <template #header>
        <div class="h-[42px] flex items-center">
          <span class="w-12">
            ID
          </span>
          <span class="w-24 md:w-32 mr-8">
            Name
          </span>
          <span class="w-36 mr-8">
            Public Machine IP
          </span>
        </div>
      </template>
    </DataList>

    <MachineSideView
      v-model="showSideView"
      :machine="selectedMachine"
      @hide-drawer="hideDrawer" />
  </div>
</template>

<script lang="ts" setup>
import {
  Ref, ref, onMounted, watch,
  useTemplateRef,
  inject,
  onUnmounted,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { Machine } from '../types/machine.ts';
import DataList from '../components/common/DataList.vue';
import MachineSideView from '../components/machines/MachineSideView.vue';
import { useUserStore } from '../stores/user.ts';
import { useSearch } from '../composables/useSearch.ts';
import { useIntervalRefresh } from '../composables/useIntervalRefresh.ts';
import { Logger } from '../types/logger.ts';

const logger = inject<Logger>('logger');
const router = useRouter();
const store = useUserStore();
const toast = useToast();
const machineListRef = useTemplateRef<typeof DataList>('machineList');
const route = useRoute();
const { search, filteredItems: filteredMachines } = useSearch<Machine>(
  { filter: ['name', 'ip', 'port', 'externalIp', 'externalPort'] },
);

store.$subscribe((_, state) => {
  filteredMachines.value = state.machines;
});

const selectedMachine: Ref<Machine> = ref({} as Machine);
const showSideView: Ref<boolean> = ref(false);
const first: Ref<number> = ref(0);

const fetchMachines = async () => {
  try {
    await store.fetchMachines();
  } catch (error: any) {
    logger?.error('Unable to fetch machines. Error:', error.message);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occured while fetching machine list',
      life: 3000,
    });
  }
};
const { startInterval, stopInterval } = useIntervalRefresh(fetchMachines);

const hideDrawer = () => {
  showSideView.value = false;
  machineListRef.value?.unselectItem(selectedMachine.value);
  selectedMachine.value = {} as Machine;
};

watch(() => selectedMachine.value, (value) => {
  showSideView.value = !!Object.values(value).length;
  router.push({ name: route.name, query: { id: value.id } });
});

onMounted(async () => {
  startInterval();
  filteredMachines.value = store.machines;
  if (route.query.id) {
    // ignoring that route.query.id may be null because
    // we already test if route.query.id is defined with a value earlier
    // @ts-ignore
    const itemIndex = store.machines.findIndex((m: Machine) => m.id === +route.query.id);
    if (itemIndex !== -1) {
      first.value = Math.floor(itemIndex / 10) * 10;
      setTimeout(() => {
        machineListRef.value?.selectItem(store.machines[itemIndex]);
      }, 100);
      selectedMachine.value = store.machines[itemIndex];
      showSideView.value = true;
    }
  }
});

onUnmounted(stopInterval);
</script>
