import { Ref, ref } from 'vue';

export function useIntervalRefresh(refreshCallback: Function) {
  const intervalId: Ref<null | number> = ref(null);
  const intervalMs: Ref<number> = ref(15000);

  const toggleInterval = (setNewInterval: boolean) => {
    if (intervalId.value) {
      clearInterval(intervalId.value);
      intervalId.value = null;
    }

    if (!setNewInterval) return;

    intervalId.value = setInterval(refreshCallback, intervalMs.value);
  };

  const startInterval = () => {
    refreshCallback();
    toggleInterval(true);
  };

  const stopInterval = () => {
    toggleInterval(false);
  };

  return {
    startInterval,
    stopInterval,
  };
}
