import { useEffect, useMemo } from "react";
import { importFromLocalStorage } from "../data/localStorage";
import { Excalidraw } from "../../packages/excalidraw";
import type {
  ExcalidrawElement,
  ExcalidrawFrameElement,
} from "../../packages/excalidraw/element/types";

export function PresentationScene(props: {
  elements: ExcalidrawElement[];
  frame: ExcalidrawFrameElement;
}) {
  const { elements, frame } = props;
  useEffect(() => {
    const interval = setInterval(() => {
      const appMenu = document.getElementsByClassName("App-menu");
      if (appMenu.length === 0) {
        return;
      }
      clearInterval(interval);
      for (const el of appMenu) {
        const htmlElement = el as HTMLElement;
        htmlElement.style.opacity = "0";
      }
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, []);
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
