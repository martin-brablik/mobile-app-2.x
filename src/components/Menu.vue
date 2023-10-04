<template>
    <ion-menu ref="menuRef" id="#menu" side="end" contentId="main-content" :maxEdgeStart="200" @ionWillOpen="onOpen()">
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-menu-button></ion-menu-button>
                </ion-buttons>
                <ion-img :src="iZUS_pruhl" alt="logo" slot="start" />
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <ion-list>
                <ion-item v-if="!isSigneInRef" @click="signIn()">
                    <ion-icon :icon="logIn" slot="start"></ion-icon>
                    <ion-label>{{ tm('sign_in') }}</ion-label>
                </ion-item>
                <ion-item v-if="isSigneInRef" @click="signOut()">
                    <ion-icon :icon="logOut" slot="start"></ion-icon>
                    <ion-label>{{ tm('sign_out') }}</ion-label>
                </ion-item>
                <ion-item @click="push('/home/login=false');">
                    <ion-icon :icon="home" slot="start"></ion-icon>
                    <ion-label>{{ tm('main_page') }}</ion-label>
                </ion-item>
                <ion-item v-if="/*isSigneInRef && userPermRef >= 5 && nfInventoryRef*/true" @click="push('/inventory')">
                    <ion-icon :icon="checkmark" slot="start"></ion-icon>
                    <ion-label>{{ $tm('inventory') }}</ion-label>
                </ion-item>
                <ion-item @click="push('/settings')">
                    <ion-icon :icon="settings" slot="start"></ion-icon>
                    <ion-label>{{ $tm('settings') }}</ion-label>
                </ion-item>
                <ion-item @click="redirect('o_izus/prirucka/?returnUri=%2Findex.php?')">
                    <ion-icon :icon="helpCircle" slot="start"></ion-icon>
                    <ion-label>{{ $tm('help') }}</ion-label>
                </ion-item>
                <ion-item @click="push('/about')">
                    <ion-icon :icon="informationCircle" slot="start"></ion-icon>
                    <ion-label>{{ $tm('about_app') }}</ion-label>
                </ion-item>
                <ion-item @click="App.exitApp()">
                    <ion-icon :icon="close" slot="start"></ion-icon>
                    <ion-label>{{ $tm('exit') }}</ion-label>
                </ion-item>
            </ion-list>
        </ion-content>
    </ion-menu>
</template>

<script setup lang="ts">

import {IonMenu, IonHeader, IonToolbar, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButtons, IonMenuButton, IonImg, IonButton, useIonRouter, menuController, onIonViewDidEnter } from '@ionic/vue'
import { logIn, logOut, home, checkmark, settings, informationCircle, close, helpCircle, refresh } from 'ionicons/icons';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { App } from '@capacitor/app';
import { globals } from '@/globals';
import iZUS_pruhl from '@/assets/images/iZUS_pruhl.png';

const { tm } = useI18n();
const router = useIonRouter();
const store = useStore();
const menuRef = ref<typeof IonMenu>();
const isSigneInRef = ref(computed(() => store.getters.getIsSigneIn).value);
const userPermRef = ref(computed(() => store.getters.getUserPerm).value);
const nfInventoryRef = ref(computed(() => store.getters.getNfInventory).value);

const onOpen = () => {
    isSigneInRef.value = computed(() => store.getters.getIsSignedIn).value;
    userPermRef.value = computed(() => store.getters.getUserPerm).value;
    nfInventoryRef.value = computed(() => store.getters.getNfInventory).value;

    console.log(isSigneInRef.value);
    console.log(userPermRef.value);
    console.log(nfInventoryRef.value);
}

const push = (href: string) => {
    menuController.close();
    router.push(href);
}

const signIn = () => {
    menuController.close();

    if(computed(() => store.getters.getUsername).value && computed(() => store.getters.getPassword).value) {
        router.push({ name: 'home', params: { login: true } });
    }
    else {
        router.push({ name: 'login', params: { error: 'none' } });
    }
}

const signOut = () => {
    menuController.close();
    store.dispatch('updateIsSignedIn', false);
    store.dispatch('updateUrl', globals.appUrl + '?logout=true');
    router.push({name: 'home', params: {login: false}});
}

const redirect = (path: string) => {
    const url = globals.appUrl + path;
    store.dispatch('updateUrl', url);
    router.push({ name: 'home', params: { login: false }});
    menuController.close();
}

</script>

<style scoped>

ion-img {
    max-width: 30%;
    max-height: 80%;
}

</style>