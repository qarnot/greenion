import { App } from 'vue';
import primevue from './primevue';

export default {
  install(app: App) {
    app.use(primevue);
  },
};
