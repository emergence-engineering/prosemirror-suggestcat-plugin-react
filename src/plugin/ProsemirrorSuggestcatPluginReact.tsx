import React, { FC, useMemo } from "react";
import { SlashMenuReact } from "prosemirror-slash-menu-react";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { promptIcons, PromptIcons } from "./promptIcons";
import { SuggestionOverlay } from "./SuggestionOverlay";
import { completePluginKey, Status } from "prosemirror-suggestcat-plugin";

export const ProsemirrorSuggestcatPluginReact: FC<{
  editorView: EditorView;
  editorState: EditorState;
  domReference: HTMLElement;
}> = ({ editorView, editorState, domReference }) => {
  const suggestionState = useMemo(() => {
    return completePluginKey.getState(editorView.state);
  }, [editorView.state]);
  const overlayElement = useMemo(() => {
    return document.getElementById("suggestion-overlay");
  }, [editorState]);

  const slashMenuDomReference = useMemo(() => {
    return overlayElement || domReference;
  }, [domReference, overlayElement, suggestionState]);
  // const StarIconNode = <StarIcon />;

  return (
    <>
      <div>
        {suggestionState?.status !== Status.idle &&
          suggestionState?.status !== Status.done && (
            <SuggestionOverlay
              editorView={editorView}
              status={suggestionState?.status}
              domReference={domReference}
              content={suggestionState?.result}
            />
          )}
        <SlashMenuReact
          editorState={editorState}
          editorView={editorView}
          // filterFieldIcon={promptIcons.StarIcon}
          filterPlaceHolder="Start writing a prompt or choose from below..."
          mainMenuLabel="Actions"
          popperReference={slashMenuDomReference}
          icons={{
            [PromptIcons.FixGrammar]: promptIcons.FixGrammarIcon,
            [PromptIcons.MakeItShorter]: promptIcons.MakeItShorterIcon,
            [PromptIcons.MakeItLonger]: promptIcons.MakeItLongerIcon,
            [PromptIcons.Complete]: promptIcons.CompleteIcon,
            [PromptIcons.Explain]: promptIcons.ExplainIcon,
            [PromptIcons.Simplify]: promptIcons.SimplifyIcon,
            [PromptIcons.ChangeTone]: promptIcons.ChangeToneIcon,
            [PromptIcons.Translate]: promptIcons.TranslateIcon,
            [PromptIcons.ActionItems]: promptIcons.ActionItemsIcon,
          }}
          rightIcons={{
            [PromptIcons.ChangeTone]: promptIcons.SubMenuArrowIcon,
            [PromptIcons.Translate]: promptIcons.SubMenuArrowIcon,
          }}
          clickable={true}
        />
      </div>
    </>
  );
};
