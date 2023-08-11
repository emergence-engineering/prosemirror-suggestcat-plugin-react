import React, {
  FC,
  FocusEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePopper } from "react-popper";
import { completePluginKey, Status } from "prosemirror-suggestcat-plugin";
import { EditorView } from "prosemirror-view";
import { promptIcons } from "./promptIcons";

export const SuggestionOverlay: FC<{
  editorView: EditorView;
  status: Status | undefined;
  domReference: HTMLElement | null | undefined;
  content: string | undefined;
}> = ({ status, domReference, content, editorView }) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [selectedButton, setSelectedButton] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(domReference, popperElement, {
    placement: "bottom-start",
    modifiers: [
      { name: "flip", enabled: true },
      {
        name: "preventOverflow",
        options: {
          mainAxis: false,
        },
      },
      {
        name: "offset",
        options: {
          offset: [0, 0],
        },
      },
    ],
  });

  const accept = useCallback(() => {
    if (!editorView) {
      return;
    }
    const state = completePluginKey.getState(editorView.state);
    if (state?.status === Status.finished)
      editorView.dispatch(
        editorView.state.tr.setMeta(completePluginKey, {
          type: state.type,
          status: Status.accepted,
        }),
      );
    editorView.focus();
  }, [editorView]);

  const reject = useCallback(() => {
    if (!editorView) {
      return;
    }
    const state = completePluginKey.getState(editorView.state);
    if (state?.status === "finished")
      editorView.dispatch(
        editorView.state.tr.setMeta(completePluginKey, {
          type: state.type,
          status: Status.rejected,
        }),
      );
    editorView.focus();
  }, [editorView]);

  const cancel = useCallback(() => {
    if (!editorView) {
      return;
    }
    editorView.dispatch(
      editorView.state.tr.setMeta(completePluginKey, {
        status: Status.cancelled,
      }),
    );
    editorView.focus();
  }, [editorView]);

  const keydownHandler = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "ArrowDown" && selectedButton === 0) {
        setSelectedButton(1);
      } else if (e.key === "ArrowUp" && selectedButton === 1) {
        setSelectedButton(0);
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (selectedButton === 0) {
          accept();
          return true;
        } else {
          reject();
          return true;
        }
      } else if (e.key === "Escape") {
        completePluginKey.getState(editorView.state)?.status ===
        Status.streaming
          ? cancel()
          : reject();

        return true;
      }
      return true;
    },
    [selectedButton, accept, reject],
  );

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }
    rootRef.current?.focus();
  }, [rootRef, status]);

  const rootOnBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (
        completePluginKey.getState(editorView.state)?.status ===
        Status.streaming
      ) {
        cancel();
      } else if (
        rootRef.current &&
        (!event.relatedTarget ||
          !(event.relatedTarget instanceof Node) ||
          !rootRef.current?.contains(event?.relatedTarget || null))
      ) {
        reject();
      }
    },
    [rootRef, reject],
  );

  useEffect(() => {
    const element = document.querySelector("#suggestion-overlay");
    if (
      typeof element?.scrollTop !== "number" ||
      typeof element?.scrollHeight !== "number"
    ) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [content]);

  return (
    <div
      id={"popper"}
      ref={setPopperElement}
      className={"overlay-popper-element"}
      style={styles.popper}
      {...attributes.popper}
    >
      {status === Status.new && (
        <div
          className={"overLayContainer"}
          ref={rootRef}
          tabIndex={0}
          onBlur={rootOnBlur}
          onKeyDown={keydownHandler}
        >
          <div className={"loader"}></div>
        </div>
      )}
      {(status === Status.streaming || status === Status.finished) && (
        <div
          className={"overLayContainer"}
          ref={rootRef}
          tabIndex={0}
          onBlur={rootOnBlur}
          onKeyDown={keydownHandler}
        >
          <div className={"overlay"} id={"suggestion-overlay"}>
            {!!content?.length && (
              <span className={"close"} onClick={cancel}></span>
            )}
            {content}
          </div>
          {status === Status.finished && (
            <div className="buttons">
              <div className="actionLabel">Actions</div>
              <div
                className={
                  selectedButton === 0
                    ? "actionButton-selected"
                    : "actionButton"
                }
                onClick={accept}
              >
                <div className={"iconWrapper"}>{promptIcons.AcceptIcon()}</div>
                Accept
              </div>
              <div
                className={
                  selectedButton === 1
                    ? "actionButton-selected"
                    : "actionButton"
                }
                onClick={reject}
              >
                <div className={"iconWrapper"}>{promptIcons.RejectIcon()}</div>
                Reject
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
