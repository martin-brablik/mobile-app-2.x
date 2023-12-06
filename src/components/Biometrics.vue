<template>
  <ion-modal :isOpen="isOpenRef" @ionModalDismiss="dismissModal">
      <div class="container">
        <keypad ref="keypadRef" :message="$tm('lock_message').toString()" @onSubmit="checkPin" />
        <button id="present-forgot-pin">{{ $tm('forgot_pin') }}</button>
        <ion-button v-if="isBiometryEnabled()" class="btn-fingerprint" size="large" shape="round" color="secondary" @click="onAuthenticate"><ion-icon :icon="fingerPrint"></ion-icon></ion-button>
      </div>
      <ion-alert trigger="present-forgot-pin" :header="$tm('forgot_pin').toString()" :message="$tm('forgot_pin_message')" :buttons="alertButtons"></ion-alert>
    </ion-modal>
</template>

<script setup lang="ts">

import { IonIcon, IonButton, IonModal, IonAlert, alertController } from '@ionic/vue';
import { fingerPrint } from 'ionicons/icons';
import { ref, reactive, computed, onBeforeUnmount, onBeforeMount, toRaw } from 'vue';
import { type PluginListenerHandle } from '@capacitor/core';
import { useStore } from 'vuex';
import { type AuthenticateOptions, BiometricAuth, BiometryErrorType, BiometryType, type CheckBiometryResult, getBiometryName, type ResultError } from '@aparajita/capacitor-biometric-auth'
import Keypad from '@/components/Keypad.vue';
import { useI18n } from 'vue-i18n';

const { tm } = useI18n();
const emits = defineEmits(['onAuthenticated', 'onAuthRequested']);
const store = useStore();

const isOpenRef = ref(false);
const unlockTriedRef = ref(false);
const lockOptionRef = ref(computed(() => store.getters.getLockOption).value);
const keypadRef = ref();
const appListenerRef = ref<PluginListenerHandle>()

let isAppLocked = true;

onBeforeMount(async () => {
  updateBiometryInfo(await BiometricAuth.checkBiometry())

  try {
    appListenerRef.value = await BiometricAuth.addResumeListener(
      updateBiometryInfo
    )
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    }
  }
})

onBeforeUnmount(async () => {
  await appListenerRef.value?.remove()
});

const forgotPin = () => {
  store.dispatch('updateUseAppLock', false);
  store.dispatch('updateUserPin', undefined);
  setAppLock(false);
  dismissModal();
}

const alertButtons = [
  {
    text: tm('cancel'),
    role: 'cancel',
    handler: () => {

    }
  },
  {
    text: 'OK',
    role: 'confirm',
    handler: () => {
      forgotPin();
    }
  }
];

const checkPin = (pin: string, attempt: number) => {
  const savedPin = computed(() => store.getters.getUserPin).value;
  const keypad = keypadRef.value;

  if(pin === savedPin) {
    keypad.pinFlash(true);
    setTimeout(() => {
      setAppLock(false);
      dismissModal();
    }, 250);
  }
  else {
    keypad.pinFlash(false);
    keypad.reset();
  }
}

const isBiometryEnabled = () => {
  return lockOptionRef.value !== 'pin_only';
}

const getAppLock = () => {
  return isAppLocked;
}

const setAppLock = (value: boolean) => {
  isAppLocked = value;
}

const getUnlockTried = () => {
  return unlockTriedRef.value;
}

const setUnlockTried = (value: boolean) => {
  unlockTriedRef.value = value;
}

const dismissModal = () => {
  emits('onAuthenticated');
  isOpenRef.value = false;
};

const openBiometry = () => {
  const useAppLock = computed(() => store.getters.getUseAppLock).value;
  lockOptionRef.value = computed(() => store.getters.getLockOption).value;

  if(!useAppLock || !computed(() => store.getters.getIsSignedIn).value) {
    return;
  }

  isOpenRef.value = true;
  emits('onAuthRequested')

  if(lockOptionRef.value == 'biometry' && !getUnlockTried()) {
    onAuthenticate();
  }
}

const biometry = ref<CheckBiometryResult>({
  isAvailable: false,
  biometryType: BiometryType.none,
  reason: '',
  code: BiometryErrorType.none,
  biometryTypes: [BiometryType.none]
});

const options = reactive<AuthenticateOptions>({
  reason: '',
  cancelTitle: tm('cancel'),
  iosFallbackTitle: tm('greeting'),
  androidTitle: tm('greeting'),
  androidSubtitle: '',
  allowDeviceCredential: false
});

function updateBiometryInfo(info: CheckBiometryResult): void {
  biometry.value = info
};

async function showAlert(message: string): Promise<void> {
  const alert = await alertController.create({
    header: tm('auth_failed'),
    subHeader: '',
    message: tm('user_not_recognized'),
    buttons: ['OK']
  })
  await alert.present()
};

async function showErrorAlert(error: ResultError): Promise<void> {
  await showAlert(`${error.message} [${error.code}].`)
}

async function onAuthenticate(): Promise<void> {
  try {
    // options is a reactive proxy, we can't pass it directly to a plugin.
    // so pass the underlying object.
    await BiometricAuth.authenticate(toRaw(options));
    dismissModal();
    setUnlockTried(true);
    setAppLock(false);
  } catch (error) {
    // Someday TypeScript will let us type catch clauses...
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    setUnlockTried(true);
    setAppLock(true);
    await showErrorAlert(error as ResultError);
  }
};

/*const biometryName = computed(() => {
  return getBiometryName(biometry.value.biometryType) || 'Nejsou k dispozici žádné možnosti biometriky'
});*/

/*async function onSelectBiometry(
  event: SelectCustomEvent<string>
): Promise<void> {
  await BiometricAuth.setBiometryType(Number(event.detail.value))
  updateBiometryInfo(await BiometricAuth.checkBiometry())
};*/

/*const biometryDescription = computed(() => {
  let description = `${biometryName.value} is supported`

  if (biometry.value.biometryType !== BiometryType.none) {
    if (biometry.value.isAvailable) {
      description += ' and available.'
    } else {
      description += ', but not available.'
    }

    if (biometry.value.reason) {
      description += ` ${biometry.value.reason} (${biometry.value.code})`
    }
  } else {
    description += '.'
  }

  return description
});*/

/*const isNative = computed(() => Capacitor.isNativePlatform())*/

/*const isIOS = computed(() => Capacitor.isNativePlatform() && isPlatform('ios'))*/

/*const isAndroid = computed(
  () => Capacitor.isNativePlatform() && isPlatform('android')
);*/

/*const biometryTypes = [
  {
    title: 'Žádná',
    type: BiometryType.none
  },
  {
    title: 'Touch ID',
    type: BiometryType.touchId
  },
  {
    title: 'Face ID',
    type: BiometryType.faceId
  },
  {
    title: 'Otisk prstu',
    type: BiometryType.fingerprintAuthentication
  },
  {
    title: 'Odemknutí obličejem',
    type: BiometryType.faceAuthentication
  },
  {
    title: 'Skenování duhovky',
    type: BiometryType.irisAuthentication
  }
];*/

defineExpose({ openBiometry, getAppLock, setAppLock, getUnlockTried, setUnlockTried });

</script>

<style scoped>

.btn-fingerprint {
    align-self: center;
}

.container {
    width: 100%;
    max-width: 400px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4vh;
    align-self: center;
    text-align: center;
    padding: 2rem;
}

button {
  font-weight: normal;
  font-size: medium;
  background: none;
  color: var(--ion-color-medium);
}

ion-modal {
  --width: 100%;
  --height: 100%;
}

</style>