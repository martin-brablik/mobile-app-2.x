import { reactive } from 'vue';

export const globals = reactive({
  appUrl: `https://www.izus.${navigator.language == 'sk' ? 'sk' : 'cz'}/`,
  logoutQuery: '?logout=true',
});