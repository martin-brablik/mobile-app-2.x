<template>
    <ion-page>
        <Toolbar :page-title="$tm('property_inventory').toString()" :display-menu-button="false" />
        <ion-content id="window">
        </ion-content>
        <ion-footer class="ion-padding">
            <ion-content id="list">
                <ion-list lines="inset" :scrollY="true">
                    <ion-item v-for="item in scannedCodes">
                        <ion-label>{{ item }}</ion-label>
                    </ion-item>
                </ion-list>
            </ion-content>
            <ion-buttons>
                <ion-button fill="solid" color="medium">{{ $tm('pause') }}</ion-button>
                <ion-button fill="solid" color="tertiary">{{ $tm('send') }}</ion-button>
                <ion-button fill="solid" color="danger">{{ $tm('end') }}</ion-button>
            </ion-buttons>
        </ion-footer>
    </ion-page>
</template>

<script setup lang="ts">

import { IonPage, IonContent, IonFooter, IonButtons, IonButton, IonList, IonItem, IonLabel, useIonRouter } from '@ionic/vue';
import { BarcodeScanner, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { computed, onMounted, ref, Ref } from 'vue';
import { App } from '@capacitor/app';
import Toolbar from '@/components/Toolbar.vue'
import { globals } from '@/globals';
import store from '@/store';

const router = useIonRouter();
const scannedCodes: Ref<string[]> = ref(new Array<string>());

let lastScannedCode: string | undefined = '';

onMounted(() => {
    App.addListener('pause', () => {
        BarcodeScanner.showBackground();
        document.querySelector('body')?.classList.remove('scanner-active');
    });
    App.addListener('resume', () => {
        /*console.log('resumed');
        BarcodeScanner.hideBackground();
        document.querySelector('body')?.classList.add('scanner-active');*/
    });
    initiate();
});

const initiate = async () => {
    const consent = await getPermission();
    if (consent.valueOf()) {
        prepare();
    }
    else {
        router.push('/home');
    }
};


const prepare = async () => {
    await BarcodeScanner.prepare();
    lastScannedCode = await startScan();
    setTimeout(prepare, 500);
};

const startScan = async () => {
    console.log("started scan");
    document.querySelector('body')?.classList.add('scanner-active');
    BarcodeScanner.hideBackground();

    const result = await BarcodeScanner.startScan({targetedFormats: [SupportedFormat.QR_CODE]});

    if(result.hasContent) {
        lastScannedCode = parseQrData(result.content);
        console.log(lastScannedCode);
        if(lastScannedCode) {
            scannedCodes.value.push(lastScannedCode);
            console.log('processing');
            try {
                console.log('trying');
                await inventoryItems([Number.parseInt(lastScannedCode)], false);
                console.log('success');
            }
            catch(e) {
                console.log('fail');
            }
        }
        return lastScannedCode;
    }
};

const stopScan = () => {
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
    BarcodeScanner.stopScan();
};

const getPermission = async () => {
    const status = await BarcodeScanner.checkPermission({force: false});

    if(status.neverAsked) {
        const consent = confirm('K použití fotoaparátu je nutné oprávnění.');
        if(!consent) {
            return false;
        }
    }

    if(status.granted) {
        return true;
    }

    if(status.denied) {

        const consent = confirm('K udělění oprávnění k používání fotoaparátu, přejděte do nastavení.');
        if(consent) {
            BarcodeScanner.openAppSettings();
        }
    }

    if(status.restricted || status.unknown) {
        return false;
    }

    const statusRequest = await BarcodeScanner.checkPermission({force: true});

    if(statusRequest.granted) {
        return true;
    }

    return false;
};

const parseQrData = (url: string) => {
    const pattern = /(\d+)/;
    const match = url.match(pattern);

    return match ? match[0] : undefined;
}

const inventoryItems = async (ids: number[], inventoryBatch: boolean) => {
    console.log('sending');
    const url = globals.appUrl + 'ws/inventarizace_majetku/';
    const authToken = computed(() => store.getters.getAuthToken).value;
    const req: RequestInit = {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken,
        },
        body: JSON.stringify({ "kody": ids, "inventarizovat-vsechny-kusy": inventoryBatch })
    }
    console.log('fetching');
    const res = await fetch(url, req);
    console.log('fethed');
    if(!res.ok) {
        throw res.status;
    }

    const result = await res.json();
    console.log(result);
}

</script>

<style scoped>

#window {
    background-image: url(../assets/images/scanner.png);
    background-size: 60%;
    background-repeat: no-repeat;
    background-position: center;
}

ion-footer {
    height: 40%;
    background-color: var(--ion-color-light);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1em;
}

ion-buttons {
    justify-content: space-between;
    min-height: 0;
    flex: 0 0 auto;
}

#list {
    min-height: 0;
    flex: 1 1 auto;
}

</style>