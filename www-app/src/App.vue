<template>
  <div>
    <AppBar />

    <Tabs
      :value="currentTab"
      @update:value="handleTabChange">
      <TabList
        :pt="{
          tabList: {
            class: 'justify-center !bg-transparent !border-0',
          },
          activeBar: {
            class: '!hidden'
          },
        }">
        <Tab :value="MACHINE_TAB_ID">
          Machines
        </Tab>

        <Tab :value="SESSION_TAB_ID">
          VDI Sessions
        </Tab>
      </TabList>

      <TabPanels
        class="!bg-transparent">
        <TabPanel
          :value="currentTab">
          <RouterView />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <Toast />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import globalEmitter from './services/emitter';

import AppBar from './components/layout/AppBar.vue';

const MACHINE_TAB_ID = 0;
const SESSION_TAB_ID = 1;

const router = useRouter();
const route = useRoute();

const currentTab = ref(MACHINE_TAB_ID);
globalEmitter.on('select-machine-view', () => { currentTab.value = MACHINE_TAB_ID; });
globalEmitter.on('select-session-view', () => { currentTab.value = SESSION_TAB_ID; });

const availableRoutes = computed(
  () => router.getRoutes().filter(({ name }) => !!name),
);

const handleTabChange = (value: number) => {
  currentTab.value = value;
  switch (value) {
    case SESSION_TAB_ID:
      return router.push({ name: 'vdiSessions' });
    case MACHINE_TAB_ID:
    default:
      return router.push({ name: 'machines' });
  }
};

onMounted(async () => {
  if (route.path.startsWith('/login')) router.push({ name: 'machines' });

  // we need to wait if the targetted page is vdi-seesions
  // for the tab to be correctly selected
  setTimeout(() => {
    currentTab.value = availableRoutes.value.findIndex(
      ({ name }) => route.name === name,
    );
  }, 100);
});
</script>
