import React, { useCallback } from "react";
import { Button, Footer } from "@excalidraw/excalidraw/index";
import { EncryptedIcon } from "./EncryptedIcon";
import { ExcalidrawPlusAppLink } from "./ExcalidrawPlusAppLink";
import { isExcalidrawPlusSignedUser } from "../app_constants";
import { DebugFooter, isVisualDebuggerEnabled } from "./DebugCanvas";

export const AppFooter = React.memo(
  ({
    onChange,
    setPresentation,
  }: {
    onChange: () => void;
    setPresentation: (enabled: boolean) => unknown;
  }) => {
    const startPresentation = useCallback(
      () => setPresentation(true),
      [setPresentation],
    );
    return (
      <Footer>
        <div
          style={{
            display: "flex",
            gap: ".5rem",
            alignItems: "center",
          }}
        >
          {isVisualDebuggerEnabled() && <DebugFooter onChange={onChange} />}
          {isExcalidrawPlusSignedUser ? (
            <ExcalidrawPlusAppLink />
          ) : (
            <EncryptedIcon />
          )}
          <Button
            onSelect={startPresentation}
            className={"collab-buton"}
            style={{ width: "fit-content" }}
          >
            Present
          </Button>
        </div>
      </Footer>
    );
  },
);
