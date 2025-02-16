import React, { useCallback } from "react";
import { Button, Footer } from "@excalidraw/excalidraw/index";
import { EncryptedIcon } from "./EncryptedIcon";
import { ExcalidrawPlusAppLink } from "./ExcalidrawPlusAppLink";
import { isExcalidrawPlusSignedUser } from "../app_constants";
import { DebugFooter, isVisualDebuggerEnabled } from "./DebugCanvas";

export const AppFooter = React.memo(
  ({ onChange }: { onChange: () => void }) => {
    const startPresentation = useCallback(() => {
      const newUrl = new URL(window.location.href);
      newUrl.hash = "#presentation";
      window.open(newUrl.href, "_blank");
    }, []);
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
