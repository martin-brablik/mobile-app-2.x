import { reactive } from 'vue';

export const globals = reactive({
  appUrl: 'http://localhost/',
  //appUrl: 'https://www.izus.cz/',
  logoutQuery: '?logout=true',
});