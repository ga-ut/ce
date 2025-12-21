import { CE } from "@/ce";
import "@/App";

const rootElement = document.querySelector("app-root") as HTMLElement | null;

CE.setEntryPoint("app-root", { rootElement, hydrate: true });
