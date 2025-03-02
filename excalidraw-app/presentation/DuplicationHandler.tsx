import { useEffect, useRef } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export function DuplicationHandler(props: {
  excalidrawAPI: ExcalidrawImperativeAPI;
}) {
  const { excalidrawAPI } = props;

  const prevElementsCount = useRef(0);

  useEffect(() => {
    const unsub = excalidrawAPI.onChange((elements, appState) => {
      if (
        !excalidrawAPI ||
        elements.length === prevElementsCount.current ||
        appState.newElement
      ) {
        return;
      }
      const newElements = elements.map((e) =>
        e.customData?.name === undefined &&
        (e.type !== "image" || e.status !== "pending")
          ? { ...e, customData: { ...e.customData, name: e.id } }
          : e,
      );
      prevElementsCount.current = elements.length;
      excalidrawAPI.updateScene({ elements: newElements });
    });
    return () => {
      unsub();
    };
  }, [excalidrawAPI]);

  return null;
}
