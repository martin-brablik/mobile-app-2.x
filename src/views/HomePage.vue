<template>
  <ion-page>
    <ion-content id="main-content" :scroll-events="true">
      <div style="height: 100%; width: 100%;">
        <iframe class="izus" id="izus" ref="izusRef" :src="reactiveUrlRef">izus</iframe>
      </div>
      <ion-modal :is-open="isLoadingRef" :fullscreen="true" @willPresent="getRandomTip();">
        <div class="loading">
          <ion-img class="ion-padding" :src="iZUS_pruhl" />
          <div class="lds-dual-ring"></div>
          <article v-if="localeRef == 'cs' || localeRef == 'sk'" class="tip ion-padding">
            <h4 ref="didYouKnowHeadingRef"></h4>
            <p> {{ loadingTipRef }}</p>
          </article>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import { IonContent, IonPage, IonModal, IonImg, onIonViewWillEnter, useIonRouter, onIonViewDidEnter } from '@ionic/vue';
import { Ref, ref, onMounted, computed } from 'vue';
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

const izusRef: Ref<HTMLIFrameElement | undefined | any> = ref();
const reactiveUrlRef = ref(computed(() => store.getters.getUrl).value);
const autoLoginRef = ref(computed(() => store.getters.getAutoLogin).value);
const usernameRef = ref(computed(() => store.getters.getUsername).value);
const passwordRef = ref(computed(() => store.getters.getPassword).value);
const isSignedInRef = ref(computed(() => store.getters.getIsSignedIn).value);
const authTriedRef = ref(false);
const isLoadingRef = ref();
const loadingTipRef = ref();
const localeRef = ref(computed(() => store.getters.getLanguage).value);
const didYouKnowHeadingRef : Ref<HTMLElement | undefined> = ref();

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
  console.log('entering');
  authTriedRef.value = false;
  reactiveUrlRef.value = computed(() => store.getters.getUrl).value;
  isSignedInRef. value = computed(() => store.getters.getIsSignedIn).value;
  usernameRef.value = computed(() => store.getters.getUsername).value;
  passwordRef.value = computed(() => store.getters.getPassword).value;
  reactiveUrlRef.value = computed(() => store.getters.getUrl).value;
  localeRef.value = computed(() => store.getters.getLanguage).value;
  console.log(localeRef.value);

  if(reactiveUrlRef.value.includes(globals.logoutQuery)) {
    signOut();
  }

  if(route.params.login == 'true' && !isSignedInRef.value) {
    isLoadingRef.value = true;
    setTimeout(() => {
      if(isLoadingRef.value) {
        isLoadingRef.value = false;
        signOut('messageException');
      }
    }, 10000);
    signIn();
  }
});

onIonViewDidEnter(async () => {
  await fetchTips();
  getRandomTip();
});

const getSignInPost = () => {
  const username = usernameRef.value;
  const password = passwordRef.value;
  const sugar = Math.floor(Math.random() * 900000) + 100000;
  const password_hmac = SHA1(MD5(enc.Latin1.parse(password + username)).toString().toLocaleLowerCase('sk-SK') + sugar).toString().toLocaleLowerCase('sk-SK');
  const postData = { sugar: sugar, password_hmac: password_hmac, username: username, prepassword: 'Heslo' };

  return postData;
}

const signIn = () => {
  const sendLoginRequest = () => {
    if (!authTriedRef.value && !isSignedInRef.value && !reactiveUrlRef.value.includes(globals.logoutQuery)) {
      izusRef.value.contentWindow?.postMessage({ login: getSignInPost() }, "*");
      store.dispatch('updateIsSignedIn', true);
      authTriedRef.value = true;
    }
  }

  let url = new URL(izusRef.value.src.toString());
  url.searchParams.append('logout', 'true');
  izusRef.value.src = url.toString();

  if (!authTriedRef.value) {
    izusRef.value.addEventListener('load', () => {
      setTimeout(sendLoginRequest, 100);
    });
  }
};

const signOut = (error: string = 'none') => {
  store.dispatch('updateIsSignedIn', false);
  store.dispatch('updateUrl', globals.appUrl + globals.logoutQuery);
  store.dispatch('updateUsername', '');
  store.dispatch('updatePassword', '');
  reactiveUrlRef.value = globals.appUrl + globals.logoutQuery;
  router.push({ name: 'login', params: { error: error } });
};

const handleMessage = (event: MessageEvent) => {
  isLoadingRef.value = false;

  if (event.data.loginResult) {
    authTriedRef.value = true;

    if(event.data.loginResult !== 'ok') {
      store.dispatch('updateIsSignedIn', false);
      router.push({ name: 'login', params: { error: event.data.loginResult } });
    }
    else {
      store.dispatch('updateIsSignedIn', true);
    }
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
    loadingTipRef.value = tips[index].nadpis;

    if(didYouKnowHeadingRef != undefined && didYouKnowHeadingRef.value != undefined) {
      didYouKnowHeadingRef.value.innerText = tm('did_you_know').toString();
    }
  }
  catch(error) {
    console.log('tips not loaded yet');
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
  width: 48px;
  height: 48px;
  transform: translateX(-25%);
}

.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 48px;
  height: 48px;
  margin: 8px;
  border-radius: 50%;
  border: 6px solid #D67E29;
  border-color: #D67E29 transparent #D67E29 transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}

@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
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