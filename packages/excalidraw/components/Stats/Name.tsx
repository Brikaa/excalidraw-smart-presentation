import { mutateElement } from "@excalidraw/excalidraw/element/mutateElement";

import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import "./Name.scss";

export interface NameProps {
  element: ExcalidrawElement;
}

export const Name = ({ element }: NameProps) => {
  return (
    <div className="drag-input-container">
      <input
        onChange={(e) => {
          mutateElement(element, {
            customData: {
              ...element.customData,
              name: e.target.value,
            },
          });
        }}
        className="drag-input name-input"
        value={element.customData?.name ?? ""}
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  );
};
