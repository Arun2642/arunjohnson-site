# Arun Johnson Site

The main site remains a static GitHub Pages site. The Climate Energy Ventures Q&A is a side page at `/cev/`, using the dark interactive-Q&A visual language from the earlier homepage prototype.

## Public Q&A

GitHub Pages serves `cev/index.html` and the public graph in `data/qna.json`. The page first tries the local Flask API and then falls back to the checked-in JSON file, so the same page works locally and on GitHub Pages.

## Local Q&A editor

The editor uses Flask and a local MongoDB database. Make sure MongoDB is running locally, then from the repository root:

```powershell
npm install
npm run admin:build
python scripts\seed_mongo.py
python app.py
```

Open these URLs:

- Public site: `http://127.0.0.1:5000/`
- CEV Q&A: `http://127.0.0.1:5000/cev/`
- Graph editor: `http://127.0.0.1:5000/admin/`

The local admin password defaults to `admin`; override it with `ADMIN_PASSWORD`.

The editor's Dictate button uses the browser's built-in speech recognition, so no API key or audio upload is needed. Chrome and Edge can dictate directly in the answer editor; stopping the recording sends the resulting text to the locally installed Codex CLI. The CLI must be signed in on this machine. If browser speech recognition is unavailable, focus the editor, press `Win+H` to use Windows dictation, and click `Polish draft` when finished.

By default the server invokes `codex.cmd exec --model gpt-5.6-luna` with the dictated text on standard input, using an ephemeral read-only run. Override `CODEX_COMMAND`, `CODEX_LUNA_MODEL`, or `CODEX_TIMEOUT_SECONDS` if needed. If Codex has not been signed in yet, run `codex login` once in PowerShell.

In the editor, right-click the canvas to create a blurb or question, double-click a node to edit it, and drag between nodes to connect them. Connections must run from blurb to question or question to blurb. Double-clicking a blurb opens an expanded rich editor with formatting, links, lists, and image URLs. Dragged node positions can be saved and restored.

After editing the local graph, export the current MongoDB state to the static file before publishing:

```powershell
npm run qna:export
```

Commit the resulting `data/qna.json` along with any content changes and push the branch used by GitHub Pages.
