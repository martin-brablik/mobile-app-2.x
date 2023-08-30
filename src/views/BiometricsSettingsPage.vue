<template>
    <ion-page>
        <toolbar :page-title="$tm('app_lock').toString()"></toolbar>
        <ion-content class="ion-padding" :scroll-y="false">
            <div class="container">
                <ion-toggle color="secondary" v-model="useAppLockRef" @ion-change="onUseLockChange">{{ $tm('use_app_lock') }}</ion-toggle>
                <ion-select :disabled="!useAppLockRef" v-model="lockOptionRef" ref="lockOptionSelectRef" @ion-change="saveLockOption()" :label="$tm('lock_preference').toString()" label-placement="floating" interface="popover" fill="solid" color="secondary">
                    <ion-select-option value="biometry">{{ $tm('prefer_biometry') }}</ion-select-option>
                    <ion-select-option value="pin">{{ $tm('prefer_pin') }}</ion-select-option>
                    <ion-select-option value="pin_only">{{ $tm('pin_only') }}</ion-select-option>
                </ion-select>
                <ion-button :disabled="!useAppLockRef" ref="setPinBtnRef" color="secondary" expand="block" @click="setOpenCreatePIN(true);"><ion-icon :icon="keypadIcon" slot="start"></ion-icon>{{ $tm('set_pin') }}</ion-button>
            </div>
            <ion-modal :is-open="isOpenCreatePIN">
                <ion-content class="ion-padding" :scroll-y="false">
                    <div class="modal space-evenly">
                        <keypad ref="keypadRef" :message="messageRef" @on-submit="checkPin" />
                        <div class="buttons">
                            <ion-button fill="solid" color="danger" shape="round" @click="setOpenCreatePIN(false);">{{ $tm('cancel') }}</ion-button>
                        </div>
                    </div>
                </ion-content>
            </ion-modal>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">

import { IonPage, IonContent, IonToggle, IonButton, IonIcon, IonSelect, IonSelectOption, IonModal } from '@ionic/vue';
import { keypad, keypad as keypadIcon } from 'ionicons/icons';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import Toolbar from '@/components/Toolbar.vue';
import Keypad from '@/components/Keypad.vue';
import { useI18n } from 'vue-i18n';

const { tm } = useI18n();
const store = useStore();

const lockOptionSelectRef = ref();
const setPinBtnRef = ref();
const useAppLockRef = ref(computed(() => store.getters.getUseAppLock).value);
const lockOptionRef = ref(computed(() => store.getters.getLockOption).value);
const keypadRef = ref();
const isOpenCreatePIN = ref(false);
const messageRef = ref(tm('create_pin').toString());
const pinsRef = ref(Array('', ''));

const onUseLockChange = () => {
    if(useAppLockRef.value) {
        const currentPin = computed(() => store.getters.getUserPin);
        store.dispatch('updateUseAppLock', true);

        if(!currentPin.value) {
            setTimeout(() => setOpenCreatePIN(true), 250);
        }
    }
    else {
        store.dispatch('updateUseAppLock', false);
    }
}

const setOpenCreatePIN = (value: boolean) => {
    isOpenCreatePIN.value = value;
}

const checkPin = (pin: string, attempt: number) => {
    const keypad = keypadRef.value;

    pinsRef.value[attempt] = pin;

    if(attempt < 1) {
        keypad.attempt++;
        initiateConfirmPin(tm('confirm_pin'));
    }
    else if(attempt == 1) {
        if(pinsRef.value[0] !== pinsRef.value[1]) {
            keypad.pinFlash(false);
            initiateConfirmPin(tm('pin_mismatch'));
            keypad.attempt = 0;
            return;
        }

        keypad.pinFlash(true);
        savePin();
        setTimeout(() => setOpenCreatePIN(false), 250);
    }
}

const initiateConfirmPin = (newMessage: string) => {
    const keypad = keypadRef.value;
    messageRef.value = newMessage;
    keypad.reset();
}

const savePin = () => {
    store.dispatch('updateUseAppLock', true);
    store.dispatch('updateUserPin', pinsRef.value[0]);
}

const saveLockOption = () => {
    store.dispatch('updateLockOption', lockOptionRef.value);
}

</script>

<style scoped>

.buttons {
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
}

p {
    text-align: center;
}

.text {
    color: var(--ion-color-dark);
    letter-spacing: 1px;
}

.container {
    display: flex;
    flex-flow: column nowrap;
    gap: 1rem;
}

.modal {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4vh;
    height: 100%;
}

ion-modal {
  --width: 100%;
  --height: 100%;
}

ion-content {
    max-width: 400px;
    align-self: center;
}

</style>