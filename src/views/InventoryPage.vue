<template>
    <ion-page>
        <Toolbar :page-title="$tm('property_inventory').toString()" :display-menu-button="false" />
        <ion-content id="window">
            <ion-buttons id="controls">
                <ion-button @click="BarcodeScanner.toggleTorch(); isTorchEnabledRef = !isTorchEnabledRef;" slot="icon-only">
                    <ion-icon :icon="isTorchEnabledRef ? flash : flashOutline" size="large"></ion-icon>
                </ion-button>
                <ion-button @click="toggleHelp" slot="icon-only">
                    <ion-icon :icon="helpCircle" size="large"></ion-icon>
                </ion-button>
            </ion-buttons>
            <ion-alert :isOpen="isDialogOpenRef" :header="alertHeaderRef" :message="alertMessageRef" :buttons="dialogButtons"></ion-alert>
            <ion-alert :isOpen="isAlertOpenRef" :header="alertHeaderRef" :message="alertMessageRef" :buttons="alertButtons"></ion-alert>
        </ion-content>
        <ion-footer class="ion-padding">
            <ion-content id="list">
                <ion-list lines="inset" :scrollY="true">
                    <ion-item v-for="(code) in scannedCodes" :button="true" @click="showDetail(code)">
                        <ion-icon v-if="code.state.state == State.PENDING" slot="start" :icon="time"></ion-icon>
                        <ion-icon v-if="code.state.state == State.MULTIPLE" slot="start" color="warning" :icon="checkmarkCircle"></ion-icon>
                        <ion-icon v-if="code.state.state == State.SUCCESS" slot="start" color="success" :icon="checkmarkCircle"></ion-icon>
                        <ion-icon v-if="code.state.state == State.FAIL" slot="start" color="danger" :icon="closeCircle"></ion-icon>
                        <ion-label>{{ code.item.nazev_majetku ? code.item.nazev_majetku : (code.state.state == State.PENDING ? 'Čeká se na spojení' : 'Neznámý majetek') }}</ion-label>
                        <ion-note slot="end">{{ formatDate(code.item.datum_a_cas) }}</ion-note>
                    </ion-item>
                </ion-list>
            </ion-content>
            <ion-buttons>
                <ion-button fill="solid" color="primary" @click="isScanningPausedRef ? resume() : pause()">{{ $tm('pause') }}</ion-button>
                <ion-button fill="solid" color="secondary" @click="send()" :disabled="scannedCodes.length == 0">{{ $tm('send') }}</ion-button>
                <ion-button fill="solid" color="danger">{{ $tm('end') }}</ion-button>
            </ion-buttons>
        </ion-footer>
    </ion-page>
</template>

<script setup lang="ts">

