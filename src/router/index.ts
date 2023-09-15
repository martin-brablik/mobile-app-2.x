import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import LoginPage from '../views/LoginPage.vue';
import HomePage from '../views/HomePage.vue';
import AboutPage from '../views/AboutPage.vue';
import InventoryPage from '../views/InventoryPage.vue';
import BiometricsSettingsPage from '../views/BiometricsSettingsPage.vue';
import SettingsPage from '../views/SettingsPage.vue';
import store from '../store';
import { computed } from 'vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: computed(() => store.getters.getAutoLogin).value && computed(() => store.getters.getUsername).value && computed(() => store.getters.getPassword).value ? 
      '/home/login=true' : (computed(() => store.getters.getIsSignedIn).value ? '/home/login=false' : 'login/error=none'),
  },
  {
    path: '/home/login=:login',
    name: 'home',
    component: HomePage,
    props: () => ({
      url: store.getters.getUrl,
      login: false
    }),
    meta: {
      hasMenu: true
    }
  },
  {
    path: '/login/error=:error',
    name: 'login',
    component: LoginPage,
    props: () => ({
      error: ''
    }),
    meta: {
      hasMenu: false
    }
  },
  {
    path: '/about',
    component: AboutPage,
    meta: {
      hasMenu: true
    }
  },
  {
    path: '/inventory',
    component: InventoryPage,
    meta: {
      hasMenu: false
    }
  },
  {
    path: '/settings',
    component: SettingsPage,
    meta: {
      hasMenu: true
    }
  },
  {
    path: '/binometricsSettings',
    component: BiometricsSettingsPage,
    meta: {
      hasMenu: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
