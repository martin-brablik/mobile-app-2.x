<template>
    <ion-page>
        <toolbar :pageTitle="$tm('settings').toString()" />
        <ion-content class="ion-padding">
            <form @submit.prevent="saveCredentials();">
                <h3>{{ $tm('general') }}</h3>
                <ion-select v-model="langOptionRef" @ion-change="saveLanguage()" :label="$tm('language').toString()" label-placement="floating" interface="popover" fill="solid" color="secondary">
                    <ion-select-option value="cs">Čeština</ion-select-option>
                    <ion-select-option value="sk">Slovenčina</ion-select-option>
                    <ion-select-option value="ua">українська</ion-select-option>
                    <ion-select-option value="en">English</ion-select-option>
                </ion-select>
                <ion-button @click="openBiometricsSettings"><ion-icon :icon="lockClosed" slot="start"></ion-icon>{{ $tm('set_lock') }}</ion-button>
                <h3>{{ $tm('account') }}</h3>
                <ion-input v-model="usernameRef" :label="$tm('username').toString()" label-placement="floating" fill="solid" color="secondary" />
                <ion-input v-model="passwordRef" :label="$tm('password').toString()" label-placement="floating" type="password" fill="solid" color="secondary" @keyup.enter="saveCredentials" />
                <ion-checkbox v-model="autoLoginRef" justify="space-between" color="secondary" @ion-change="saveAutoLogin()">{{ $tm('auto_login') }}</ion-checkbox>
                <ion-button id="save-credentials" type="submit" color="secondary"><ion-icon :icon="save" slot="start"></ion-icon>{{ $tm('save') }}</ion-button>
                <ion-button color="danger" type="button" @click="deleteCredentials()"><ion-icon :icon="trash" slot="start"></ion-icon>{{ $tm('delete') }}</ion-button>
            </form>
            <ion-toast :is-open="isOpenSuccessRef" :duration="3000" @didDismiss="() => isOpenSuccessRef = false" :message="$tm('save_credentials').toString()"></ion-toast>
            <ion-toast :is-open="isOpenErrorRef" :duration="3000" @didDismiss="() => isOpenErrorRef = false" :message="$tm('save_credentials_error').toString()"></ion-toast>
            <ion-toast :is-open="isOpenDeletedRef" :duration="3000" @didDismiss="() => isOpenDeletedRef = false" :message="$tm('delete_credentials').toString()"></ion-toast>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">

import { IonPage, IonContent, IonInput, IonButton, IonCheckbox, IonIcon, IonSelect, IonSelectOption, IonToast, useIonRouter } from '@ionic/vue';
import { computed, ref } from 'vue';
import { lockClosed, save, trash } from 'ionicons/icons';
import Toolbar from '@/components/Toolbar.vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';

const { locale, tm } = useI18n();
const router = useIonRouter();
const store = useStore();

const usernameRef = ref(computed(() => store.getters.getUsername).value);
const passwordRef = ref(computed(() => store.getters.getPassword).value);
const autoLoginRef = ref(computed(() => store.getters.getAutoLogin).value);
const langOptionRef = ref(locale.value);
const isOpenErrorRef = ref(false);
const isOpenSuccessRef = ref(false);
const isOpenDeletedRef = ref(false);

const openBiometricsSettings = () => {
    router.push('/binometricsSettings');
}

const validateInputs = () => {
    return usernameRef.value !== '' && passwordRef.value !== '';
}

const saveAutoLogin = () => {
    store.dispatch('updateAutoLogin', autoLoginRef.value);
}

const saveLanguage = () => {
    locale.value = langOptionRef.value;
    store.dispatch('updateLanguage', langOptionRef.value);
}

const saveCredentials = () => {
    if(!validateInputs()) {
        isOpenErrorRef.value = true;
        return;
    }

    isOpenSuccessRef.value = true;
    store.dispatch('updateUsername', usernameRef.value);
    localStorage.setItem('username', usernameRef.value);
    store.dispatch('updatePassword', passwordRef.value);
    localStorage.setItem('password', passwordRef.value);
    saveAutoLogin();
}

const deleteCredentials = () => {
    usernameRef.value = '';
    store.dispatch('updateUsername', '');
    localStorage.setItem('username', '');
    store.dispatch('updatePassword', '');
    localStorage.setItem('password', '');
    passwordRef.value = '';
    autoLoginRef.value = false;
    saveAutoLogin();
    isOpenDeletedRef.value = true;
}

</script>

<style scoped>

form {
    display: flex;
    flex-flow: column nowrap;
    gap: 1rem;
}

ion-content {
    max-width: 400px;
    align-self: center;
}

</style>