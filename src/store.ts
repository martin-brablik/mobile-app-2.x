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
    },
    mutations: {
        setUrl(state, url) {
            state.url = url;
        },
        setIsSignedIn(state, isSignedIn) {
            state.isSignedIn = isSignedIn;
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
    }
});