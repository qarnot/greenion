import { App } from 'vue';

export default {
  install: (app: App) => {
    // no console rule disabled because we nedd usage of console.log
    app.provide('logger', {
      // eslint-disable-next-line no-console
      info: (...params: any[]) => console.log(...params),
      // eslint-disable-next-line no-console
      error: (...params: any[]) => console.error(...params),
    });
  },
};
