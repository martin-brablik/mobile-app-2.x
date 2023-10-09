<template>
  <ion-app>
    <biometrics ref="biometricsRef" @on-authenticated="hideBackground" />
    <ion-router-outlet id="main-content"></ion-router-outlet>
    <Menu v-if="hasMenu" />
  </ion-app>
</template>

<script lang="ts">

import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { computed, defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { App } from '@capacitor/app';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import Biometrics from '@/components/Biometrics.vue';
import Menu from '@/components/Menu.vue';
import { useRoute } from 'vue-router';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation';
import router from './router';
import { globals } from './globals';
import store from './store';

export default defineComponent({
  name: 'App',
  components: { IonApp, IonRouterOutlet, Biometrics, Menu },
  computed: {
    hasMenu() {
      return this.$route.meta.hasMenu;
    },
  },
  setup() {
    const biometricsRef = ref<typeof Biometrics | null>(null);  
    const route = useRoute();
    const currentRoute = route.path;

    onMounted(() => {
      console.log(globals.appUrl);

      ScreenOrientation.lock(ScreenOrientation.ORIENTATIONS.PORTRAIT);

      if(biometricsRef.value !== null) {
        biometricsRef.value.openBiometry();
      }

      App.addListener('resume', () => {
        if(biometricsRef.value !== null && !biometricsRef.value.getUnlockTried()) {
          biometricsRef.value.openBiometry();
        }
      });

      App.addListener('pause', () => {
        if(biometricsRef.value !== null && !biometricsRef.value.getAppLock()) {
          biometricsRef.value.setUnlockTried(false);
        }
      });

      onBeforeUnmount(() => {
        App.removeAllListeners();
      });

      window.addEventListener('message', handleMessage);
    });

    const handleMessage = (event: MessageEvent) => {
      if (event.data.location) {
        router.push(event.data.location);
      }
    }

    const hideBackground = () => {
      if (currentRoute == '/inventory') {
        BarcodeScanner.hideBackground();
        document.querySelector('body')?.classList.add('scanner-active');
      }
    }

    return { biometricsRef, currentRoute, hideBackground };

  }
});

</script>