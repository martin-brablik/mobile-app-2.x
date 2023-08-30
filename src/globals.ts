import { reactive } from 'vue';

export const globals = reactive({
  appUrl: 'http://localhost',
  logoutQuery: '?logout=true',
});