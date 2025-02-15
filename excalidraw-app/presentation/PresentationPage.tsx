import { useEffect, useMemo } from "react";
import { importFromLocalStorage } from "../data/localStorage";
import { Excalidraw } from "../../packages/excalidraw";
import { CODES } from "../../packages/excalidraw/keys";
import type {
  ExcalidrawElement,
  ExcalidrawFrameElement,
} from "../../packages/excalidraw/element/types";

export function PresentationScene(props: {
  elements: ExcalidrawElement[];
  frame: ExcalidrawFrameElement;
}) {
  const { elements, frame } = props;
  const frameElements = useMemo(
    () => elements.filter((e) => e.frameId === frame?.id),
    [elements, frame?.id],
  );
  const positionedElements = frameElements.map((e) => ({
    ...e,
    x: e.x - frame.x,
    y: e.y - frame.y,
  }));
  return (
    <Excalidraw
      initialData={{ elements: positionedElements }}
      viewModeEnabled
    />
  );
}

export function PresentationPage(props: {
  setPresentation: (enabled: boolean) => unknown;
}) {
  const { setPresentation } = props;
  const { elements } = importFromLocalStorage();

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.code === CODES.Z) {
        setPresentation(false);
      }
    });
    const appMenu = document.getElementsByClassName("App-menu");
    for (const el of appMenu) {
      el.remove();
    }
  }, [setPresentation]);

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
