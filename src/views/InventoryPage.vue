<template>
    <ion-page>
        <Toolbar :page-title="$tm('property_inventory').toString()" :display-menu-button="false" />
        <ion-content id="window">
            <ion-icon id="toggleFlash" :icon="isTorchEnabledRef ? flash : flashOutline" size="large" @click="BarcodeScanner.toggleTorch(); isTorchEnabledRef = !isTorchEnabledRef;"></ion-icon>
            <ion-alert :isOpen="isAlertOpenRef" :header="alertHeaderRef" :message="alertMessageRef" :buttons="alertButtons"></ion-alert>
        </ion-content>
        <ion-footer class="ion-padding">
            <ion-content id="list">
                <ion-list lines="inset" :scrollY="true">
                    <ion-item v-for="(code) in scannedCodes" :button="true" @click="showDetail(code)">
                        <ion-icon v-if="code.state.state == State.PENDING" slot="start" :icon="time"></ion-icon>
                        <ion-icon v-if="code.state.state == State.SUCCESS" slot="start" color="success" :icon="checkmarkCircle"></ion-icon>
                        <ion-icon v-if="code.state.state == State.FAIL" slot="start" color="danger" :icon="closeCircle"></ion-icon>
                        <ion-label>{{ code.item.nazev_majetku ? code.item.nazev_majetku : (code.state.state == State.PENDING ? 'Čeká se na spojení' : 'Neznámý majetek') }}</ion-label>
                        <ion-note slot="end">{{ code.item.datum_a_cas }}</ion-note>
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

import { IonPage, IonContent, IonFooter, IonButtons, IonButton, IonList, IonItem, IonLabel, IonIcon, IonNote, IonAlert, useIonRouter, onIonViewWillEnter } from '@ionic/vue';
import { time, checkmarkCircle, closeCircle, flash, flashOutline } from 'ionicons/icons';
import { BarcodeScanner, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { computed, onMounted, ref, Ref } from 'vue';
import { App } from '@capacitor/app';
import Toolbar from '@/components/Toolbar.vue'
import { globals } from '@/globals';
import store from '@/store';

enum State {
    DEFAULT, PENDING, SUCCESS, FAIL, ERROR
}

class Item  {
    constructor(
        public datum_a_cas: string,
        public id_majetku: number,
        public role: number,
        public nazev_majetku?: string,
        public mnozstvi?: number,
        public vysledek_inventarizace?: number) {}
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

const scannedCodes: Ref<Code[]> = ref(new Array<Code>());
const alertHeaderRef = ref('');
const alertMessageRef = ref('');
const isAlertOpenRef = ref(false);
const isTorchEnabledRef = ref(false);

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

    if(result.hasContent) {
        lastScannedCode = parseQrData(result.content);
        console.log(lastScannedCode);
        if(lastScannedCode) {
            console.log('processing');
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
                    statusMessage: 'Nově skenováno, neodesláno do iZUŠ'
                },
                item: new Item(
                    `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
                    Number.parseInt(lastScannedCode),
                    store.getters.getUserPerm,
                )
            }

            if (scannedCodes.value.find(c => c.item.id_majetku == code.item.id_majetku)) {
                return;
            }

            scannedCodes.value.push(code);

            try {
                console.log('trying');
                code = await inventoryItem(code, false);
                console.log('success');
                scannedCodes.value.pop();
                scannedCodes.value.push(code);
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

const inventoryItem = async (code: Code, inventoryBatch: boolean): Promise<Code> => {
    code.state.state = State.PENDING;
    console.log('sending');
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

    if(!res.ok) {
        //chybová zpráva pro uživatele
        throw res.status;
    }

    const result = await res.json();
    console.log(result);

    switch(result.kody[0].vysledek_inventarizace) {
        case 0:
            code.state.statusMessage = 'Nově skenované, neodeslané do iZUŠ';
            code.state.state = State.FAIL;
        case 1:
            code.state.statusMessage = 'Uživatel není přihlášený';
            code.state.state = State.FAIL;
        case 2:
            code.state.statusMessage = 'Není zapnuta nadstandardní funkce Evidence majetku';
            code.state.state = State.FAIL;
        case 3:
            code.state.statusMessage = 'Uživatel nemá dostatečná oprávnění';
            code.state.state = State.FAIL;
        case 4:
            code.state.statusMessage = 'Neprobíhá inventarizace';
            code.state.state = State.FAIL;
        case 6:
            code.state.statusMessage = 'Majetek obsahuje více kusů';
            code.state.state = State.FAIL;
        case 11:
            code.state.statusMessage = 'Inventář více položek byl zrušen';
            code.state.state = State.FAIL;
            break;
        case 5:
            code.state.statusMessage = 'Majetek podle id_majetku nebyl nalezen';
            code.state.state = State.ERROR;
            break;
        case 7:
            code.state.statusMessage = 'Nepodařilo se zainventarizovat majetek (zřejmě chyba databáze)';
            code.state.state = State.ERROR;
            break;
        case 8:
            code.state.statusMessage = 'Majetek byl již inventarizován';
            code.state.state = State.SUCCESS;
            break;
        case 9:
            code.state.statusMessage = 'V pořádku zainventarizováno';
            code.state.state = State.SUCCESS;
            break;
        case 10:
            code.state.statusMessage = 'Vše v pořádku, ale nemá se záznam o inventarizaci ukládat';
            code.state.state = State.SUCCESS;
            break;
    }

    code.item = result.kody[0];

    return code;
}

const showDetail = (code: Code) => {
    BarcodeScanner.showBackground();
    document.querySelector('body')?.classList.remove('scanner-active');
    alertHeaderRef.value = code.item.nazev_majetku?? 'Neznámý majetek';
    alertMessageRef.value = code.state.statusMessage;
    isAlertOpenRef.value = true;
}

</script>

<style scoped>

#toggleFlash {
    position: relative;
    top: 5%;
    left: 5%;
}

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