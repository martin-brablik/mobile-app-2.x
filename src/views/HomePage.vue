<template>
  <ion-page>
    <ion-header></ion-header>
    <ion-content id="main-content" :scroll-events="true" safe-area>
      <div style="height: 100%; width: 100%;">
        <iframe v-if="isOnlineRef" class="izus" id="izus" ref="izusRef" :src="reactiveUrlRef" allow="geolocation 'self' https://www.izus.cz; storage-access *">izus</iframe>
        <div v-if="!isOnlineRef" id="offline-page" class="ion-padding">
          <img :src="logoRef" alt="" >
          <ion-button shape="round" @click="restoreConnection()"><ion-icon slot="icon-only" :icon="refresh"></ion-icon></ion-button>
          <article id="offline-text">
            <img :src="wifi_off" alt="" width="32" height="32">
            <p>{{ $tm('offline') }}</p>
          </article>
        </div>
      </div>
      <ion-modal :isOpen="isLoadingOpenRef" :fullscreen="true" tappable @click="pauseLoading(!isLoadingPausedRef)">
        <div class="loading">
          <ion-img class="ion-padding" :src="logoRef" />
          <div class="lds-dual-ring">
            <div ref="ringRef" class="lds-dual-ring-symbol"></div>
          </div>
          <article v-if="(localeRef == 'cs' || localeRef == 'sk') && tipsLoadedRef" class="tip ion-padding">
            <h4 ref="didYouKnowHeadingRef">{{ tm('did_you_know') }}</h4>
            <p ref="didYouKnowContentRef">{{ loadingTipRef.nadpis }}</p>
            <p  :style="isLoadingPausedRef ? '' : 'color: var(--ion-color-medium)'" ref="didYouKnowTextRef">{{ isLoadingPausedRef ? loadingTipRef.text : (tm('read_more') + ' ') }}<ion-icon v-if="!isLoadingPausedRef" :icon="caretDown"></ion-icon></p>
          </article>
          <article v-if="(localeRef == 'cs' || localeRef == 'sk') && !tipsLoadedRef" class="tip ion-padding skeleton">
              <h4><ion-skeleton-text :animated="true" style="width: 11ch;"></ion-skeleton-text></h4>
              <p><ion-skeleton-text :animated="true" style="width: 25ch;"></ion-skeleton-text></p>
              <p><ion-skeleton-text :animated="true" style="width: 11ch;"></ion-skeleton-text></p>
          </article>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import { IonContent, IonPage, IonHeader, IonModal, IonImg, IonSkeletonText, onIonViewWillEnter, useIonRouter, onIonViewDidEnter, onIonViewWillLeave } from '@ionic/vue';
import { caretDown, refresh } from 'ionicons/icons';
import { Ref, ref, onMounted, computed } from 'vue';
import { App } from '@capacitor/app';
import store from '@/store';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation';
import { useRoute } from 'vue-router';
import { globals } from '@/globals';
import iZUS_pruhl from '@/assets/images/iZUS_pruhl.png';
import izus_inverzni_podoba from '@/assets/images/izus_inverzni_podoba.png';
import izus_vanoce from '@/assets/images/vanoce_izus.png';
import izus_vanoce_inverzni from '@/assets/images/vanoce_izus_inverzni.png';
import wifi_off from '@/assets/images/wifi_off.svg';
import { useI18n } from 'vue-i18n';
import { Network } from '@capacitor/network'

const props = defineProps({
  login: {
    type: Boolean,
    required: false
  }
});

const router = useIonRouter();
const route = useRoute();
const { tm } = useI18n();

let tips : any;
let loginAttempt = 1;

const izusRef: Ref<HTMLIFrameElement | undefined | any> = ref();
const reactiveUrlRef = ref(computed(() => store.getters.getUrl).value);
const autoLoginRef = ref(computed(() => store.getters.getAutoLogin).value);
const usernameRef = ref(computed(() => store.getters.getUsername).value);
const passwordRef = ref(computed(() => store.getters.getPassword).value);
const isSignedInRef = ref(computed(() => store.getters.getIsSignedIn).value);
const authFailedRef = ref(false);
const isLoadingRef = ref();
const isLoadingOpenRef = ref();
const loadingTipRef = ref();
const localeRef = ref(computed(() => store.getters.getLanguage).value);
const didYouKnowHeadingRef : Ref<HTMLElement | undefined> = ref();
const didYouKnowContentRef: Ref<HTMLElement | undefined> = ref();
const didYouKnowTextRef: Ref<HTMLElement | undefined> = ref();
const isLoadingPausedRef = ref(false);
const ringRef : Ref<HTMLElement | undefined> = ref();
const tipsLoadedRef = ref(false);
const isOnlineRef = ref(true);
let logoRef: Ref<string | undefined> = ref();

