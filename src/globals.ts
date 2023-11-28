import { SHA1, MD5, enc } from 'crypto-js';
import { reactive } from 'vue';

export const globals = reactive({
  //appUrl: 'http://localhost/',
  appUrl: 'https://www.izus.cz/',
  logoutQuery: '?logout=true',
  hmac: (username: string, password: string, salt: string) => SHA1(MD5(enc.Latin1.parse(password + username)).toString().toLocaleLowerCase('sk-SK') + salt).toString().toLocaleLowerCase('sk-SK'),
});