import { IonPage, IonContent, IonFooter, IonButtons, IonButton, IonList, IonItem, IonLabel, IonIcon, IonNote, IonAlert, useIonRouter, onIonViewWillEnter } from '@ionic/vue';
import { time, checkmarkCircle, closeCircle, flash, flashOutline, helpCircle } from 'ionicons/icons';
import { BarcodeScanner, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { computed, onMounted, ref, Ref } from 'vue';
import { App } from '@capacitor/app';
import Toolbar from '@/components/Toolbar.vue'
import { globals } from '@/globals';
import store from '@/store';
import { Network } from '@capacitor/network';
import { useI18n } from 'vue-i18n';

const scannedCodes: Ref<Code[]> = ref(new Array<Code>());
const alertHeaderRef = ref('');
const alertMessageRef = ref('');
const isAlertOpenRef = ref(false);
const isDialogOpenRef = ref(false);
const isTorchEnabledRef = ref(false);
const isScanningPausedRef = ref(false);

const { tm } = useI18n();

let lastScannedCode: string | undefined = '';

enum State {
    DEFAULT, PENDING, MULTIPLE, SUCCESS, FAIL, ERROR
}

class Item  {
    constructor(
        public datum_a_cas: string,
        public id_majetku: number,
        public role: number,
        public nazev_majetku?: string,
        public mnozstvi?: number,
        public vysledek_inventarizace?: number
    ) {}
}

type Code = {
    state: { state: State, statusMessage: string },
    item: Item
}

const router = useIonRouter();
const alertButtons = [
    {
        text: 'OK',
        role: 'confirm',
        handler: () => {
            isAlertOpenRef.value = false;
            BarcodeScanner.hideBackground();
            document.querySelector('body')?.classList.add('scanner-active');
        }
    }
];
const dialogButtons = [
    {
        text: 'OK',
        role: 'confirm',
        handler: () => {
            isDialogOpenRef.value = false;
            BarcodeScanner.hideBackground();
            document.querySelector('body')?.classList.add('scanner-active');
        }
    },
    {
        text: tm('cancel'),
        role: 'cancel',
        handler: () => {
            isDialogOpenRef.value = false;
            BarcodeScanner.hideBackground();
            document.querySelector('body')?.classList.add('scanner-active');
        }
    }
];

onMounted(() => {
    console.log('mounted');
    console.log(lastScannedCode);
    App.addListener('pause', () => {
        BarcodeScanner.showBackground();
        document.querySelector('body')?.classList.remove('scanner-active');
    });
    App.addListener('resume', () => {
        /*console.log('resumed');
        BarcodeScanner.hideBackground();
        document.querySelector('body')?.classList.add('scanner-active');*/
    });

    Network.addListener('networkStatusChange', status => {
        if(status.connected) {
            processPendingItems();
        }
    });

    initiate();
});

onIonViewWillEnter(() => {
    BarcodeScanner.disableTorch();
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
    await startScan();
    setTimeout(prepare, 250);
};

const startScan = async () => {
    if(isTorchEnabledRef.value) {
        BarcodeScanner.enableTorch();
    }
    else {
        BarcodeScanner.disableTorch();
    }

    console.log("started scan");
    document.querySelector('body')?.classList.add('scanner-active');
    BarcodeScanner.hideBackground();

    const result = await BarcodeScanner.startScan({targetedFormats: [SupportedFormat.QR_CODE]});

    if(!result.hasContent) {
        return;
    }

    lastScannedCode = parseQrData(result.content);
    console.log(lastScannedCode);

    if (!lastScannedCode) {
        return;
    }

    const time = new Date();
    const year = time.getFullYear();
    const month = (time.getMonth() + 1).toString().padStart(2, '0');
    const day = (time.getDay() + 1).toString().padStart(2, '0');
    const hours = (time.getHours() + 1).toString().padStart(2, '0');
    const minutes = (time.getMinutes() + 1).toString().padStart(2, '0');
    const seconds = (time.getSeconds() + 1).toString().padStart(2, '0');

    let code: Code = {
        state: {
            state: State.DEFAULT,
            statusMessage: tm('new_item')
        },
        item: new Item(
            `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
            Number.parseInt(lastScannedCode),
            store.getters.getUserPerm,
        )
    }

    if(scannedCodes.value.find(c => c.item.id_majetku == code.item.id_majetku)) {
        return;
    }

    scannedCodes.value.push(code);

    try {
        code.state.state = State.PENDING;
        if ((await Network.getStatus()).connected) {
            code = await inventoryItem(code, false);
            scannedCodes.value.pop();
            scannedCodes.value.push(code);
        }
    }
    catch (e) {
        console.log('fail');
    }

    return lastScannedCode;
};

const inventoryItem = async (code: Code, inventoryBatch: boolean): Promise<Code> => {
    const url = globals.appUrl + 'ws/inventarizace_majetku/';
    const authToken = computed(() => store.getters.getAuthToken).value;
    const req: RequestInit = {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken,
        },
        body: JSON.stringify({ "kody": [code.item], "inventarizovat-vsechny-kusy": inventoryBatch })
    }
    console.log('fetching');
    const res = await fetch(url, req);
    console.log('fethed');
    console.log(res)

    if (!res.ok) {
        code.state.state = State.ERROR;
        //chybová zpráva pro uživatele
        throw res.status;
    }

    const result = await res.json();
    console.log(result);

    switch (result.kody[0].vysledek_inventarizace) {
        case 0:
            code.state.statusMessage = tm('new_item');
            code.state.state = State.FAIL;
        case 1:
            code.state.statusMessage = tm('not_signed_in')/*'Uživatel není přihlášený'*/;
            code.state.state = State.FAIL;
        case 2:
            code.state.statusMessage = tm('inventory_not_enabled')/*'Není zapnuta nadstandardní funkce Evidence majetku'*/;
            code.state.state = State.FAIL;
        case 3:
            code.state.statusMessage = tm('no_permission')/*'Uživatel nemá dostatečná oprávnění'*/;
            code.state.state = State.FAIL;
        case 4:
            code.state.statusMessage = tm('inventory_not_initiated')/*'Neprobíhá inventarizace'*/;
            code.state.state = State.FAIL;
        case 6:
            code.state.statusMessage = tm('multiple_items')/*'Majetek obsahuje více kusů'*/;
            code.state.state = State.MULTIPLE;
        case 11:
            code.state.statusMessage = tm('multiple_items_canceled')/*'Inventář více položek byl zrušen'*/;
            code.state.state = State.FAIL;
            break;
        case 5:
            code.state.statusMessage = tm('item_not_found')/*'Majetek podle id_majetku nebyl nalezen'*/;
            code.state.state = State.ERROR;
            break;
        case 7:
            code.state.statusMessage = tm('inventory_error')/*'Nepodařilo se zainventarizovat majetek (zřejmě chyba databáze)'*/;
            code.state.state = State.ERROR;
            break;
        case 8:
            code.state.statusMessage = tm('already_inventoried')/*'Majetek byl již inventarizován'*/;
            code.state.state = State.SUCCESS;
            break;
        case 9:
            code.state.statusMessage = tm('inventory_ok')/*'V pořádku zainventarizováno'*/;
            code.state.state = State.SUCCESS;
            break;
        case 10:
            code.state.statusMessage = tm('inventory_ok_no_record')/*'Vše v pořádku, ale nemá se záznam o inventarizaci ukládat'*/;
            code.state.state = State.SUCCESS;
            break;
    }

    code.item = result.kody[0];

    return code;
}

const processPendingItems = async () => {
    scannedCodes.value.filter(c => c.state.state == State.PENDING).forEach(code => {
        try {
            inventoryItem(code, false);
        }
        catch(e) {}
    });
}

const stopScan = () => {
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
    BarcodeScanner.stopScan();
};

const getPermission = async () => {
    const status = await BarcodeScanner.checkPermission({force: false});

    if(status.neverAsked) {
        const consent = confirm(tm('camera_request'));
        if(!consent) {
            return false;
        }
    }

    if(status.granted) {
        return true;
    }

    if(status.denied) {

        const consent = confirm(tm('camera_settings'));
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

const showDetail = (code: Code) => {
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
    alertHeaderRef.value = code.item.nazev_majetku?? tm('unknown_item');
    alertMessageRef.value = code.state.statusMessage;
    isAlertOpenRef.value = true;
}

const toggleHelp = () => {
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
    alertHeaderRef.value = tm('property_inventory');
    alertMessageRef.value = tm('help_redirect');
    isDialogOpenRef.value = true;
}

const pause = () => {
    isScanningPausedRef.value = true;
    stopScan();
    console.log('pause');
}
const resume = async () => {
    console.log('resume');
    isScanningPausedRef.value = false;
    await prepare();
}

const send = async () => {
    await processPendingItems();
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
    alertHeaderRef.value = tm('inventory_result');
    alertMessageRef.value = tm(scannedCodes.value.find(c => c.state.state == State.PENDING) ? 'inventory_fail' : 'inventory_success');
    isAlertOpenRef.value = true;
}

const formatDate = (dateTimeStr: string) => {
    const dateTime = dateTimeStr.split(' ');
    const date = dateTime[0].split('-');
    const time = dateTime[1].split(':');
    
    return `${date[2]}.${date[1]}.${date[0]} ${time[0]}:${time[1]}`;
}

</script>

<style scoped>

#controls {
    position: absolute;
    top: 5%;
    right: 5%;
}

#window {
    background-image: url(../assets/images/scanner.png);
    background-size: 50%;
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