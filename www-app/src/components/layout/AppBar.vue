<template>
  <Toolbar class="!rounded-none">
    <template #start>
      <GreenionLogo />
    </template>

    <template #end>
      <div class="flex items-center">
        <span class="mr-4 hidden sm:block">
          {{ store.userInfos.email }}
        </span>

        <Button
          rounded
          severity="secondary"
          :icon="PrimeIcons.USER"
          @click="userMenu?.toggle" />

        <Menu
          ref="userMenu"
          :model="menuItems"
          popup />
      </div>
    </template>
  </Toolbar>
</template>

<script lang="ts" setup>
import { PrimeIcons } from '@primevue/core/api';
import {
  PropType, Ref, ref, useTemplateRef,
} from 'vue';
import type { MenuItem } from 'primevue/menuitem';
import GreenionLogo from '../icons/GreenionLogo.vue';
import { User } from '../../types/user';
import { useUserStore } from '../../stores/user';

const props = defineProps({
  userInfos: {
    type: Object as PropType<User>,
    default: () => ({}),
  },
});

const userMenu = useTemplateRef<MenuItem>('userMenu');
const store = useUserStore();
const menuItems: Ref<MenuItem[]> = ref([{
  label: props.userInfos.email,
  class: 'sm:hidden',
  items: [{
    label: 'Logout',
    icon: PrimeIcons.SIGN_OUT,
    url: '/api/v1/auth/logout',
  }],
}]);
</script>
