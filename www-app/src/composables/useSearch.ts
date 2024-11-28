import { Ref, ref } from 'vue';

export function useSearch<T>({ filter }: { filter: keyof T | (keyof T)[] }) {
  const filteredItems: Ref<T[]> = ref([]);

  const search = (items: T[], value: string = '') => {
    filteredItems.value = items.reduce((acc: T[], item: T) => {
      if (typeof filter === 'string') {
        // parsing item's property to string to use `includes` method and
        // avoiding property value to be a string 'null' or 'undefined'
        const itemFound = String(item[filter] || '').includes(value);
        if (itemFound) acc.push(item);
      } else if (Array.isArray(filter)) {
        const itemFound = filter.find((f) => String(item[f] || '').includes(value));
        if (itemFound) acc.push(item);
      }

      return acc;
    }, []);
  };

  return { search, filteredItems };
}
