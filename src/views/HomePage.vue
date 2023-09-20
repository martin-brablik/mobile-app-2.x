<template>
  <ion-page>
    <ion-content id="main-content" :scroll-events="true">
      <div style="height: 100%; width: 100%;">
        <iframe class="izus" id="izus" ref="izusRef" :src="reactiveUrlRef">izus</iframe>
      </div>
      <ion-modal :isOpen="isLoadingOpenRef" :fullscreen="true" @willPresent="getRandomTip();" tappable @click="pauseLoading(!isLoadingPausedRef)">
        <div class="loading">
          <ion-img class="ion-padding" :src="iZUS_pruhl" />
          <div class="lds-dual-ring">
            <div ref="ringRef" class="lds-dual-ring-symbol"></div>
          </div>
          <article v-if="localeRef == 'cs' || localeRef == 'sk'" class="tip ion-padding">
            <h4 ref="didYouKnowHeadingRef">{{ '' }}</h4>
            <p ref="didYouKnowContentRef">{{ '' }}</p>
            <p ref="didYouKnowTextRef" v-if="isLoadingPausedRef">{{ '' }}</p>
          </article>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import { IonContent, IonPage, IonModal, IonImg, onIonViewWillEnter, useIonRouter, onIonViewDidEnter, onIonViewWillLeave, onIonViewDidLeave } from '@ionic/vue';
import { Ref, ref, onMounted, computed, onUnmounted } from 'vue';
import { SHA1, MD5, enc } from 'crypto-js';
import { App } from '@capacitor/app';
import store from '@/store';
import { useRoute } from 'vue-router';
import { globals } from '@/globals';
import iZUS_pruhl from '@/assets/images/iZUS_pruhl.png';
import { useI18n } from 'vue-i18n';

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

onMounted(() => {
  izusRef.value.addEventListener('load', () => {
    izusRef.value.contentWindow?.postMessage({ setCookie: true }, '*');
  });

  if (autoLoginRef.value && route.params.login == 'true') {
    signIn();
  }

  window.addEventListener('message', handleMessage);

  App.addListener('backButton', () => {
    izusRef.value?.contentWindow?.history.back();
  });
});

onIonViewWillEnter(() => {
  authFailedRef.value = false;
  reactiveUrlRef.value = computed(() => store.getters.getUrl).value;
  isSignedInRef. value = computed(() => store.getters.getIsSignedIn).value;
  usernameRef.value = computed(() => store.getters.getUsername).value;
  passwordRef.value = computed(() => store.getters.getPassword).value;
  localeRef.value = computed(() => store.getters.getLanguage).value;

  loginAttempt = 1;
  console.log('entered');
  console.log(izusRef.value.src);

  if(reactiveUrlRef.value.includes(globals.logoutQuery)) {
    signOut();
  }

  if(!getStatus()) {
    signIn();
  }

  console.log('status: ' + getStatus());
  if(route.params.login == 'true' && !getStatus()) {
    startLoading();
    setTimeout(() => {
      console.log('timeout');
      stopLoading();
    }, 20000);
  }
});

const returnTips = async () => {
  await fetchTips();
  getRandomTip();
}

onIonViewDidEnter(async () => {
  await returnTips();

  if(didYouKnowHeadingRef.value && loadingTipRef.value.nadpis) {
    didYouKnowHeadingRef.value.innerText = tm('did_you_know');
  }

  if(didYouKnowContentRef.value) {
    console.log('loadingTipRef: ' + loadingTipRef.value)
    didYouKnowContentRef.value.innerText = loadingTipRef.value ? loadingTipRef.value.nadpis : '';
  }

  if (didYouKnowTextRef.value) {
    didYouKnowTextRef.value.innerText = loadingTipRef.value ? loadingTipRef.value.text : '';
  }
});

onIonViewWillLeave(() => {
  store.dispatch('updateUrl', reactiveUrlRef.value);
  store.dispatch('updateIsSignedIn', isSignedInRef.value);
  izusRef.value.src = izusRef.value.src;
  stopLoading();
});

const getSignInPost = () => {
  const validateCredential = (credential: string | undefined | null) => credential && credential.length != 0 && credential !== '' ? credential : null;
  const username = validateCredential(usernameRef.value) ?? 'neexistujici_uzivatel';
  console.log(username);
  const password = validateCredential(passwordRef.value) ?? 'neexistujici_heslo';
  console.log(password);
  const sugar = Math.floor(Math.random() * 900000) + 100000;
  const password_hmac = SHA1(MD5(enc.Latin1.parse(password + username)).toString().toLocaleLowerCase('sk-SK') + sugar).toString().toLocaleLowerCase('sk-SK');
  const postData = { sugar: sugar, password_hmac: password_hmac, username: username, prepassword: 'Heslo' };

  return postData;
};

const getStatus = () => {
  return isSignedInRef.value;
}

const signIn = () => {
  if(izusRef.value && izusRef.value.contentWindow && !authFailedRef.value) {
    izusRef.value.contentWindow?.postMessage({ login: getSignInPost() }, '*');
  }
};

const signOut = (error: string = 'none') => {
  console.log('signOut');
  updateStatus(false);
  updateUrl(globals.appUrl + globals.logoutQuery);
  router.push({ name: 'login', params: { error: error } });
};

const handleMessage = (event: MessageEvent) => {
  console.log(event.data);
  if(event.data.status === 'loaded' && !reactiveUrlRef.value.includes(globals.logoutQuery)) {
    signIn();
  }
  else if(event.data.status === 'signed in') {
    updateStatus(true);
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
  console.log("Loading started");
  isLoadingOpenRef.value = true;
  isLoadingRef.value = true;
};

const stopLoading = () => {
  console.log('stop loading');
  console.log(isLoadingRef.value);
  console.log(isLoadingOpenRef.value);
  console.log(isLoadingPausedRef.value);
  if (isLoadingRef.value) {
    isLoadingRef.value = false;

    if (!isLoadingPausedRef.value) {
      console.log('hiding loading')
      isLoadingOpenRef.value = false;
      console.log(isLoadingOpenRef.value);
    }
  }
};

const updateStatus = (value: boolean) => {
  console.log('updateStatus');
  isSignedInRef.value = value;
  store.dispatch('updateIsSignedIn', value);
}

const updateUrl = (url: string) => {
  console.log('updateUrl');
  reactiveUrlRef.value = url;
  store.dispatch('updateUrl', url);
  console.log(reactiveUrlRef.value);
  
  if(izusRef.value) {
    izusRef.value.src = url;
  }
}

const fetchTips = async () => {
  try {
    const response = await fetch(globals.appUrl + '/ws/vite_ze');
    console.log(response);
    tips = await response.json();
  }
  catch (e) {
    console.log(e);
  }
}

const getRandomTip = () => {
  try {
    const index = Math.floor(Math.random() * tips.length);
    console.log(tips[index].nadpis);
    loadingTipRef.value = tips[index] ?? '';
  }
  catch(error) {
    console.log('tips not loaded yet');
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

</script>

<style scoped>

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

</style>