import { useCallback, useEffect, useMemo, useState } from "react";
import { importFromLocalStorage } from "../data/localStorage";
import { Excalidraw } from "../../packages/excalidraw";
import type {
  ExcalidrawElement,
  ExcalidrawFrameElement,
} from "../../packages/excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "../../packages/excalidraw/types";

export function PresentationScene(props: {
  elements: ExcalidrawElement[];
  frame: ExcalidrawFrameElement;
}) {
  const { elements, frame } = props;
  const frameElements = useMemo(
    () => elements.filter((e) => e.frameId === frame?.id),
    [elements, frame?.id],
  );

  const [canvasWidth, setCanvasWidth] = useState(1);
  const [canvasHeight, setCanvasHeight] = useState(1);

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const loadExcalidrawAPI = useCallback(
    (api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api),
    [],
  );

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    const state = excalidrawAPI.getAppState();
    setCanvasWidth(state.width);
    setCanvasHeight(state.height);
    const unsub = excalidrawAPI.onChange((_, appState) => {
      setCanvasHeight(appState.height);
      setCanvasWidth(appState.width);
    });
    return () => {
      unsub();
    };
  }, [excalidrawAPI]);

  const positionedElements = useMemo(
    () =>
      frameElements.map((e) => ({
        ...e,
        x: e.x - frame.x,
        y: e.y - frame.y,
        height: e.height * (canvasHeight / Math.max(frame.width, frame.height)),
        width: e.width * (canvasWidth / Math.max(frame.width, frame.height)),
      })),
    [
      canvasHeight,
      canvasWidth,
      frame.height,
      frame.width,
      frame.x,
      frame.y,
      frameElements,
    ],
  );

  return (
    <Excalidraw
      initialData={{ elements: positionedElements }}
      excalidrawAPI={loadExcalidrawAPI}
      viewModeEnabled
      presentationModeEnabled
    />
  );
}

export function PresentationPage() {
  const { elements } = importFromLocalStorage();

  // Get first frame
  const frame = useMemo(
    () => elements.find((e): e is ExcalidrawFrameElement => e.type === "frame"),
    [elements],
  );
  if (!frame) {
    return null;
  }
  return <PresentationScene elements={elements} frame={frame} />;
}
