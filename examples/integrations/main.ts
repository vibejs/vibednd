import { createApp } from '@usevibejs/ui';
import { createVibeQueryPlugin } from '@usevibejs/query';
import { createAuthPlugin, createVibeAuthClient } from '@usevibejs/auth';
import Ecosystem from './Ecosystem.vibe';
import '../style.css';
const auth = createVibeAuthClient({ baseURL: location.origin });
createApp(Ecosystem).use(createVibeQueryPlugin()).use(createAuthPlugin(auth)).mount('#app');
