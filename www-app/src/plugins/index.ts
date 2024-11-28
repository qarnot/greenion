import { App } from 'vue';
import primevue from './primevue';
import pinia from './pinia';
import router from './router';
import logger from './logger';

export default {
  install(app: App) {
    app.use(primevue);
    app.use(pinia);
    app.use(router);
    app.use(logger);
  },
};
