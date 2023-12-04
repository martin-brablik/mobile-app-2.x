<template>
    <ion-header>
            <ion-toolbar color="primary">
                <ion-title>{{ pageTitle }}</ion-title>
                <ion-buttons slot="start">
                    <ion-button @click="back()">
                        <ion-icon :icon="arrowBack"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-buttons v-if="displayMenuButton" slot="end">
                    <ion-menu-button></ion-menu-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>
</template>

<script setup lang="ts">

import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,  IonIcon, IonMenuButton, useIonRouter } from '@ionic/vue';
import { arrowBack } from 'ionicons/icons';

const router = useIonRouter();

const back = () => {
    if(router.canGoBack()) {
        router.back();
    }
}

const props = defineProps({
    pageTitle: {
        type: String,
        required: true
    },
    displayMenuButton: {
        type: Boolean,
        required: false,
        default: true
    }
});

</script>