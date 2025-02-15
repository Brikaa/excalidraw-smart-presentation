import { useCallback, useEffect, useRef } from "react";
import type { ExcalidrawImperativeAPI } from "../../packages/excalidraw/types";
import { convertToExcalidrawElements } from "../../packages/excalidraw";
import { CODES } from "../../packages/excalidraw/keys";

const rectangle = {
  type: "rectangle" as const,
  x: 100,
  y: 100,
  width: 322.4000244140625,
  height: 235.20005798339844,
};

const ANIMATION_DURATION_MS = 200;

let startTime: number | null = null;

export function Presentation(props: {
  excalidrawAPI: ExcalidrawImperativeAPI;
  setPresentation: (enabled: boolean) => unknown;
}) {
  const { excalidrawAPI, setPresentation } = props;

  const animate = useCallback(
    (timestamp: number) => {
      if (!excalidrawAPI) {
        throw new Error("No Excalidraw API");
      }
      if (!startTime) {
        startTime = timestamp;
      }
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);

      const finalX = 400;
      const delta = finalX - rectangle.x;
      const newX = rectangle.x + delta * progress;

      const newElements = convertToExcalidrawElements([
        { ...rectangle, x: newX },
      ]);
      excalidrawAPI.updateScene({ elements: newElements });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        startTime = null;
      }
    },
    [excalidrawAPI],
  );

  const prevElementsCount = useRef(0);

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.code === CODES.Z) {
        setPresentation(true);
      }
    });
    const unsub = excalidrawAPI.onChange((elements, appState) => {
      if (
        !excalidrawAPI ||
        elements.length === prevElementsCount.current ||
        appState.newElement
      ) {
        return;
      }
      const newElements = elements.map((e) =>
        e.customData?.name === undefined
          ? { ...e, customData: { name: e.id } }
          : e,
      );
      prevElementsCount.current = elements.length;
      excalidrawAPI.updateScene({ elements: newElements });
    });
    return () => {
      unsub();
    };
  }, [excalidrawAPI, setPresentation]);

  return null;
}
