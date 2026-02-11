# prosemirror-suggestcat-plugin-react

[![made by Emergence Engineering](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence-Engineering**](https://emergence-engineering.com/)

React UI for [prosemirror-suggestcat-plugin](https://github.com/emergence-engineering/prosemirror-suggestcat-plugin).

## Features

![feature-gif](https://suggestcat.com/basic-suggestr-eact-example.gif)

- A slash menu to select and filter AI commands, implemented with [prosemirror-slash-menu-react](https://github.com/emergence-engineering/prosemirror-slash-menu-react)
- An "Ask AI" tooltip that appears when text is selected
- A suggestion overlay to show streaming results and accept/reject them

## How to use?

- Import `SlashMenuPlugin` from [`prosemirror-slash-menu`](https://github.com/emergence-engineering/prosemirror-slash-menu)
- Import `ProsemirrorSuggestcatPluginReact` and `promptCommands` from this package
- Add `SlashMenuPlugin` and `completePluginV2` to your editor
- Add the component next to your editor div

```tsx
import { SlashMenuPlugin } from "prosemirror-slash-menu";
import { completePluginV2 } from "prosemirror-suggestcat-plugin";
import {
  promptCommands,
  ProsemirrorSuggestcatPluginReact,
} from "prosemirror-suggestcat-plugin-react";

const Editor: FC = () => {
  const [editorState, setEditorState] = useState<EditorState>();
  const [editorView, setEditorView] = useState<EditorView>();
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = EditorState.create({
      doc: schema.nodeFromJSON(initialDoc),
      plugins: [
        completePluginV2("<YOUR_API_KEY>"),
        SlashMenuPlugin(promptCommands, undefined, undefined, false, true),
      ],
    });
    const view = new EditorView(document.querySelector("#editor"), {
      state,
      dispatchTransaction: (tr) => {
        try {
          const newState = view.state.apply(tr);
          view.updateState(newState);
          setEditorState(newState);
        } catch (e) {}
      },
    });
    setEditorView(view);
    setEditorState(view.state);
    return () => {
      view.destroy();
    };
  }, [editorRef]);

  return (
    <Root>
      <StyledEditor id="editor" ref={editorRef} />
      {editorView && editorView?.state && (
        <ProsemirrorSuggestcatPluginReact
          editorView={editorView}
          editorState={editorView.state}
        />
      )}
    </Root>
  );
};
```

### Props

- `editorView` — ProseMirror EditorView
- `editorState` — ProseMirror EditorState
- `domReference` — optional HTMLElement for Popper positioning (defaults to the current selection node)

### Styles

```typescript
import "prosemirror-suggestcat-plugin-react/dist/styles/styles.css";
```

### UI behaviour

Navigation works with keyboard (arrows, Tab, Enter, Escape) and mouse clicks. The slash menu is powered by [prosemirror-slash-menu-react](https://github.com/emergence-engineering/prosemirror-slash-menu-react).

### Customization

This package is intended as a quick way to get a working UI. You can customize it by:

- Providing your own `domReference` for positioning
- Overriding the CSS classes
- Passing your own commands into `SlashMenuPlugin` to change labels or icons

The command functions themselves must stay the same to work with [prosemirror-suggestcat-plugin](https://github.com/emergence-engineering/prosemirror-suggestcat-plugin).