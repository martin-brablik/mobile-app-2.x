<template>
  <ion-app>
    <biometrics ref="biometricsRef" @on-authenticated="hideBackground" @on-auth-requested="showBackground" />
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
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation';
import router from './router';

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

    onMounted(() => {

      //ScreenOrientation.lock(ScreenOrientation.ORIENTATIONS.PORTRAIT);

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

    const hideBackground = async () => {
      const route = computed(() => router.currentRoute.value.path).value;
      if (route == '/inventory') {
        await BarcodeScanner.resumeScanning();
        await BarcodeScanner.hideBackground();
        document.querySelector('body')?.classList.add('scanner-active');
      }
    }

    const showBackground = async () => {
      const route = computed(() => router.currentRoute.value.path).value;
      if(route == '/inventory') {
        await BarcodeScanner.pauseScanning();
        await BarcodeScanner.showBackground();
        document.querySelector('body')?.classList.remove('scanner-active');
      }
    }

    return { biometricsRef, hideBackground, showBackground };

  }
});

</script>