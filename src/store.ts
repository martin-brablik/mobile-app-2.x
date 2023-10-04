import { createStore } from 'vuex';
import { globals } from './globals';

export default createStore({
    state: {
        url: globals.appUrl,
        isSignedIn: false,
        useAppLock: JSON.parse(localStorage.getItem('useAppLock') || 'false'),
        userPin: localStorage.getItem('userPin') || undefined,
        lockOption: localStorage.getItem('lockOption') || 'biometry',
        language: localStorage.getItem('lang') || navigator.language.split('-')[0],
        username: localStorage.getItem('username') || '',
        password: localStorage.getItem('password') || '',
        autoLogin: JSON.parse(localStorage.getItem('autoLogin') || 'false'),
        authToken: '',
        deviceToken: '',
        userPerm: 0,
        nfInventory: 0,
    },
    mutations: {
        setUrl(state, url) {
            state.url = url;
        },
        setIsSignedIn(state, isSignedIn) {
            state.isSignedIn = isSignedIn;
            localStorage.setItem('isSignedIn', isSignedIn);
        },
        setUseAppLock(state, value) {
            state.useAppLock = value;
            localStorage.setItem('useAppLock', value);
        },
        setUserPin(state, userPin) {
            state.userPin = userPin;
            localStorage.setItem('userPin', userPin);
        },
        setLockOption(state, lockOption) {
            state.lockOption = lockOption;
            localStorage.setItem('lockOption', lockOption);
        },
        setLanguage(state, langOption) {
            state.language = langOption;
            localStorage.setItem('lang', langOption);
        },
        setUsername(state, username) {
            state.username = username;
        },
        setPassword(state, password) {
            state.password = password;
        },
        setAutoLogin(state, autoLogin) {
            state.autoLogin = autoLogin;
            localStorage.setItem('autoLogin', autoLogin);
        },
        setAuthToken(state, authToken) {
            state.authToken = authToken;
        },
        setDeviceToken(state, deviceToken) {
            state.deviceToken = deviceToken;
        },
        setUserPerm(state, userPerm) {
            state.userPerm = userPerm;
        },
        setNfInventory(state, nfInventory) {
            state.nfInventory = nfInventory;
        }
    },
    actions: {
        updateUrl({ commit }, url) {
            commit('setUrl', url);
        },
        updateIsSignedIn({ commit }, isSignedIn) {
            commit('setIsSignedIn', isSignedIn);
        },
        updateUseAppLock({ commit }, useAppLock) {
            commit('setUseAppLock', useAppLock);
        },
        updateUserPin({ commit }, userPin) {
            commit('setUserPin', userPin);
        },
        updateLockOption({ commit }, lockOption) {
            commit('setLockOption', lockOption);
        },
        updateLanguage({ commit }, langOption) {
            commit('setLanguage', langOption);
        },
        updateUsername({ commit }, username) {
            commit('setUsername', username);
        },
        updatePassword({ commit }, password) {
            commit('setPassword', password);
        },
        updateAutoLogin({ commit }, autoLogin) {
            commit('setAutoLogin', autoLogin);
        },
        updateAuthToken({ commit }, authToken) {
            commit('setAuthToken', authToken);
        },
        updateDeviceToken({ commit }, deviceToken) {
            commit('setDeviceToken', deviceToken);
        },
        updateUserPerm({ commit }, userPerm) {
            commit('setUserPerm', userPerm);
        },
        updateNfInventory({ commit }, nfInventory) {
            commit('setNfInventory', nfInventory);
        }
    },
    getters: {
        getUrl: state => state.url,
        getIsSignedIn: state => state.isSignedIn,
        getUseAppLock: state => state.useAppLock,
        getUserPin: state => state.userPin,
        getLockOption: state => state.lockOption,
        getLanguage: state => state.language,
        getUsername: state => state.username,
        getPassword: state => state.password,
        getAutoLogin: state => state.autoLogin,
        getAuthToken: state => state.authToken,
        getDeviceToken: state => state.deviceToken,
        getUserPerm: state => state.userPerm,
        getNfInventory: state => state.nfInventory,
    }
});