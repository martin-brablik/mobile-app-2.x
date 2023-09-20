import { reactive } from 'vue';

export const globals = reactive({
  appUrl: 'http://10.0.0.26',
  //appUrl: `https://www.izus.${navigator.language == 'sk' ? 'sk' : 'cz'}/`,
  logoutQuery: '?logout=true',
});