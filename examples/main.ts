import { createApp } from '@usevibejs/ui';
import Benchmark from '../benchmarks/Benchmark.vibe';
import App from './App.vibe';
import './style.css';
import Proof from '../test/fixtures/Proof.vibe';
import AdapterBoard from '../test/fixtures/AdapterBoard.vibe';
const exposed = createApp(
  location.search.includes('proof')
    ? Proof
    : location.search.includes('adapter')
      ? AdapterBoard
      : location.search.includes('bench')
        ? Benchmark
        : App,
).mount('#app');
if (location.search.includes('adapter') || location.search.includes('bench'))
  Object.assign(window, { fixture: exposed });
