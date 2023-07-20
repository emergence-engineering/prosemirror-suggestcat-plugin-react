import React, {
  FC,
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
  domReference: HTMLElement;
  content: string | undefined;
}> = ({ status, domReference, content, editorView }) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [selectedButton, setSelectedButton] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const buttonsRef = useRef<HTMLDivElement | null>(null);

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
    // editorView.dispatch(editorView.state.tr.setSelection());
    if (state?.status === "finished")
      editorView.dispatch(
        editorView.state.tr.setMeta(completePluginKey, {
          type: state.type,
          status: Status.rejected,
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
        reject();
        return true;
      }
    },
    [selectedButton, accept, reject],
  );
  useEffect(() => {
    if (!rootRef.current) return;
    if (status === Status.finished) rootRef.current?.focus();
  }, [rootRef, status]);
  const rootOnBlur = useCallback(
    (event: FocusEvent) => {
      if (
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
    if (!overlayRef.current?.scrollTop || !overlayRef.current?.scrollHeight) {
      return;
    }
    // @ts-ignore
    overlayRef.current.scrollTop = overlayRef.current.scrollHeight;
    // @ts-ignore
    overlayRef.current.scrollIntoViewIfNeeded(false);
  }, [content]);
  useEffect(() => {
    if (!buttonsRef.current) return;
    // @ts-ignore
    buttonsRef.current.scrollIntoViewIfNeeded(false);
  }, [status]);
  return (
    <div
      id={"popper"}
      ref={setPopperElement}
      className={"overlay-popper-element"}
      style={styles.popper}
      {...attributes.popper}
    >
      {(status === Status.streaming || status === Status.finished) && (
        <div
          className={"overLayContainer"}
          ref={rootRef}
          onKeyDown={keydownHandler}
          tabIndex={0}
          // @ts-ignore
          onBlur={rootOnBlur}
        >
          <div className={"overlay"} id={"suggestion-overlay"} ref={overlayRef}>
            {content}
          </div>
          {status === Status.finished && (
            <div className={"buttons"} ref={buttonsRef}>
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
                  selectedButton === 0
                    ? "actionButton-selected"
                    : "actionButton"
                }
                onClick={reject}
              >
                <div className={"iconWrapper"}>{promptIcons.RejectIcon()}</div>
                Reject
              </div>
              {/*<ActionButton selected={selectedButton === 2}>*/}
              {/*  Make it shorter*/}
              {/*</ActionButton>*/}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
