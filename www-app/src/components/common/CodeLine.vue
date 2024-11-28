<template>
  <pre class="bg-zinc-900 flex pl-5 pr-2 py-2 rounded-lg justify-between items-center">
    <code
      class="opacity-70"
      style="font-size: 1.2rem">{{ text }}</code>
    <Button
      text
      severity="secondary"
      :icon="PrimeIcons.CLONE"
      @click="copyToClipboard(text)" />
  </pre>
</template>

<script lang="ts" setup>
import { PrimeIcons } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { inject } from 'vue';
import { Logger } from '../../types/logger';

const logger = inject<Logger>('logger');
const toast = useToast();
defineProps({
  text: {
    type: String,
    default: '',
  },
});

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Succesfully copied to clipboard',
      life: 3000,
    });
  } catch (error: any) {
    logger?.error('Unable to copy text to clipboard. Error:', error.message);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occured while copying IP address to clipboard',
      life: 3000,
    });
  }
};
</script>
