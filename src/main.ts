import { computed, createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { IonicVue } from '@ionic/vue';
import store from './store'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './theme/variables.css';

import { createI18n } from 'vue-i18n';
import cs from './locales/cs.js'
import sk from './locales/sk.js'
import ua from './locales/ua.js'
import en from './locales/en.js'

const i18n = createI18n({
  legacy: false,
  locale: computed(() => store.getters.getLanguage).value,
  fallbackLocale: 'cs',
  messages: { cs, sk, ua, en },
});

const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .use(store)
  .use(i18n);

router.isReady().then(() => {
  app.mount('#app');
});