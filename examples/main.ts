import { createApp } from "@usevibejs/ui";
import Proof from "../test/fixtures/Proof.vibe";
import AdapterBoard from "../test/fixtures/AdapterBoard.vibe";
const exposed = createApp(location.search.includes("proof") ? Proof : AdapterBoard).mount("#app");
if (location.search.includes("adapter")) Object.assign(window, { fixture: exposed });
