import { createApp } from 'vue';
import './style/style.css';
import App from './App.vue';

import router from './routing/router';
import i18n, { getCurrentLocale, initializeMetaTags } from './lib/i18n';

const app = createApp(App);
app.use(router);
app.use(i18n);

document.documentElement.lang = getCurrentLocale();
initializeMetaTags();

app.mount('#app');
