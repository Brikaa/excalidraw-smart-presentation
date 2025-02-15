import { useCallback, useEffect, useMemo } from "react";
import { importFromLocalStorage } from "../data/localStorage";
import { Button, Excalidraw, Footer } from "../../packages/excalidraw";
import type {
  ExcalidrawElement,
  ExcalidrawFrameElement,
} from "../../packages/excalidraw/element/types";

export function PresentationScene(props: {
  elements: ExcalidrawElement[];
  frame: ExcalidrawFrameElement;
  setPresentation: (enabled: boolean) => unknown;
}) {
  const { elements, frame, setPresentation } = props;
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
  const stopPresentation = useCallback(
    () => setPresentation(false),
    [setPresentation],
  );
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
    <Excalidraw initialData={{ elements: positionedElements }} viewModeEnabled>
      <Footer>
        <Button
          onSelect={stopPresentation}
          className={"collab-buton"}
          style={{ width: "fit-content" }}
        >
          Stop presenting
        </Button>
      </Footer>
    </Excalidraw>
  );
}

export function PresentationPage(props: {
  setPresentation: (enabled: boolean) => unknown;
}) {
  const { setPresentation } = props;
  const { elements } = importFromLocalStorage();

  // Get first frame
  const frame = useMemo(
    () => elements.find((e): e is ExcalidrawFrameElement => e.type === "frame"),
    [elements],
  );
  if (!frame) {
    return null;
  }
  return (
    <PresentationScene
      elements={elements}
      frame={frame}
      setPresentation={setPresentation}
    />
  );
}