onMounted(async () => {

  if(new Date().getMonth() == 11) {
    logoRef = ref(window.matchMedia('(prefers-color-scheme: dark)').matches ? izus_vanoce_inverzni : izus_vanoce);
  }
  else {
    logoRef = ref(window.matchMedia('(prefers-color-scheme: dark)').matches ? izus_inverzni_podoba : iZUS_pruhl);
  }

  if(computed(() => store.getters.getLanguage).value === 'sk') {
    const url = new URL(reactiveUrlRef.value);

    url.searchParams.set('lang', 'sk');
    reactiveUrlRef.value = url.toString();
    store.dispatch('updateUrl', url.toString());
  }

  authFailedRef.value = false;
  izusRef.value.addEventListener('load', () => {
    izusRef.value.contentWindow?.postMessage({ setCookie: true }, '*');
  });

  if (autoLoginRef.value && route.params.login == 'true') {
    await signIn();
  }

  window.addEventListener('message', handleMessage);

  App.addListener('backButton', () => {
    izusRef.value?.contentWindow?.history.back();
  });

  Network.addListener('networkStatusChange', status => {
    isOnlineRef.value = status.connected;
  })
});

onIonViewWillEnter(() => {
  ScreenOrientation.unlock();

  reactiveUrlRef.value = computed(() => store.getters.getUrl).value;
  isSignedInRef. value = computed(() => store.getters.getIsSignedIn).value;
  usernameRef.value = computed(() => store.getters.getUsername).value;
  passwordRef.value = computed(() => store.getters.getPassword).value;
  localeRef.value = computed(() => store.getters.getLanguage).value;
  tipsLoadedRef.value = false;

  loginAttempt = 1;

  if(reactiveUrlRef.value.includes(globals.logoutQuery)) {
    signOut();
  }

  if(route.params.login == 'true' && !getStatus()) {
    startLoading();
    setTimeout(() => {
      stopLoading();
    }, 20000);
  }
});

const returnTips = async () => {
  await fetchTips();
  getRandomTip();
}

onIonViewDidEnter(async () => {
  if(authFailedRef.value) {
    authFailedRef.value = false;
    await signIn();
  }

  await returnTips();

  tipsLoadedRef.value = true;
  if(didYouKnowHeadingRef.value && loadingTipRef.value.nadpis) {
    didYouKnowHeadingRef.value.innerText = tm('did_you_know');
  }

  if(didYouKnowContentRef.value) {
    didYouKnowContentRef.value.innerText = loadingTipRef.value ? loadingTipRef.value.nadpis : '';
  }

  if (didYouKnowTextRef.value) {
    didYouKnowTextRef.value.innerText = loadingTipRef.value ? loadingTipRef.value.text : '';
  }
});

onIonViewWillLeave(() => {
  ScreenOrientation.lock(ScreenOrientation.ORIENTATIONS.PORTRAIT);
  store.dispatch('updateUrl', reactiveUrlRef.value);
  store.dispatch('updateIsSignedIn', isSignedInRef.value);
  izusRef.value.src = izusRef.value.src;
  stopLoading();
});

const getSignInPost = () => {
  const validateCredential = (credential: string | undefined | null) => credential && credential.length != 0 && credential !== '' ? credential : null;
  const username = validateCredential(usernameRef.value) ?? 'neexistujici_uzivatel';
  const password = validateCredential(passwordRef.value) ?? 'neexistujici_heslo';
  const sugar = Math.floor(Math.random() * 900000) + 100000;
  const passwordHmac = globals.hmac(username, password, sugar.toString());
  const postData = { sugar: sugar, password_hmac: passwordHmac, username: username, prepassword: 'Heslo' };

  return postData;
};

const getStatus = () => {
  return isSignedInRef.value;
}

const signIn = async () => {
  if(izusRef.value && izusRef.value.contentWindow) {
    izusRef.value.contentWindow?.postMessage({ login: getSignInPost() }, '*');
  }
};

const signOut = (error: string = 'none') => {
  updateStatus(false);
  updateUrl(globals.appUrl + globals.logoutQuery);
  router.push({ name: 'login', params: { error: error } });
};

