import { App } from 'vue';
import PrimeVue, { PrimeVueConfiguration } from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import { definePreset } from '@primevue/themes';

const Greenion = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#effcf3',
      100: '#dffae8',
      200: '#cff8dc',
      300: '#bff6d1',
      400: '#aff4c6',
      500: '#8cc39e',
      600: '#699276',
      700: '#46614f',
      800: '#233027',
      900: '#000000',
    },
    red: {
      50: '#fbd2d2',
      100: '#f7a6a5',
      200: '#f37a78',
      300: '#ef4e4b',
      400: '#ec221f',
      500: '#d41e1b',
      600: 'a51715',
      700: '76110f',
      800: '460a09',
      900: '170303',
    },
  },
});

const primevueOptions: PrimeVueConfiguration = {
  theme: {
    preset: Greenion,
    options: {
      darkModeSelector: '.dark',
    },
  },
};

export default (app: App) => {
  app.use(PrimeVue, primevueOptions);
  app.use(ToastService);
};
