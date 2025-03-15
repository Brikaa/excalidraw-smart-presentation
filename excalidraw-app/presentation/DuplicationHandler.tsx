import { useEffect } from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export function DuplicationHandler(props: {
  excalidrawAPI: ExcalidrawImperativeAPI;
}) {
  const { excalidrawAPI } = props;

  useEffect(() => {
    const unsub = excalidrawAPI.onChange((elements, appState) => {
      if (appState.newElement) {
        // Don't update scene while an element is being drag-created
        return;
      }
      let changed = false;
      const newElements = elements.map((e) => {
        if (
          e.customData?.name === undefined &&
          (e.type !== "image" || e.status !== "pending")
        ) {
          changed = true;
          return { ...e, customData: { ...e.customData, name: e.id } };
        }
        return e;
      });
      if (changed) {
        excalidrawAPI.updateScene({ elements: newElements });
      }
    });
    return () => {
      unsub();
    };
  }, [excalidrawAPI]);

  return null;
}