const handleMessage = async (event: MessageEvent) => {
  if(event.data.status === 'loaded' && !reactiveUrlRef.value.includes(globals.logoutQuery) && route.params.login == 'true' && !getStatus()) {
    // Poslat požadavek na přihlášení pokud je přenačtena strana a nejde o odhlášení a uživatel se pokusil přihlásit a uživatel není přihlášen
    await signIn();
  }
  else if(event.data.status === 'signed in') {
    store.dispatch('updateVariant', event.data.variant ?? 'www');
    await updateStatus(true, event.data.token, event.data.user_perm, event.data.nf_majetek);
    stopLoading();
  }
  else if(event.data.status === '2fa') {
    stopLoading();
  }
  else if(event.data.status === 'error') {
    if(loginAttempt < 2) {
      updateUrl(globals.appUrl + globals.logoutQuery);
      loginAttempt++;
    }
    else {
      updateStatus(false);
      authFailedRef.value = true;
      router.push({ name: 'login', params: { error: 'messageException' } });
    }
  }
  else if(event.data.loginResult && event.data.loginResult !== 'ok') {
    updateStatus(false);
    authFailedRef.value = true;
    router.push({ name: 'login', params: { error: event.data.loginResult } });
  }

  if (event.data.action) {
    switch (event.data.action) {
      case 'exit':
        App.exitApp();
        break;
      case 'logout':
        signOut();
        break;
    }
  }
}

const startLoading = () => {
  isLoadingOpenRef.value = true;
  isLoadingRef.value = true;
};

const stopLoading = () => {
  if (isLoadingRef.value) {
    isLoadingRef.value = false;

    if (!isLoadingPausedRef.value) {
      isLoadingOpenRef.value = false;
    }
  }
};

const updateStatus = async (value: boolean, authToken = '', userPerm = 0, nfInventory = 0) => {
  isSignedInRef.value = value;
  store.dispatch('updateIsSignedIn', value);
  store.dispatch('updateUserPerm', userPerm);
  store.dispatch('updateNfInventory', nfInventory);
}

const updateUrl = (url: string) => {

  const urlObj = new URL(url);

  if(computed(() => store.getters.getLanguage).value === 'sk') {
    urlObj.searchParams.set('lang', 'sk');
  }

  reactiveUrlRef.value = urlObj.toString();
  store.dispatch('updateUrl', url.toString());
  
  if(izusRef.value) {
    izusRef.value.src = url.toString();
  }
}

const fetchTips = async () => {
  try {
    const response = await fetch(globals.appUrl + 'ws/vite_ze/');
    tips = await response.json();
  }
  catch (e) {
    console.log(e);
  }
}

const getRandomTip = () => {
  try {
    const index = Math.floor(Math.random() * tips.length);
    loadingTipRef.value = tips[index] ?? '';
  }
  catch(error) {
    console.log('tips still loading...');
  }
}

const pauseLoading = (value: boolean) => {
  isLoadingPausedRef.value = value;

  if(ringRef && ringRef.value) {
    if(value) {
      ringRef.value.classList.add('lds-dual-ring-symbol-idle');
     }
     else {
      ringRef.value.classList.remove('lds-dual-ring-symbol-idle');

      if(!isLoadingRef.value && isLoadingOpenRef.value) {
        isLoadingOpenRef.value = false;
      }
     }
  }
}

const restoreConnection = async () => {
  const status = await Network.getStatus();
  isOnlineRef.value = status.connected;
}

</script>

<style scoped>

ion-header {
  margin-top: var(--ion-safe-area-top) !important;
  margin-top: constant(safe-area-inset-top) !important; /* iOS 11.0 - 11.2 */
  margin-top: env(safe-area-inset-top) !important; /* iOS 11.3+ */
  margin-bottom: var(--ion-safe-area-bottom) !important;
  margin-bottom: constant(safe-area-inset-bottom) !important; /* iOS 11.0 - 11.2 */
  margin-bottom: env(safe-area-inset-bottom) !important; /* iOS 11.3+ */
  margin-left: var(--ion-safe-area-left) !important;
  margin-left: constant(safe-area-inset-left) !important; /* iOS 11.0 - 11.2 */
  margin-left: env(safe-area-inset-left) !important; /* iOS 11.3+ */
  margin-right: var(--ion-safe-area-right) !important;
  margin-right: constant(safe-area-inset-right) !important; /* iOS 11.0 - 11.2 */
  margin-right: env(safe-area-inset-right) !important; /* iOS 11.3+ */
}

#offline-page {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 2em;
}

ion-modal {
  .modal-wrapper {
    width: 100% !important;
    height: 100% !important;
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.lds-dual-ring {
  display: inline-block;
  width: 64px;
  height: 64px;
}

.lds-dual-ring-symbol {
  content: " ";
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 6px solid #D67E29;
  border-color: #D67E29 transparent #D67E29 transparent;
  animation: lds-dual-ring 1.2s linear infinite;
  transition: border-color 0.25s linear;
}

.lds-dual-ring-symbol-idle {
  border-color: #D67E29;
}

@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

#loading-pause {
  position: relative;
  top: 0;
  right: 0;
}

  .izus {
    position: relative;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 99%;
    height: 100%;
    border: none;
  }

  ion-modal {
  --width: 100%;
  --height: 100%;
}

article {
  text-align: center;
  margin-top: 1em;
  position: absolute;
  bottom: 0;
}

article.skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
}

</style>
