<template>
    <ion-img :src="iZUS_pruhl" alt="logo" />
    <p class="text"> {{ message }}</p>
    <div class="dot-group">
        <div class="pinDot"></div>
        <div class="pinDot"></div>
        <div class="pinDot"></div>
        <div class="pinDot"></div>
    </div>
    <div class="grid-wrpapper">
        <ion-grid>
            <ion-row>
                <ion-col><button @click="onInput(1);">1</button></ion-col>
                <ion-col><button @click="onInput(2);">2</button></ion-col>
                <ion-col><button @click="onInput(3);">3</button></ion-col>
            </ion-row>
            <ion-row>
                <ion-col><button @click="onInput(4);">4</button></ion-col>
                <ion-col><button @click="onInput(5);">5</button></ion-col>
                <ion-col><button @click="onInput(6);">6</button></ion-col>
            </ion-row>
            <ion-row>
                <ion-col><button @click="onInput(7);">7</button></ion-col>
                <ion-col><button @click="onInput(8);">8</button></ion-col>
                <ion-col><button @click="onInput(9);">9</button></ion-col>
            </ion-row>
            <ion-row>
                <ion-col offset="4"><button @click="onInput(0);">0</button></ion-col>
                <ion-col><button @click="onBackspace"><ion-icon :icon="backspace"></ion-icon></button></ion-col>
            </ion-row>
        </ion-grid>
    </div>
</template>

<script setup lang="ts">

import { IonGrid, IonRow, IonCol, IonIcon, IonImg } from '@ionic/vue';
import { ref, } from 'vue';
import { backspace } from 'ionicons/icons';
import iZUS_pruhl from '@/assets/images/iZUS_pruhl.png';

const pinDotsRef = ref(document.getElementsByClassName('pinDot'));
const pinPositionRef = ref(0);
const pinRef = ref('');
const attemptRef = ref(0);

defineProps({
    message: {
        type: String,
        required: true
    }
});

const emits = defineEmits(['onSubmit']);

const reset = () => {
    pinPositionRef.value = 0;
    pinRef.value = '';
    
    for(let i = 0; i < pinDotsRef.value.length; i++) {
        pinDotsRef.value[i].classList.remove('active');
    }
}

const pinFlash = (value: boolean) => {
    for(let i = 0; i < pinDotsRef.value.length; i++) {
        pinDotsRef.value[i].classList.add(value ? 'correct' : 'wrong');
        setTimeout(() => {
            pinDotsRef.value[i].classList.remove(value ? 'correct' : 'wrong');
            pinDotsRef.value[i].classList.remove('active');
        }, 250);
    }
};

const onInput = (number: Number) => {
    pinDotsRef.value[pinPositionRef.value++].classList.add('active');
    pinRef.value += number;
    
    if(pinPositionRef.value == 4) {
        emits('onSubmit', pinRef.value, attemptRef.value);
    }
};

const onBackspace = () => {
    if(pinPositionRef.value <= 0) {
        return;
    }

    pinDotsRef.value[--pinPositionRef.value].classList.remove('active');
    pinRef.value = pinRef.value.slice(0, -1);
};

defineExpose({ reset, pinFlash, attempt: attemptRef });

</script>

<style scoped>

ion-img {
    width: 50%;
    align-self: center;
}

.text {
    color: var(--ion-color-dark);
    letter-spacing: 1px;
    text-align: center;
}

.pinDot {
    display: inline-block;
    aspect-ratio: 1 / 1;
    width: 24px;
    background-color: var(--ion-color-medium);
    border-radius: 50%;
    transition: background-color 0.1s linear;
}

.pinDot.active {
    background-color: var(--ion-color-secondary);
}

.pinDot.wrong {
    background-color: var(--ion-color-danger);
}

.pinDot.correct {
    background-color: var(--ion-color-success);
}

.grid-wrapper {
    width: 100%;
}

.dot-group {
    display: inline-flex;
    width: 50%;
    justify-content: space-between;
    align-self: center;
}

button {
    font-weight: normal;
    background: none;
    color: var(--ion-color-dark);
    font-size: x-large;
    min-height: 60px;
    height: 100%;
    width: 100%;
}

ion-col {
    text-align: center;
    vertical-align: middle;
}

</style>