<template>
    <ion-page>
        <Toolbar :page-title="$tm('property_inventory').toString()" :display-menu-button="false" />
        <audio preload="true" ref="beepSuccessRef" :src="beep1"></audio>
        <audio preload="true" ref="beepFailRef" :src="beep2"></audio>
        <ion-content id="window">
            <ion-buttons id="controls">
                <ion-button @click="BarcodeScanner.toggleTorch(); isTorchEnabledRef = !isTorchEnabledRef;" slot="icon-only">
                    <ion-icon :icon="isTorchEnabledRef ? flash : flashOutline" size="large"></ion-icon>
                </ion-button>
                <ion-button @click="alertHelp" slot="icon-only">
                    <ion-icon :icon="helpCircle" size="large"></ion-icon>
                </ion-button>
            </ion-buttons>
            <ion-alert :isOpen="isLeaveDialogOpenRef" :header="alertHeaderRef" :message="alertMessageRef" :buttons="leaveDialogButtons"></ion-alert>
            <ion-alert :isOpen="isEraseDialogOpenRef" :header="alertHeaderRef" :message="alertMessageRef" :buttons="eraseDialogButtons"></ion-alert>
            <ion-alert :isOpen="isHelpDialogOpenRef" :header="alertHeaderRef" :message="alertMessageRef" :buttons="helpDialogButtons"></ion-alert>
            <ion-alert :isOpen="isAlertOpenRef" :header="alertHeaderRef" :subHeader="alertSubheaderRef" :message="alertMessageRef" :buttons="alertButtons"></ion-alert>
        </ion-content>
        <ion-footer class="ion-padding">
            <ion-content id="list">
                <ion-list lines="inset" :scrollY="true">
                    <ion-item v-for="(code) in scannedCodes" :button="true" @click="alertDetail(code)">
                        <ion-icon v-if="code.state.state == State.PENDING" slot="start" :icon="time"></ion-icon>
                        <ion-icon v-if="code.state.state == State.MULTIPLE" slot="start" color="warning" :icon="checkmarkCircle"></ion-icon>
                        <ion-icon v-if="code.state.state == State.SUCCESS" slot="start" color="success" :icon="checkmarkCircle"></ion-icon>
                        <ion-icon v-if="code.state.state == State.FAIL" slot="start" color="danger" :icon="alertCircle"></ion-icon>
                        <ion-label>{{ code.item.nazev_majetku ? code.item.nazev_majetku : (code.state.state == State.PENDING ? $tm('inventory_pending') : $tm('unknown_item')) }}</ion-label>
                    </ion-item>
                </ion-list>
            </ion-content>
            <ion-buttons>
                <ion-button fill="solid" color="primary" @click="isScanningPausedRef ? resume() : pause()">{{ $tm(isScanningPausedRef ? 'resume' : 'pause') }}</ion-button>
                <ion-button fill="solid" color="secondary" @click="send()" :disabled="scannedCodes.length == 0">{{ $tm('send') }}</ion-button>
                <ion-button fill="solid" color="danger" @click="alertErase()" :disabled="scannedCodes.length == 0">{{ $tm('erase') }}</ion-button>
            </ion-buttons>
        </ion-footer>
    </ion-page>
</template>

<script setup lang="ts">

