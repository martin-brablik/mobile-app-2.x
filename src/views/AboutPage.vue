<template>
    <ion-page>
        <toolbar :pageTitle="$tm('about_izus').toString()" />
        <ion-content class="ion-padding" :scrollY="false">
            <ion-grid>
                <ion-row>
                    <ion-col>{{ $tm('version') }}:</ion-col>
                    <ion-col>2.0</ion-col>
                </ion-row>
                <ion-row>
                    <ion-col>{{ $tm('author') }}:</ion-col>
                    <ion-col><a href="https://sensio.cz" target="_blank">Sensio.cz s.r.o.</a></ion-col>
                </ion-row>
                <ion-row>
                    <ion-col>Email:</ion-col>
                    <ion-col><a href="mailto:info@izus.cz">info@izus.cz</a></ion-col>
                </ion-row>
                <ion-row>
                    <ion-col>{{ $tm('phone') }}:</ion-col>
                    <ion-col><a href="tel:+420725044875">+420 725 044 875</a></ion-col>
                </ion-row>
                <ion-row>
                    <ion-col><a href="https://play.google.com/store/apps/details?id=www.izus.cz"><ion-img :src="googple_play_download" alt="google play" /></a></ion-col>
                    <ion-col><a href="https://apps.apple.com/cz/app/izu%C5%A1/id1612897399"><ion-img :src="app_store_download" alt="app store" /></a></ion-col>
                </ion-row>
                <ion-row class="ion-justify-content-center">
                    <a href="https://www.sensio.cz">
                        <ion-img :src="logoRef" alt="sensio" />
                    </a>
                </ion-row>
            </ion-grid>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">

import { IonContent, IonGrid, IonRow, IonCol, IonImg, IonPage } from '@ionic/vue';
import Toolbar from '@/components/Toolbar.vue';
import googple_play_download from '@/assets/images/googple_play_download.png';
import app_store_download from '@/assets/images/app_store_download.png';
import logo_sensio_barevne_v_pruhledne from '@/assets/images/logo_sensio_barevne_v_pruhledne.png';
import SENSIO_logo_vertikalni_inverzni from '@/assets/images/SENSIO logo vertikalni inverzni.png'
import { ref } from 'vue';

const logoRef = ref(window.matchMedia('(prefers-color-scheme: dark)').matches ? SENSIO_logo_vertikalni_inverzni : logo_sensio_barevne_v_pruhledne);

</script>


<style scoped>

ion-row {
    line-height: 1.5em;
}

ion-img {
    margin: 1em 0;
}

a {
    color: var(--ion-color-dark);
}

ion-content {
    max-width: 400px;
    align-self: center;
}

</style>