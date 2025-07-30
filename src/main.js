import { createApp } from 'vue';
import './style/style.css';
import { createNotivue } from 'notivue';

import App from './App.vue';

import 'notivue/notification.css';
import 'notivue/animations.css';

import router from './routing/router';
import i18n, { getCurrentLocale, initializeMetaTags } from './lib/i18n';

const app = createApp(App);

const notivue = createNotivue({
  position: 'top-center',
  limit: 4,
  enqueue: true,
  avoidDuplicates: true,
  pauseOnHover: true,
  notifications: {
    global: {
      duration: 5000,
    },
  },
});

app.use(router);
app.use(notivue);
app.use(i18n);

document.documentElement.lang = getCurrentLocale();
initializeMetaTags();

app.mount('#app');
