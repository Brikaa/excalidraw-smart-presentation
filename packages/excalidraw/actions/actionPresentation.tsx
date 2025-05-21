import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import { register } from "@excalidraw/excalidraw/actions/register";
import { presentIcon } from "@excalidraw/excalidraw/components/icons";

export const actionPresent = register({
  name: "present",
  label: "labels.present",
  icon: presentIcon,
  trackEvent: { category: "canvas" },
  perform: (_, appState, __, app) => {
    const frames = app.scene
      .getNonDeletedElements()
      .filter((e) => e.type === "frame");
    const selectedElementIds = appState.selectedElementIds;
    const selectedFrames = app.scene
      .getSelectedElements({ selectedElementIds })
      .filter((e) => e.type === "frame");
    let frameIndex = 0;
    if (selectedFrames.length !== 0) {
      const minY = Math.min(...selectedFrames.map((f) => f.y));
      frameIndex = frames.reduce((count, f) => count + (f.y < minY ? 1 : 0), 0);
    }

    const newUrl = new URL(window.location.href);
    newUrl.hash = `#presentation=${frameIndex}`;
    window.open(newUrl.href, "_blank");

    return { captureUpdate: CaptureUpdateAction.NEVER };
  },
});