import { IonPage, IonContent, IonFooter, IonButtons, IonButton, IonList, IonItem, IonLabel, IonIcon, IonAlert, useIonRouter, onIonViewWillEnter, onIonViewWillLeave } from '@ionic/vue';
import { time, checkmarkCircle, alertCircle, flash, flashOutline, helpCircle } from 'ionicons/icons';
import { BarcodeScanner, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { computed, onMounted, ref, Ref } from 'vue';
import Toolbar from '@/components/Toolbar.vue'
import { globals } from '@/globals';
import store from '@/store';
import { Network } from '@capacitor/network';
import { useI18n } from 'vue-i18n';
import beep1 from '@/assets/audio/beep1.mp3';
import beep2 from '@/assets/audio/beep2.mp3';

const usernameRef = ref(computed(() => store.getters.getUsername).value);
const passwordRef = ref(computed(() => store.getters.getPassword).value);
const scannedCodes: Ref<Code[]> = ref(new Array<Code>());
const alertHeaderRef = ref('');
const alertSubheaderRef = ref('');
const alertMessageRef = ref('');
const isAlertOpenRef = ref(false);
const isHelpDialogOpenRef = ref(false);
const isEraseDialogOpenRef = ref(false);
const isLeaveDialogOpenRef = ref(false);
const isTorchEnabledRef = ref(false);
const isScanningPausedRef = ref(false);
const beepSuccessRef: Ref<HTMLAudioElement | undefined> = ref();
const beepFailRef: Ref<HTMLAudioElement | undefined> = ref();

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

export type Code = {
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
const helpDialogButtons = [
    {
        text: tm('cancel'),
        role: 'cancel',
        handler: () => {
            isHelpDialogOpenRef.value = false;
            BarcodeScanner.hideBackground();
            document.querySelector('body')?.classList.add('scanner-active');
        }
    },
    {
        text: 'OK',
        role: 'confirm',
        handler: () => {
            isHelpDialogOpenRef.value = false;
            BarcodeScanner.hideBackground();
            document.querySelector('body')?.classList.add('scanner-active');
            store.dispatch('updateUrl', globals.appUrl + 'o_izus/napoveda/?returnUri=%2Findex.php#clanek_napovedy785-1/');
            router.push({ name: 'home', params: { login: false } });
        }
    }
];
const eraseDialogButtons = [
    {
        text: tm('cancel'),
        role: 'cancel',
        handler: () => {
            isHelpDialogOpenRef.value = false;
            BarcodeScanner.hideBackground();
            document.querySelector('body')?.classList.add('scanner-active');
        }
    },
    {
        text: 'OK',
        role: 'confirm',
        handler: () => {
            isHelpDialogOpenRef.value = false;
            BarcodeScanner.hideBackground();
            document.querySelector('body')?.classList.add('scanner-active');
            scannedCodes.value = new Array<Code>();
            store.dispatch('updateScannedCodes', []);
        }
    }
];
const leaveDialogButtons = [
    {
        text: tm('no'),
        role: 'cancel',
        handler: () => {
            isEraseDialogOpenRef.value = false;
            store.dispatch('updateScannedCodes', []);
        }
    },
    {
        text: tm('yes'),
        role: 'confirm',
        handler: () => {
            isEraseDialogOpenRef.value = false;
            store.dispatch('updateScannedCodes', scannedCodes.value);
        }
    }
];

onMounted(() => {
    beepSuccessRef.value?.load();
    beepFailRef.value?.load();

    Network.addListener('networkStatusChange', async status => {
        if(status.connected) {
            await processPendingItems();
        }
    });
});

onIonViewWillEnter(async () => {
    await signInApi();
    BarcodeScanner.disableTorch();
    scannedCodes.value = computed(() => store.getters.getScannedCodes).value;
    initiate();
});

onIonViewWillLeave(() => {
    alertLeave();
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

const signInApi = async () => {	
  const url = globals.appUrl + 'ws/api/login/';
  const timestamp = new Date().getTime();
  const passwordHmac = globals.hmac(usernameRef.value, passwordRef.value, timestamp.toString());
  const data = {
    username: usernameRef.value,
    password: passwordHmac,
    salt: timestamp
  };
  const req: RequestInit = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    }
  } 
  const res = await fetch(url, req);
  const apiKey = await res.json();

  store.dispatch('updateAuthToken', apiKey.access_token);
}

const prepare = async () => {
    await BarcodeScanner.prepare();
    await startScan();
    setTimeout(async () => await prepare(), 250);
};

const startScan = async () => {

    if(isTorchEnabledRef.value) {
        await BarcodeScanner.enableTorch();
    }
    else {
        await BarcodeScanner.disableTorch();
    }

    document.querySelector('body')?.classList.add('scanner-active');
    BarcodeScanner.hideBackground();

    const result = await BarcodeScanner.startScan({targetedFormats: [SupportedFormat.QR_CODE]});

    if(!result.hasContent) {
        return;
    }

    lastScannedCode = parseQrData(result.content);

    if (!lastScannedCode) {
        return;
    }

    const time = new Date();
    const year = time.getFullYear();
    const month = (time.getMonth() + 1).toString();
    const day = (time.getDay() + 1).toString();
    const hours = (time.getHours() + 1).toString();
    const minutes = (time.getMinutes() + 1).toString();
    const seconds = (time.getSeconds() + 1).toString();

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
        scanFlash(false);
        return;
    }

    code.state.state = State.PENDING;
    scannedCodes.value.push(code);
    await BarcodeScanner.prepare();

    try {
        if ((await Network.getStatus()).connected) {
            code = await inventoryItem(code);
            scannedCodes.value.pop();
            scannedCodes.value.push(code);
            scanFlash(code.state.state == State.SUCCESS);
            store.dispatch('updateScannedCodes', scannedCodes.value);
        }
    }
    catch (e) {
        alertHeaderRef.value = tm('error');
        alertMessageRef.value = tm('error_processing_item');
        isAlertOpenRef.value = true;
    }

    return lastScannedCode;
};

const inventoryItem = async (code: Code, inventoryBatch = true): Promise<Code> => {
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
    const res = await fetch(url, req);

    if (!res.ok) {
        code.state.state = State.ERROR;
        alertHeaderRef.value = tm('error');
        alertMessageRef.value = tm('error_processing_item');
        isAlertOpenRef.value = true;
        throw res.status;
    }

    const result = await res.json();

    switch (result.kody[0].vysledek_inventarizace) {
        case 0:
            code.state.statusMessage = tm('new_item');
            code.state.state = State.FAIL;
            break;
        case 1:
            code.state.statusMessage = tm('not_signed_in')/*'Uživatel není přihlášený'*/;
            code.state.state = State.FAIL;
            break;
        case 2:
            code.state.statusMessage = tm('inventory_not_enabled')/*'Není zapnuta nadstandardní funkce Evidence majetku'*/;
            code.state.state = State.FAIL;
            break;
        case 3:
            code.state.statusMessage = tm('no_permission')/*'Uživatel nemá dostatečná oprávnění'*/;
            code.state.state = State.FAIL;
            break;
        case 4:
            code.state.statusMessage = tm('inventory_not_initiated')/*'Neprobíhá inventarizace'*/;
            code.state.state = State.FAIL;
            break;
        case 6:
            code.state.statusMessage = tm('multiple_items')/*'Majetek obsahuje více kusů'*/;
            code.state.state = State.MULTIPLE;
            break;
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
    try {
        scannedCodes.value.filter(c => c.state.state == State.PENDING).forEach(async (code) => {
            await inventoryItem(code);
        });
    }
    catch(e) {
        console.log('nothing to process');
    }
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

const alertDetail = (code: Code) => {
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
    alertHeaderRef.value = code.item.nazev_majetku?? tm('unknown_item');
    alertSubheaderRef.value = formatDate(code.item.datum_a_cas);
    alertMessageRef.value = code.state.statusMessage;
    isAlertOpenRef.value = true;
}

const alertHelp = () => {
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
    alertHeaderRef.value = tm('property_inventory');
    alertMessageRef.value = tm('help_redirect');
    isHelpDialogOpenRef.value = true;
}

const alertErase = () => {
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
    alertHeaderRef.value = tm('erase_inventory');
    alertMessageRef.value = tm('no_effect');
    isEraseDialogOpenRef.value = true;
}

const alertLeave = () => {
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
    alertHeaderRef.value = tm('inventory_interrupt');
    alertMessageRef.value = tm('save_inventory');
    isLeaveDialogOpenRef.value = true;
}

const pause = async () => {
    isScanningPausedRef.value = true;
    await BarcodeScanner.pauseScanning();
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
}
const resume = async () => {
    isScanningPausedRef.value = false;
    await BarcodeScanner.resumeScanning();
    BarcodeScanner.hideBackground();
    document.querySelector('body')?.classList.add('scanner-active');
}

const send = async () => {
    await processPendingItems();
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
    alertHeaderRef.value = tm('inventory_result');
    alertMessageRef.value = tm(scannedCodes.value.find(c => c.state.state == State.PENDING || c.state.state == State.FAIL || c.state.state == State.ERROR) ? 'inventory_fail' : 'inventory_success');
    isAlertOpenRef.value = true;
}

const formatDate = (dateTimeStr: string) => {
    const dateTime = dateTimeStr.split(' ');
    const date = dateTime[0].split('-');
    const time = dateTime[1].split(':');
    
    return `${date[2]}.${date[1]}.${date[0]} ${time[0]}:${time[1]}`;
}

const sleep = async (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const scanFlash = async (scanResult: boolean) => {
    const beep = scanResult ? beepSuccessRef.value : beepFailRef.value;

    if(beep) {
        beep.play();
    }

    navigator.vibrate([scanResult ? 100 : 500]);
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