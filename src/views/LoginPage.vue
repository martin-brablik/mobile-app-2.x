<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="viewport" :style="{backgroundImage: 'url(' + bg_login +')'}">
        <div class="container">
          <ion-img :src="iZUS_pruhl" alt="logo" />
          <p v-if="route.params.error && route.params.error !== 'none'" class="error">{{ $tm(route.params.error.toString()) }}</p>
          <form action="" @submit.prevent="signIn">
            <span style="display: flex; align-items: center;"><h2>{{ $tm('login_title') }}</h2><ion-button fill="clear" slot="icon-only" color="secondary" shape="round" size="small" @click="redirect('o_izus/napoveda/?returnUri=%2Findex.php#clanek_napovedy441-1/');"><ion-icon :icon="helpCircle"></ion-icon></ion-button></span>
            <ion-input v-model="usernameRef" :label="$tm('username').toString()" label-placement="floating" type="text" fill="solid" color="secondary" />
            <div class="password-input">
              <ion-input style="width: 80%;" v-model="passwordRef" :label="$tm('password').toString()" label-placement="floating" :type="showPasswordRef ? 'text' : 'password'" fill="solid" color="secondary" @keyup.enter="signIn" />
              <ion-checkbox class="eye" v-model="showPasswordRef" color="secondary" justify="space-between"></ion-checkbox>
            </div>
            <ion-checkbox v-model="remeberCredentialsRef" color="secondary" justify="space-between">{{ $tm('remember') }}</ion-checkbox>
            <ion-button expand="block" color="secondary" type="submit"><ion-icon slot="start" :icon="key"></ion-icon>{{ $tm('sign_in') }}</ion-button>
            <ion-button type="button" class="btn-clear lowercaseBtn" fill="clear" @click="redirect('');">{{ $tm('continue_without_login') }}</ion-button>
            <ion-button type="button" class="btn-clear lowercaseBtn" fill="clear" @click="redirect('nastaveni_uctu/nove_heslo/');">{{ $tm('forgot_password') }}</ion-button>
            <ion-button type="button" class="lowercaseBtn btn-clear" fill="clear" color="secondary" shape="round" size="small" @click="$router.push('/about')"><ion-icon :icon="informationCircle" slot="start"></ion-icon>{{ $tm('about_app') }}</ion-button>
          </form>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

import { IonContent, IonPage, IonInput, IonButton, IonCheckbox, IonImg, IonIcon, useIonRouter, onIonViewWillEnter } from '@ionic/vue';
import { key, informationCircle, helpCircle } from 'ionicons/icons';
import { useStore } from 'vuex';
import bg_login from '@/assets/images/bg_login.png';
import iZUS_pruhl from '@/assets/images/iZUS_pruhl.png';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { globals } from '@/globals';
import { Network } from '@capacitor/network';

const router = useIonRouter();
const route = useRoute();
const store = useStore();
const tm = useI18n();

const usernameRef = ref(computed(() => store.getters.getUsername).value);
const passwordRef = ref(computed(() => store.getters.getPassword).value);
const remeberCredentialsRef = ref(computed(() => store.getters.getUsername).value);
const showPasswordRef = ref(false);

onIonViewWillEnter(() => {
  usernameRef.value = computed(() => store.getters.getUsername).value;
  passwordRef.value = computed(() => store.getters.getPassword).value;
  remeberCredentialsRef.value = computed(() => store.getters.getUsername).value ? true : false;
  store.dispatch('updateIsSignedIn', false);
});

const signIn = async (e: Event) => {
  e.preventDefault();
  
  if(!(await isOnline())) {
    router.replace({ name: 'login', params: { error: 'offline' } });
    return;
  }

  store.dispatch('updateUsername', usernameRef.value.trim());
  store.dispatch('updatePassword', passwordRef.value.trim());
  store.dispatch('updateUrl', globals.appUrl);

  if(remeberCredentialsRef.value) {
    if(usernameRef.value) {
      localStorage.setItem('username', usernameRef.value);
    }

    if(passwordRef.value) {
      localStorage.setItem('password', passwordRef.value);
    }
  }

  router.push({ name: 'home', params: {login: true} });
}

const redirect = async (path: string) => {
  if(!(await isOnline())) {
    router.replace({ name: 'login', params: { error: 'offline' } });
    return;
  }

  const url = globals.appUrl + path;
  store.dispatch('updateUrl', url);
  router.push({name: 'home', params: { login: false }});
}

const isOnline = async () => {
  const networkStatus = await Network.getStatus();
  return networkStatus.connected;
}

</script>

<style scoped>

@media(prefers-color-scheme: dark) {
  .eye {
    --checkbox-background: url('@/assets/images/eye_dark.svg');
    --checkbox-background-checked: url('@/assets/images/eye_off_dark.svg');
  }
}

@media(prefers-color-scheme: light) {
  .eye {
    --checkbox-background: url('@/assets/images/eye_light.svg');
    --checkbox-background-checked: url('@/assets/images/eye_off_light.svg');
  }
}

.eye {
  --size: 24px;
  --checkmark-color: transparent;
}

.eye::part(container) {
  border: none;
  color: var(--ion-color-light);
}

.password-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error {
  color: var(--ion-color-danger);
  margin: 0;
}

.lowercaseBtn {
  text-transform: none;
}

.btn-clear {
  text-align: left;
  background: none;
  font-size:  medium;
  color: var(--ion-color-medium);
  height: min-content;
}

.align-self-right { 
  align-self: flex-end;
}

h2 {
  display: inline-block;
  margin: 0;
}

.viewport {
  width: 100svw;
  height: 100svh;
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: center;
  background-size: cover;
  background-position-y: bottom;
}

form {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
  background-color: var(--ion-color-light);
  padding: 2rem;
  border-radius: 12px;
  margin: 1rem;
}

.buttons {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
}

</style>
