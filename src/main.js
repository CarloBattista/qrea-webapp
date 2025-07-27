import { createApp } from 'vue';
import './style/style.css';
import App from './App.vue';

import router from './routing/router';
import i18n from './lib/i18n';

const app = createApp(App);
app.use(router);
app.use(i18n);
app.mount('#app');
