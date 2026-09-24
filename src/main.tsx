import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Must run before <App/> renders: detects the parent's language + sets <html dir>.
import "./i18n";
import { hideSplash, setupHardwareBack, statusBarLight } from "./lib/native";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Native bootstrap — these are no-ops on web. Run after first paint so we
// don't block the initial render.
requestAnimationFrame(() => {
  // Hide the native splash shortly after the first real screen has rendered.
  // 50ms gives React a chance to flush the first commit.
  setTimeout(() => { hideSplash(); }, 50);
  statusBarLight('#FDF8F7');
  setupHardwareBack();
});
