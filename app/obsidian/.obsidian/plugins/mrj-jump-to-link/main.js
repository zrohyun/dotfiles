'use strict';

var obsidian = require('obsidian');
var state = require('@codemirror/state');
var view = require('@codemirror/view');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class Settings {
    constructor() {
        // Defaults as in Vimium extension for browsers
        this.letters = 'sadfjklewcmpgh';
        this.jumpToAnywhereRegex = '\\b\\w{3,}\\b';
        this.lightspeedCaseSensitive = false;
        this.jumpToLinkIfOneLinkOnly = true;
        this.lightspeedJumpToStartOfWord = true;
    }
}

class MarkWidget extends view.WidgetType {
    constructor(mark, type, matchedEventKey) {
        super();
        this.mark = mark;
        this.type = type;
        this.matchedEventKey = matchedEventKey;
    }
    eq(other) {
        return other.mark === this.mark && other.matchedEventKey == this.matchedEventKey;
    }
    toDOM() {
        const mark = activeDocument.createElement("span");
        mark.innerText = this.mark;
        const wrapper = activeDocument.createElement("div");
        wrapper.style.display = "inline-block";
        wrapper.style.position = "absolute";
        wrapper.classList.add('jl');
        wrapper.classList.add('jl-' + this.type);
        wrapper.classList.add('popover');
        if (this.matchedEventKey && this.mark.toUpperCase().startsWith(this.matchedEventKey.toUpperCase())) {
            wrapper.classList.add('matched');
        }
        wrapper.append(mark);
        return wrapper;
    }
    ignoreEvent() {
        return false;
    }
}

class MarkPlugin {
    constructor(_view) {
        this.links = [];
        this.matchedEventKey = undefined;
        this.links = [];
        this.matchedEventKey = undefined;
        this.decorations = view.Decoration.none;
    }
    setLinks(links) {
        this.links = links;
        this.matchedEventKey = undefined;
    }
    clean() {
        this.links = [];
        this.matchedEventKey = undefined;
    }
    filterWithEventKey(eventKey) {
        if (eventKey.length != 1)
            return;
        this.links = this.links.filter(v => {
            return v.letter.length == 2 && v.letter[0].toUpperCase() == eventKey.toUpperCase();
        });
        this.matchedEventKey = eventKey;
    }
    get visible() {
        return this.links.length > 0;
    }
    update(_update) {
        const widgets = this.links.map((x) => view.Decoration.widget({
            widget: new MarkWidget(x.letter, x.type, this.matchedEventKey),
            side: 1,
        }).range(x.index));
        this.decorations = view.Decoration.set(widgets);
    }
}

/**
 * Get only visible content
 * @param cmEditor
 * @returns Letter offset and visible content as a string
 */
function getVisibleLineText(cmEditor) {
    const scrollInfo = cmEditor.getScrollInfo();
    const { line: from } = cmEditor.coordsChar({ left: 0, top: 0 }, 'page');
    const { line: to } = cmEditor.coordsChar({ left: scrollInfo.left, top: scrollInfo.top + scrollInfo.height });
    const indOffset = cmEditor.indexFromPos({ ch: 0, line: from });
    const strs = cmEditor.getRange({ ch: 0, line: from }, { ch: 0, line: to + 1 });
    return { indOffset, strs };
}
/**
 *
 * @param alphabet - Letters which used to produce hints
 * @param numLinkHints - Count of needed links
 */
function getLinkHintLetters(alphabet, numLinkHints) {
    const alphabetUppercase = alphabet.toUpperCase();
    let prefixCount = Math.ceil((numLinkHints - alphabetUppercase.length) / (alphabetUppercase.length - 1));
    // ensure 0 <= prefixCount <= alphabet.length
    prefixCount = Math.max(prefixCount, 0);
    prefixCount = Math.min(prefixCount, alphabetUppercase.length);
    const prefixes = ['', ...Array.from(alphabetUppercase.slice(0, prefixCount))];
    const linkHintLetters = [];
    for (let i = 0; i < prefixes.length; i++) {
        const prefix = prefixes[i];
        for (let j = 0; j < alphabetUppercase.length; j++) {
            if (linkHintLetters.length < numLinkHints) {
                const letter = alphabetUppercase[j];
                if (prefix === '') {
                    if (!prefixes.contains(letter)) {
                        linkHintLetters.push(letter);
                    }
                }
                else {
                    linkHintLetters.push(prefix + letter);
                }
            }
            else {
                break;
            }
        }
    }
    return linkHintLetters;
}
function getMDHintLinks(content, offset, letters) {
    var _a;
    // expecting either [[Link]] or [[Link|Title]]
    const regExInternal = /\[\[(.+?)(\|.+?)?]]/g;
    // expecting [Title](../example.md)
    const regExMdInternal = /\[[^\[\]]+?\]\(((\.\.|\w|\d).+?)\)/g;
    // expecting [Title](file://link), [Title](https://link) or any other [Jira-123](jira://bla-bla) link
    const regExExternal = /\[[^\[\]]+?\]\((.+?:\/\/.+?)\)/g;
    // expecting http://hogehoge or https://hogehoge
    const regExUrl = /( |\n|^)(https?:\/\/[^ \n]+)/g;
    let indexes = new Set();
    let linksWithIndex = [];
    let regExResult;
    const addLinkToArray = (link) => {
        if (indexes.has(link.index))
            return;
        indexes.add(link.index);
        linksWithIndex.push(link);
    };
    while (regExResult = regExInternal.exec(content)) {
        const linkText = (_a = regExResult[1]) === null || _a === void 0 ? void 0 : _a.trim();
        addLinkToArray({ index: regExResult.index + offset, type: 'internal', linkText });
    }
    // External Link above internal, to prefer type external over interal in case of a dupe
    while (regExResult = regExExternal.exec(content)) {
        const linkText = regExResult[1];
        addLinkToArray({ index: regExResult.index + offset, type: 'external', linkText });
    }
    while (regExResult = regExMdInternal.exec(content)) {
        const linkText = regExResult[1];
        addLinkToArray({ index: regExResult.index + offset, type: 'internal', linkText });
    }
    while (regExResult = regExUrl.exec(content)) {
        const linkText = regExResult[2];
        addLinkToArray({ index: regExResult.index + offset + 1, type: 'external', linkText });
    }
    const linkHintLetters = getLinkHintLetters(letters, linksWithIndex.length);
    const linksWithLetter = [];
    linksWithIndex
        .sort((x, y) => x.index - y.index)
        .forEach((linkHint, i) => {
        linksWithLetter.push(Object.assign({ letter: linkHintLetters[i] }, linkHint));
    });
    return linksWithLetter.filter(link => link.letter);
}
function createWidgetElement(content, type) {
    const linkHintEl = activeDocument.createElement('div');
    linkHintEl.classList.add('jl');
    linkHintEl.classList.add('jl-' + type);
    linkHintEl.classList.add('popover');
    linkHintEl.innerHTML = content;
    return linkHintEl;
}
function displaySourcePopovers(cmEditor, linkKeyMap) {
    const drawWidget = (cmEditor, linkHint) => {
        const pos = cmEditor.posFromIndex(linkHint.index);
        // the fourth parameter is undocumented. it specifies where the widget should be place
        return cmEditor.addWidget(pos, createWidgetElement(linkHint.letter, linkHint.type), false, 'over');
    };
    linkKeyMap.forEach(x => drawWidget(cmEditor, x));
}

class CM6LinkProcessor {
    constructor(editor, alphabet) {
        this.getSourceLinkHints = () => {
            const { letters } = this;
            const { index, content } = this.getVisibleLines();
            return getMDHintLinks(content, index, letters);
        };
        this.cmEditor = editor;
        this.letters = alphabet;
    }
    init() {
        return this.getSourceLinkHints();
    }
    getVisibleLines() {
        var _a, _b, _c;
        const { cmEditor } = this;
        let { from, to } = cmEditor.viewport;
        // For CM6 get real visible lines top
        // @ts-ignore
        if ((_b = (_a = cmEditor.viewState) === null || _a === void 0 ? void 0 : _a.pixelViewport) === null || _b === void 0 ? void 0 : _b.top) {
            // @ts-ignore
            const pixelOffsetTop = cmEditor.viewState.pixelViewport.top;
            // @ts-ignore
            const lines = cmEditor.viewState.viewportLines;
            // @ts-ignore
            from = (_c = lines.filter(line => line.top > pixelOffsetTop)[0]) === null || _c === void 0 ? void 0 : _c.from;
        }
        const content = cmEditor.state.sliceDoc(from, to);
        return { index: from, content };
    }
}

function extractRegexpBlocks(content, offset, regexp, letters, caseSensitive) {
    const regExUrl = caseSensitive ? new RegExp(regexp, 'g') : new RegExp(regexp, 'ig');
    let linksWithIndex = [];
    let regExResult;
    while ((regExResult = regExUrl.exec(content))) {
        const linkText = regExResult[1];
        linksWithIndex.push({
            index: regExResult.index + offset,
            type: "regex",
            linkText,
        });
    }
    const linkHintLetters = getLinkHintLetters(letters, linksWithIndex.length);
    const linksWithLetter = [];
    linksWithIndex
        .sort((x, y) => x.index - y.index)
        .forEach((linkHint, i) => {
        linksWithLetter.push(Object.assign({ letter: linkHintLetters[i] }, linkHint));
    });
    return linksWithLetter.filter(link => link.letter);
}

class CM6RegexProcessor extends CM6LinkProcessor {
    constructor(editor, alphabet, regexp, caseSensitive) {
        super(editor, alphabet);
        this.regexp = regexp;
        this.caseSensitive = caseSensitive;
    }
    init() {
        const { letters, regexp } = this;
        const { index, content } = this.getVisibleLines();
        return extractRegexpBlocks(content, index, regexp, letters, this.caseSensitive);
    }
}

class LegacyRegexpProcessor {
    constructor(cmEditor, regexp, alphabet, caseSensitive) {
        this.cmEditor = cmEditor;
        this.regexp = regexp;
        this.letters = alphabet;
        this.caseSensitive = caseSensitive;
    }
    init() {
        const [content, offset] = this.getVisibleContent();
        const links = this.getLinks(content, offset);
        this.display(links);
        return links;
    }
    getVisibleContent() {
        const { cmEditor } = this;
        const { indOffset, strs } = getVisibleLineText(cmEditor);
        return [strs, indOffset];
    }
    getLinks(content, offset) {
        const { regexp, letters } = this;
        return extractRegexpBlocks(content, offset, regexp, letters, this.caseSensitive);
    }
    display(links) {
        const { cmEditor } = this;
        displaySourcePopovers(cmEditor, links);
    }
}

class LegacySourceLinkProcessor {
    constructor(editor, alphabet) {
        this.getSourceLinkHints = (cmEditor) => {
            const { letters } = this;
            const { indOffset, strs } = getVisibleLineText(cmEditor);
            return getMDHintLinks(strs, indOffset, letters);
        };
        this.cmEditor = editor;
        this.letters = alphabet;
    }
    init() {
        const { cmEditor } = this;
        const linkHints = this.getSourceLinkHints(cmEditor);
        displaySourcePopovers(cmEditor, linkHints);
        return linkHints;
    }
}

function getPreviewLinkHints(previewViewEl, letters) {
    const anchorEls = previewViewEl.querySelectorAll('a');
    const embedEls = previewViewEl.querySelectorAll('.internal-embed');
    const linkHints = [];
    anchorEls.forEach((anchorEl, _i) => {
        var _a;
        if (checkIsPreviewElOnScreen(previewViewEl, anchorEl)) {
            return;
        }
        const linkType = anchorEl.classList.contains('internal-link')
            ? 'internal'
            : 'external';
        const linkText = linkType === 'internal'
            ? (_a = anchorEl.dataset['href']) !== null && _a !== void 0 ? _a : anchorEl.href
            : anchorEl.href;
        let offsetParent = anchorEl.offsetParent;
        let top = anchorEl.offsetTop;
        let left = anchorEl.offsetLeft;
        while (offsetParent) {
            if (offsetParent == previewViewEl) {
                offsetParent = undefined;
            }
            else {
                top += offsetParent.offsetTop;
                left += offsetParent.offsetLeft;
                offsetParent = offsetParent.offsetParent;
            }
        }
        linkHints.push({
            linkElement: anchorEl,
            letter: '',
            linkText: linkText,
            type: linkType,
            top: top,
            left: left,
        });
    });
    embedEls.forEach((embedEl, _i) => {
        const linkText = embedEl.getAttribute('src');
        const linkEl = embedEl.querySelector('.markdown-embed-link');
        if (linkText && linkEl) {
            if (checkIsPreviewElOnScreen(previewViewEl, linkEl)) {
                return;
            }
            let offsetParent = linkEl.offsetParent;
            let top = linkEl.offsetTop;
            let left = linkEl.offsetLeft;
            while (offsetParent) {
                if (offsetParent == previewViewEl) {
                    offsetParent = undefined;
                }
                else {
                    top += offsetParent.offsetTop;
                    left += offsetParent.offsetLeft;
                    offsetParent = offsetParent.offsetParent;
                }
            }
            linkHints.push({
                linkElement: linkEl,
                letter: '',
                linkText: linkText,
                type: 'internal',
                top: top,
                left: left,
            });
        }
    });
    const sortedLinkHints = linkHints.sort((a, b) => {
        if (a.top > b.top) {
            return 1;
        }
        else if (a.top === b.top) {
            if (a.left > b.left) {
                return 1;
            }
            else if (a.left === b.left) {
                return 0;
            }
            else {
                return -1;
            }
        }
        else {
            return -1;
        }
    });
    const linkHintLetters = getLinkHintLetters(letters, sortedLinkHints.length);
    sortedLinkHints.forEach((linkHint, i) => {
        linkHint.letter = linkHintLetters[i];
    });
    return sortedLinkHints;
}
function checkIsPreviewElOnScreen(parent, el) {
    return el.offsetTop < parent.scrollTop || el.offsetTop > parent.scrollTop + parent.offsetHeight;
}
function displayPreviewPopovers(linkHints) {
    const linkHintHtmlElements = [];
    for (let linkHint of linkHints) {
        const popoverElement = linkHint.linkElement.createEl('span');
        linkHint.linkElement.style.position = 'relative';
        popoverElement.style.top = '0px';
        popoverElement.style.left = '0px';
        popoverElement.textContent = linkHint.letter;
        popoverElement.classList.add('jl');
        popoverElement.classList.add('jl-' + linkHint.type);
        popoverElement.classList.add('popover');
        linkHintHtmlElements.push(popoverElement);
    }
    return linkHintHtmlElements;
}

class PreviewLinkProcessor {
    constructor(view, alphabet) {
        this.view = view;
        this.alphabet = alphabet;
    }
    init() {
        const { view, alphabet } = this;
        const links = getPreviewLinkHints(view, alphabet);
        displayPreviewPopovers(links);
        return links;
    }
}

class LivePreviewLinkProcessor {
    constructor(view, editor, alphabet) {
        this.getSourceLinkHints = () => {
            const { alphabet } = this;
            const { index, content } = this.getVisibleLines();
            return getMDHintLinks(content, index, alphabet);
        };
        this.view = view;
        this.cmEditor = editor;
        this.alphabet = alphabet;
    }
    init() {
        const { view, alphabet } = this;
        const links = getPreviewLinkHints(view, alphabet);
        const sourceLinks = this.getSourceLinkHints();
        const linkHintLetters = getLinkHintLetters(alphabet, links.length + sourceLinks.length);
        const linksRemapped = links.map((link, idx) => (Object.assign(Object.assign({}, link), { letter: linkHintLetters[idx] }))).filter(link => link.letter);
        const sourceLinksRemapped = sourceLinks.map((link, idx) => (Object.assign(Object.assign({}, link), { letter: linkHintLetters[idx + links.length] }))).filter(link => link.letter);
        const linkHintHtmlElements = displayPreviewPopovers(linksRemapped);
        return [linksRemapped, sourceLinksRemapped, linkHintHtmlElements];
    }
    getVisibleLines() {
        var _a, _b, _c;
        const { cmEditor } = this;
        let { from, to } = cmEditor.viewport;
        // For CM6 get real visible lines top
        // @ts-ignore
        if ((_b = (_a = cmEditor.viewState) === null || _a === void 0 ? void 0 : _a.pixelViewport) === null || _b === void 0 ? void 0 : _b.top) {
            // @ts-ignore
            const pixelOffsetTop = cmEditor.viewState.pixelViewport.top;
            // @ts-ignore
            const lines = cmEditor.viewState.viewportLines;
            // @ts-ignore
            from = (_c = lines.filter(line => line.top > pixelOffsetTop)[0]) === null || _c === void 0 ? void 0 : _c.from;
        }
        const content = cmEditor.state.sliceDoc(from, to);
        return { index: from, content };
    }
}

var VIEW_MODE;
(function (VIEW_MODE) {
    VIEW_MODE[VIEW_MODE["SOURCE"] = 0] = "SOURCE";
    VIEW_MODE[VIEW_MODE["PREVIEW"] = 1] = "PREVIEW";
    VIEW_MODE[VIEW_MODE["LEGACY"] = 2] = "LEGACY";
    VIEW_MODE[VIEW_MODE["LIVE_PREVIEW"] = 3] = "LIVE_PREVIEW";
})(VIEW_MODE || (VIEW_MODE = {}));
class JumpToLink extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.isLinkHintActive = false;
        this.prefixInfo = undefined;
        this.currentCursor = {};
        this.cursorBeforeJump = {};
        this.handleJumpToLink = () => {
            const { settings: { letters } } = this;
            const { mode, currentView } = this;
            switch (mode) {
                case VIEW_MODE.LEGACY: {
                    const cmEditor = this.cmEditor;
                    const sourceLinkHints = new LegacySourceLinkProcessor(cmEditor, letters).init();
                    this.handleActions(sourceLinkHints);
                    break;
                }
                case VIEW_MODE.LIVE_PREVIEW: {
                    const cm6Editor = this.cmEditor;
                    const previewViewEl = currentView.currentMode.editor.containerEl;
                    const [previewLinkHints, sourceLinkHints, linkHintHtmlElements] = new LivePreviewLinkProcessor(previewViewEl, cm6Editor, letters).init();
                    cm6Editor.plugin(this.markViewPlugin).setLinks(sourceLinkHints);
                    this.app.workspace.updateOptions();
                    this.handleActions([...previewLinkHints, ...sourceLinkHints], linkHintHtmlElements);
                    break;
                }
                case VIEW_MODE.PREVIEW: {
                    const previewViewEl = currentView.previewMode.containerEl.querySelector('div.markdown-preview-view');
                    const previewLinkHints = new PreviewLinkProcessor(previewViewEl, letters).init();
                    this.handleActions(previewLinkHints);
                    break;
                }
                case VIEW_MODE.SOURCE: {
                    const cm6Editor = this.cmEditor;
                    const livePreviewLinks = new CM6LinkProcessor(cm6Editor, letters).init();
                    cm6Editor.plugin(this.markViewPlugin).setLinks(livePreviewLinks);
                    this.app.workspace.updateOptions();
                    this.handleActions(livePreviewLinks);
                    break;
                }
            }
        };
        /*
        *  caseSensitive is only for lightspeed and shall not affect jumpToAnywhere, so it is true
        *  by default
        */
        this.handleJumpToRegex = (stringToSearch, caseSensitive = true) => {
            const { settings: { letters, jumpToAnywhereRegex } } = this;
            const whatToLookAt = stringToSearch || jumpToAnywhereRegex;
            const { mode } = this;
            switch (mode) {
                case VIEW_MODE.SOURCE:
                    this.handleMarkdownRegex(letters, whatToLookAt, caseSensitive);
                    break;
                case VIEW_MODE.LIVE_PREVIEW:
                    this.handleMarkdownRegex(letters, whatToLookAt, caseSensitive);
                    break;
                case VIEW_MODE.PREVIEW:
                    break;
                case VIEW_MODE.LEGACY:
                    const cmEditor = this.cmEditor;
                    const links = new LegacyRegexpProcessor(cmEditor, whatToLookAt, letters, caseSensitive).init();
                    this.handleActions(links);
                    break;
            }
        };
        this.handleMarkdownRegex = (letters, whatToLookAt, caseSensitive) => {
            const cm6Editor = this.cmEditor;
            const livePreviewLinks = new CM6RegexProcessor(cm6Editor, letters, whatToLookAt, caseSensitive).init();
            cm6Editor.plugin(this.markViewPlugin).setLinks(livePreviewLinks);
            this.app.workspace.updateOptions();
            this.handleActions(livePreviewLinks);
        };
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = (yield this.loadData()) || new Settings();
            this.addSettingTab(new SettingTab(this.app, this));
            const markViewPlugin = this.markViewPlugin = view.ViewPlugin.fromClass(MarkPlugin, {
                decorations: v => v.decorations
            });
            this.registerEditorExtension([markViewPlugin]);
            this.watchForSelectionChange();
            this.addCommand({
                id: 'activate-jump-to-link',
                name: 'Jump to Link',
                callback: this.action.bind(this, 'link'),
                hotkeys: [{ modifiers: ['Ctrl'], key: `'` }],
            });
            this.addCommand({
                id: "activate-jump-to-anywhere",
                name: "Jump to Anywhere Regex",
                callback: this.action.bind(this, 'regexp'),
                hotkeys: [{ modifiers: ["Ctrl"], key: ";" }],
            });
            this.addCommand({
                id: "activate-lightspeed-jump",
                name: "Lightspeed Jump",
                callback: this.action.bind(this, 'lightspeed'),
                hotkeys: [],
            });
        });
    }
    onunload() {
        console.log('unloading jump to links plugin');
    }
    action(type) {
        if (this.isLinkHintActive) {
            return;
        }
        const activeViewOfType = app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        const currentView = this.currentView = activeViewOfType.leaf.view;
        const mode = this.mode = this.getMode(this.currentView);
        this.contentElement = activeViewOfType.contentEl;
        this.cursorBeforeJump = this.currentCursor;
        switch (mode) {
            case VIEW_MODE.LEGACY:
                this.cmEditor = currentView.sourceMode.cmEditor;
                break;
            case VIEW_MODE.LIVE_PREVIEW:
            case VIEW_MODE.SOURCE:
                this.cmEditor = currentView.editor.cm;
                break;
        }
        switch (type) {
            case "link":
                this.handleJumpToLink();
                return;
            case "regexp":
                this.handleJumpToRegex();
                return;
            case "lightspeed":
                this.handleLightspeedJump();
                return;
        }
    }
    getMode(currentView) {
        // @ts-ignore
        const isLegacy = this.app.vault.getConfig("legacyEditor");
        if (currentView.getState().mode === 'preview') {
            return VIEW_MODE.PREVIEW;
        }
        else if (isLegacy) {
            return VIEW_MODE.LEGACY;
        }
        else if (currentView.getState().mode === 'source') {
            const isLivePreview = currentView.editor.cm.state.field(obsidian.editorLivePreviewField);
            if (isLivePreview)
                return VIEW_MODE.LIVE_PREVIEW;
            return VIEW_MODE.SOURCE;
        }
    }
    // adapted from: https://github.com/mrjackphil/obsidian-jump-to-link/issues/35#issuecomment-1085905668
    handleLightspeedJump() {
        // get all text color
        const { contentEl } = app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (!contentEl) {
            return;
        }
        // this element doesn't exist in cm5/has a different class, so lightspeed will not work in cm5
        const contentContainerColor = contentEl.getElementsByClassName("cm-contentContainer");
        const originalColor = contentContainerColor[0].style.color;
        // change all text color to gray
        contentContainerColor[0].style.color = 'var(--jump-to-link-lightspeed-color)';
        const keyArray = [];
        const grabKey = (event) => {
            event.preventDefault();
            // handle Escape to reject the mode
            if (event.key === 'Escape') {
                contentEl.removeEventListener("keydown", grabKey, { capture: true });
                contentContainerColor[0].style.color = originalColor;
            }
            // test if keypress is capitalized
            if (/^[\w\S\W]$/i.test(event.key)) {
                const isCapital = event.shiftKey;
                if (isCapital) {
                    // capture uppercase
                    keyArray.push((event.key).toUpperCase());
                }
                else {
                    // capture lowercase
                    keyArray.push(event.key);
                }
            }
            // stop when length of array is equal to 2
            if (keyArray.length === 2) {
                const stringToSearch = this.settings.lightspeedJumpToStartOfWord ? "\\b" + keyArray.join("") : keyArray.join("");
                this.handleJumpToRegex(stringToSearch, this.settings.lightspeedCaseSensitive);
                // removing eventListener after proceeded
                contentEl.removeEventListener("keydown", grabKey, { capture: true });
                contentContainerColor[0].style.color = originalColor;
            }
        };
        contentEl.addEventListener('keydown', grabKey, { capture: true });
    }
    handleHotkey(heldShiftKey, link) {
        if (link.type === 'internal') {
            const file = this.app.workspace.getActiveFile();
            if (file) {
                // the second argument is for the link resolution
                this.app.workspace.openLinkText(decodeURI(link.linkText), file.path, heldShiftKey, { active: true });
            }
        }
        else if (link.type === 'external') {
            window.open(link.linkText);
        }
        else {
            const editor = this.cmEditor;
            if (editor instanceof view.EditorView) {
                const index = link.index;
                const { vimMode, anchor } = this.cursorBeforeJump;
                const useSelection = heldShiftKey || (vimMode === 'visual' || vimMode === 'visual block');
                if (useSelection && anchor !== undefined) {
                    editor.dispatch({ selection: state.EditorSelection.range(anchor, index) });
                }
                else {
                    editor.dispatch({ selection: state.EditorSelection.cursor(index) });
                }
            }
            else {
                editor.setCursor(editor.posFromIndex(link.index));
            }
        }
    }
    removePopovers(linkHintHtmlElements = []) {
        const currentView = this.contentElement;
        currentView.removeEventListener('click', () => this.removePopovers(linkHintHtmlElements));
        linkHintHtmlElements === null || linkHintHtmlElements === void 0 ? void 0 : linkHintHtmlElements.forEach(e => e.remove());
        currentView.querySelectorAll('.jl.popover').forEach(e => e.remove());
        this.prefixInfo = undefined;
        if (this.mode == VIEW_MODE.SOURCE || this.mode == VIEW_MODE.LIVE_PREVIEW) {
            this.cmEditor.plugin(this.markViewPlugin).clean();
        }
        this.app.workspace.updateOptions();
        this.isLinkHintActive = false;
    }
    removePopoversWithoutPrefixEventKey(eventKey, linkHintHtmlElements = []) {
        const currentView = this.contentElement;
        linkHintHtmlElements === null || linkHintHtmlElements === void 0 ? void 0 : linkHintHtmlElements.forEach(e => {
            if (e.innerHTML.length == 2 && e.innerHTML[0] == eventKey) {
                e.classList.add("matched");
                return;
            }
            e.remove();
        });
        currentView.querySelectorAll('.jl.popover').forEach(e => {
            if (e.innerHTML.length == 2 && e.innerHTML[0] == eventKey) {
                e.classList.add("matched");
                return;
            }
            e.remove();
        });
        if (this.mode == VIEW_MODE.SOURCE || this.mode == VIEW_MODE.LIVE_PREVIEW) {
            this.cmEditor.plugin(this.markViewPlugin).filterWithEventKey(eventKey);
        }
        this.app.workspace.updateOptions();
    }
    handleActions(linkHints, linkHintHtmlElements) {
        var _a;
        const contentElement = this.contentElement;
        if (!linkHints.length) {
            return;
        }
        const linkHintMap = {};
        linkHints.forEach(x => linkHintMap[x.letter] = x);
        const handleKeyDown = (event) => {
            var _a;
            if (['Shift', 'Control', 'CapsLock', 'ScrollLock', 'GroupNext', 'Meta'].includes(event.key)) {
                return;
            }
            const eventKey = event.key.toUpperCase();
            const prefixes = new Set(Object.keys(linkHintMap).filter(x => x.length > 1).map(x => x[0]));
            let linkHint;
            if (this.prefixInfo) {
                linkHint = linkHintMap[this.prefixInfo.prefix + eventKey];
            }
            else {
                linkHint = linkHintMap[eventKey];
                if (!linkHint && prefixes && prefixes.has(eventKey)) {
                    this.prefixInfo = { prefix: eventKey, shiftKey: event.shiftKey };
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    this.removePopoversWithoutPrefixEventKey(eventKey, linkHintHtmlElements);
                    return;
                }
            }
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            const heldShiftKey = ((_a = this.prefixInfo) === null || _a === void 0 ? void 0 : _a.shiftKey) || event.shiftKey;
            linkHint && this.handleHotkey(heldShiftKey, linkHint);
            this.removePopovers(linkHintHtmlElements);
            contentElement.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
        if (linkHints.length === 1 && this.settings.jumpToLinkIfOneLinkOnly) {
            const heldShiftKey = (_a = this.prefixInfo) === null || _a === void 0 ? void 0 : _a.shiftKey;
            this.handleHotkey(heldShiftKey, linkHints[0]);
            this.removePopovers(linkHintHtmlElements);
            return;
        }
        contentElement.addEventListener('click', () => this.removePopovers(linkHintHtmlElements));
        contentElement.addEventListener('keydown', handleKeyDown, { capture: true });
        this.isLinkHintActive = true;
    }
    /**
     * CodeMirror's vim automatically exits visual mode when executing a command.
     * This keeps track of selection changes so we can restore the selection.
     *
     * This is the same approach taken by the obsidian-vimrc-plugin
     */
    watchForSelectionChange() {
        const updateSelection = this.updateSelection.bind(this);
        const watchForChanges = () => {
            var _a, _b;
            const editor = (_a = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView)) === null || _a === void 0 ? void 0 : _a.editor;
            const cm = (_b = editor === null || editor === void 0 ? void 0 : editor.cm) === null || _b === void 0 ? void 0 : _b.cm;
            if (cm && !cm._handlers.cursorActivity.includes(updateSelection)) {
                cm.on("cursorActivity", updateSelection);
                this.register(() => cm.off("cursorActivity", updateSelection));
            }
        };
        this.registerEvent(this.app.workspace.on("active-leaf-change", watchForChanges));
        this.registerEvent(this.app.workspace.on("file-open", watchForChanges));
        watchForChanges();
    }
    updateSelection(editor) {
        var _a, _b;
        const anchor = (_a = editor.listSelections()[0]) === null || _a === void 0 ? void 0 : _a.anchor;
        this.currentCursor = {
            anchor: anchor ? editor.indexFromPos(anchor) : undefined,
            vimMode: (_b = editor.state.vim) === null || _b === void 0 ? void 0 : _b.mode
        };
    }
}
class SettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Settings for Jump To Link.' });
        new obsidian.Setting(containerEl)
            .setName('Characters used for link hints')
            .setDesc('The characters placed next to each link after enter link-hint mode.')
            .addText(cb => {
            cb.setValue(this.plugin.settings.letters)
                .onChange((value) => {
                this.plugin.settings.letters = value;
                this.plugin.saveData(this.plugin.settings);
            });
        });
        new obsidian.Setting(containerEl)
            .setName('Jump To Anywhere')
            .setDesc("Regex based navigating in editor mode")
            .addText((text) => text
            .setPlaceholder('Custom Regex')
            .setValue(this.plugin.settings.jumpToAnywhereRegex)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.jumpToAnywhereRegex = value;
            yield this.plugin.saveData(this.plugin.settings);
        })));
        new obsidian.Setting(containerEl)
            .setName('Lightspeed regex case sensitivity')
            .setDesc('If enabled, the regex for matching will be case sensitive.')
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.lightspeedCaseSensitive)
                .onChange((state) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.lightspeedCaseSensitive = state;
                yield this.plugin.saveData(this.plugin.settings);
            }));
        });
        new obsidian.Setting(containerEl)
            .setName('Jump to Link If Only One Link In Page')
            .setDesc('If enabled, auto jump to link if there is only one link in page')
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.jumpToLinkIfOneLinkOnly)
                .onChange((state) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.jumpToLinkIfOneLinkOnly = state;
                yield this.plugin.saveData(this.plugin.settings);
            }));
        });
        new obsidian.Setting(containerEl)
            .setName('Lightspeed only jumps to start of words')
            .setDesc('If enabled, lightspeed jumps will only target characters occuring at the start of words.')
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.lightspeedJumpToStartOfWord)
                .onChange((state) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.lightspeedJumpToStartOfWord = state;
                yield this.plugin.saveData(this.plugin.settings);
            }));
        });
    }
}

module.exports = JumpToLink;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInR5cGVzLnRzIiwic3JjL2NtNi13aWRnZXQvTWFya1dpZGdldC50cyIsInNyYy9jbTYtd2lkZ2V0L01hcmtQbHVnaW4udHMiLCJzcmMvdXRpbHMvY29tbW9uLnRzIiwic3JjL3Byb2Nlc3NvcnMvQ002TGlua1Byb2Nlc3Nvci50cyIsInNyYy91dGlscy9yZWdleHAudHMiLCJzcmMvcHJvY2Vzc29ycy9DTTZSZWdleFByb2Nlc3Nvci50cyIsInNyYy9wcm9jZXNzb3JzL0xlZ2FjeVJlZ2V4cFByb2Nlc3Nvci50cyIsInNyYy9wcm9jZXNzb3JzL0xlZ2FjeVNvdXJjZUxpbmtQcm9jZXNzb3IudHMiLCJzcmMvdXRpbHMvcHJldmlldy50cyIsInNyYy9wcm9jZXNzb3JzL1ByZXZpZXdMaW5rUHJvY2Vzc29yLnRzIiwic3JjL3Byb2Nlc3NvcnMvTGl2ZVByZXZpZXdMaW5rUHJvY2Vzc29yLnRzIiwic3JjL21haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cclxuXHJcblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxyXG5wdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuXHJcblxyXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXHJcblJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxyXG5BTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXHJcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxyXG5MT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxyXG5PVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXHJcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbi8qIGdsb2JhbCBSZWZsZWN0LCBQcm9taXNlLCBTdXBwcmVzc2VkRXJyb3IsIFN5bWJvbCAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19lc0RlY29yYXRlKGN0b3IsIGRlc2NyaXB0b3JJbiwgZGVjb3JhdG9ycywgY29udGV4dEluLCBpbml0aWFsaXplcnMsIGV4dHJhSW5pdGlhbGl6ZXJzKSB7XHJcbiAgICBmdW5jdGlvbiBhY2NlcHQoZikgeyBpZiAoZiAhPT0gdm9pZCAwICYmIHR5cGVvZiBmICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbiBleHBlY3RlZFwiKTsgcmV0dXJuIGY7IH1cclxuICAgIHZhciBraW5kID0gY29udGV4dEluLmtpbmQsIGtleSA9IGtpbmQgPT09IFwiZ2V0dGVyXCIgPyBcImdldFwiIDoga2luZCA9PT0gXCJzZXR0ZXJcIiA/IFwic2V0XCIgOiBcInZhbHVlXCI7XHJcbiAgICB2YXIgdGFyZ2V0ID0gIWRlc2NyaXB0b3JJbiAmJiBjdG9yID8gY29udGV4dEluW1wic3RhdGljXCJdID8gY3RvciA6IGN0b3IucHJvdG90eXBlIDogbnVsbDtcclxuICAgIHZhciBkZXNjcmlwdG9yID0gZGVzY3JpcHRvckluIHx8ICh0YXJnZXQgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgY29udGV4dEluLm5hbWUpIDoge30pO1xyXG4gICAgdmFyIF8sIGRvbmUgPSBmYWxzZTtcclxuICAgIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgdmFyIGNvbnRleHQgPSB7fTtcclxuICAgICAgICBmb3IgKHZhciBwIGluIGNvbnRleHRJbikgY29udGV4dFtwXSA9IHAgPT09IFwiYWNjZXNzXCIgPyB7fSA6IGNvbnRleHRJbltwXTtcclxuICAgICAgICBmb3IgKHZhciBwIGluIGNvbnRleHRJbi5hY2Nlc3MpIGNvbnRleHQuYWNjZXNzW3BdID0gY29udGV4dEluLmFjY2Vzc1twXTtcclxuICAgICAgICBjb250ZXh0LmFkZEluaXRpYWxpemVyID0gZnVuY3Rpb24gKGYpIHsgaWYgKGRvbmUpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgYWRkIGluaXRpYWxpemVycyBhZnRlciBkZWNvcmF0aW9uIGhhcyBjb21wbGV0ZWRcIik7IGV4dHJhSW5pdGlhbGl6ZXJzLnB1c2goYWNjZXB0KGYgfHwgbnVsbCkpOyB9O1xyXG4gICAgICAgIHZhciByZXN1bHQgPSAoMCwgZGVjb3JhdG9yc1tpXSkoa2luZCA9PT0gXCJhY2Nlc3NvclwiID8geyBnZXQ6IGRlc2NyaXB0b3IuZ2V0LCBzZXQ6IGRlc2NyaXB0b3Iuc2V0IH0gOiBkZXNjcmlwdG9yW2tleV0sIGNvbnRleHQpO1xyXG4gICAgICAgIGlmIChraW5kID09PSBcImFjY2Vzc29yXCIpIHtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gdm9pZCAwKSBjb250aW51ZTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gbnVsbCB8fCB0eXBlb2YgcmVzdWx0ICE9PSBcIm9iamVjdFwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0IGV4cGVjdGVkXCIpO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuZ2V0KSkgZGVzY3JpcHRvci5nZXQgPSBfO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuc2V0KSkgZGVzY3JpcHRvci5zZXQgPSBfO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuaW5pdCkpIGluaXRpYWxpemVycy51bnNoaWZ0KF8pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChfID0gYWNjZXB0KHJlc3VsdCkpIHtcclxuICAgICAgICAgICAgaWYgKGtpbmQgPT09IFwiZmllbGRcIikgaW5pdGlhbGl6ZXJzLnVuc2hpZnQoXyk7XHJcbiAgICAgICAgICAgIGVsc2UgZGVzY3JpcHRvcltrZXldID0gXztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGFyZ2V0KSBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBjb250ZXh0SW4ubmFtZSwgZGVzY3JpcHRvcik7XHJcbiAgICBkb25lID0gdHJ1ZTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3J1bkluaXRpYWxpemVycyh0aGlzQXJnLCBpbml0aWFsaXplcnMsIHZhbHVlKSB7XHJcbiAgICB2YXIgdXNlVmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5pdGlhbGl6ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFsdWUgPSB1c2VWYWx1ZSA/IGluaXRpYWxpemVyc1tpXS5jYWxsKHRoaXNBcmcsIHZhbHVlKSA6IGluaXRpYWxpemVyc1tpXS5jYWxsKHRoaXNBcmcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVzZVZhbHVlID8gdmFsdWUgOiB2b2lkIDA7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wcm9wS2V5KHgpIHtcclxuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gXCJzeW1ib2xcIiA/IHggOiBcIlwiLmNvbmNhdCh4KTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NldEZ1bmN0aW9uTmFtZShmLCBuYW1lLCBwcmVmaXgpIHtcclxuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gXCJzeW1ib2xcIikgbmFtZSA9IG5hbWUuZGVzY3JpcHRpb24gPyBcIltcIi5jb25jYXQobmFtZS5kZXNjcmlwdGlvbiwgXCJdXCIpIDogXCJcIjtcclxuICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkoZiwgXCJuYW1lXCIsIHsgY29uZmlndXJhYmxlOiB0cnVlLCB2YWx1ZTogcHJlZml4ID8gXCJcIi5jb25jYXQocHJlZml4LCBcIiBcIiwgbmFtZSkgOiBuYW1lIH0pO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkge1xyXG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcclxuICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XHJcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xyXG4gICAgICAgIHdoaWxlIChnICYmIChnID0gMCwgb3BbMF0gJiYgKF8gPSAwKSksIF8pIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcclxuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cclxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2NyZWF0ZUJpbmRpbmcgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG0sIGspO1xyXG4gICAgaWYgKCFkZXNjIHx8IChcImdldFwiIGluIGRlc2MgPyAhbS5fX2VzTW9kdWxlIDogZGVzYy53cml0YWJsZSB8fCBkZXNjLmNvbmZpZ3VyYWJsZSkpIHtcclxuICAgICAgICBkZXNjID0geyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9O1xyXG4gICAgfVxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCBkZXNjKTtcclxufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBvW2syXSA9IG1ba107XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXhwb3J0U3RhcihtLCBvKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIHApKSBfX2NyZWF0ZUJpbmRpbmcobywgbSwgcCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3ZhbHVlcyhvKSB7XHJcbiAgICB2YXIgcyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBTeW1ib2wuaXRlcmF0b3IsIG0gPSBzICYmIG9bc10sIGkgPSAwO1xyXG4gICAgaWYgKG0pIHJldHVybiBtLmNhbGwobyk7XHJcbiAgICBpZiAobyAmJiB0eXBlb2Ygby5sZW5ndGggPT09IFwibnVtYmVyXCIpIHJldHVybiB7XHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAobyAmJiBpID49IG8ubGVuZ3RoKSBvID0gdm9pZCAwO1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IocyA/IFwiT2JqZWN0IGlzIG5vdCBpdGVyYWJsZS5cIiA6IFwiU3ltYm9sLml0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XHJcbiAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICBpZiAoIW0pIHJldHVybiBvO1xyXG4gICAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbi8qKiBAZGVwcmVjYXRlZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWQoKSB7XHJcbiAgICBmb3IgKHZhciBhciA9IFtdLCBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKylcclxuICAgICAgICBhciA9IGFyLmNvbmNhdChfX3JlYWQoYXJndW1lbnRzW2ldKSk7XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbi8qKiBAZGVwcmVjYXRlZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheXMoKSB7XHJcbiAgICBmb3IgKHZhciBzID0gMCwgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHMgKz0gYXJndW1lbnRzW2ldLmxlbmd0aDtcclxuICAgIGZvciAodmFyIHIgPSBBcnJheShzKSwgayA9IDAsIGkgPSAwOyBpIDwgaWw7IGkrKylcclxuICAgICAgICBmb3IgKHZhciBhID0gYXJndW1lbnRzW2ldLCBqID0gMCwgamwgPSBhLmxlbmd0aDsgaiA8IGpsOyBqKyssIGsrKylcclxuICAgICAgICAgICAgcltrXSA9IGFbal07XHJcbiAgICByZXR1cm4gcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXkodG8sIGZyb20sIHBhY2spIHtcclxuICAgIGlmIChwYWNrIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIGZvciAodmFyIGkgPSAwLCBsID0gZnJvbS5sZW5ndGgsIGFyOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGFyIHx8ICEoaSBpbiBmcm9tKSkge1xyXG4gICAgICAgICAgICBpZiAoIWFyKSBhciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20sIDAsIGkpO1xyXG4gICAgICAgICAgICBhcltpXSA9IGZyb21baV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRvLmNvbmNhdChhciB8fCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0KHYpIHtcclxuICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgX19hd2FpdCA/ICh0aGlzLnYgPSB2LCB0aGlzKSA6IG5ldyBfX2F3YWl0KHYpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0dlbmVyYXRvcih0aGlzQXJnLCBfYXJndW1lbnRzLCBnZW5lcmF0b3IpIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgZyA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSwgaSwgcSA9IFtdO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiKSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlmIChnW25dKSBpW25dID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChhLCBiKSB7IHEucHVzaChbbiwgdiwgYSwgYl0pID4gMSB8fCByZXN1bWUobiwgdik7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiByZXN1bWUobiwgdikgeyB0cnkgeyBzdGVwKGdbbl0odikpOyB9IGNhdGNoIChlKSB7IHNldHRsZShxWzBdWzNdLCBlKTsgfSB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKHIpIHsgci52YWx1ZSBpbnN0YW5jZW9mIF9fYXdhaXQgPyBQcm9taXNlLnJlc29sdmUoci52YWx1ZS52KS50aGVuKGZ1bGZpbGwsIHJlamVjdCkgOiBzZXR0bGUocVswXVsyXSwgcik7IH1cclxuICAgIGZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHsgcmVzdW1lKFwibmV4dFwiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHJlamVjdCh2YWx1ZSkgeyByZXN1bWUoXCJ0aHJvd1wiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShmLCB2KSB7IGlmIChmKHYpLCBxLnNoaWZ0KCksIHEubGVuZ3RoKSByZXN1bWUocVswXVswXSwgcVswXVsxXSk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNEZWxlZ2F0b3Iobykge1xyXG4gICAgdmFyIGksIHA7XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIsIGZ1bmN0aW9uIChlKSB7IHRocm93IGU7IH0pLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlbbl0gPSBvW25dID8gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIChwID0gIXApID8geyB2YWx1ZTogX19hd2FpdChvW25dKHYpKSwgZG9uZTogZmFsc2UgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkSW4oc3RhdGUsIHJlY2VpdmVyKSB7XHJcbiAgICBpZiAocmVjZWl2ZXIgPT09IG51bGwgfHwgKHR5cGVvZiByZWNlaXZlciAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcmVjZWl2ZXIgIT09IFwiZnVuY3Rpb25cIikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgdXNlICdpbicgb3BlcmF0b3Igb24gbm9uLW9iamVjdFwiKTtcclxuICAgIHJldHVybiB0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyID09PSBzdGF0ZSA6IHN0YXRlLmhhcyhyZWNlaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FkZERpc3Bvc2FibGVSZXNvdXJjZShlbnYsIHZhbHVlLCBhc3luYykge1xyXG4gICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB2b2lkIDApIHtcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiB2YWx1ZSAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0IGV4cGVjdGVkLlwiKTtcclxuICAgICAgICB2YXIgZGlzcG9zZTtcclxuICAgICAgICBpZiAoYXN5bmMpIHtcclxuICAgICAgICAgICAgaWYgKCFTeW1ib2wuYXN5bmNEaXNwb3NlKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jRGlzcG9zZSBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICAgICAgICAgIGRpc3Bvc2UgPSB2YWx1ZVtTeW1ib2wuYXN5bmNEaXNwb3NlXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRpc3Bvc2UgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICBpZiAoIVN5bWJvbC5kaXNwb3NlKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmRpc3Bvc2UgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgICAgICAgICBkaXNwb3NlID0gdmFsdWVbU3ltYm9sLmRpc3Bvc2VdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIGRpc3Bvc2UgIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdCBub3QgZGlzcG9zYWJsZS5cIik7XHJcbiAgICAgICAgZW52LnN0YWNrLnB1c2goeyB2YWx1ZTogdmFsdWUsIGRpc3Bvc2U6IGRpc3Bvc2UsIGFzeW5jOiBhc3luYyB9KTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGFzeW5jKSB7XHJcbiAgICAgICAgZW52LnN0YWNrLnB1c2goeyBhc3luYzogdHJ1ZSB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxufVxyXG5cclxudmFyIF9TdXBwcmVzc2VkRXJyb3IgPSB0eXBlb2YgU3VwcHJlc3NlZEVycm9yID09PSBcImZ1bmN0aW9uXCIgPyBTdXBwcmVzc2VkRXJyb3IgOiBmdW5jdGlvbiAoZXJyb3IsIHN1cHByZXNzZWQsIG1lc3NhZ2UpIHtcclxuICAgIHZhciBlID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIGUubmFtZSA9IFwiU3VwcHJlc3NlZEVycm9yXCIsIGUuZXJyb3IgPSBlcnJvciwgZS5zdXBwcmVzc2VkID0gc3VwcHJlc3NlZCwgZTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2Rpc3Bvc2VSZXNvdXJjZXMoZW52KSB7XHJcbiAgICBmdW5jdGlvbiBmYWlsKGUpIHtcclxuICAgICAgICBlbnYuZXJyb3IgPSBlbnYuaGFzRXJyb3IgPyBuZXcgX1N1cHByZXNzZWRFcnJvcihlLCBlbnYuZXJyb3IsIFwiQW4gZXJyb3Igd2FzIHN1cHByZXNzZWQgZHVyaW5nIGRpc3Bvc2FsLlwiKSA6IGU7XHJcbiAgICAgICAgZW52Lmhhc0Vycm9yID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIG5leHQoKSB7XHJcbiAgICAgICAgd2hpbGUgKGVudi5zdGFjay5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIHJlYyA9IGVudi5zdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSByZWMuZGlzcG9zZSAmJiByZWMuZGlzcG9zZS5jYWxsKHJlYy52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVjLmFzeW5jKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCkudGhlbihuZXh0LCBmdW5jdGlvbihlKSB7IGZhaWwoZSk7IHJldHVybiBuZXh0KCk7IH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBmYWlsKGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChlbnYuaGFzRXJyb3IpIHRocm93IGVudi5lcnJvcjtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXh0KCk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHtcclxuICAgIF9fZXh0ZW5kczogX19leHRlbmRzLFxyXG4gICAgX19hc3NpZ246IF9fYXNzaWduLFxyXG4gICAgX19yZXN0OiBfX3Jlc3QsXHJcbiAgICBfX2RlY29yYXRlOiBfX2RlY29yYXRlLFxyXG4gICAgX19wYXJhbTogX19wYXJhbSxcclxuICAgIF9fbWV0YWRhdGE6IF9fbWV0YWRhdGEsXHJcbiAgICBfX2F3YWl0ZXI6IF9fYXdhaXRlcixcclxuICAgIF9fZ2VuZXJhdG9yOiBfX2dlbmVyYXRvcixcclxuICAgIF9fY3JlYXRlQmluZGluZzogX19jcmVhdGVCaW5kaW5nLFxyXG4gICAgX19leHBvcnRTdGFyOiBfX2V4cG9ydFN0YXIsXHJcbiAgICBfX3ZhbHVlczogX192YWx1ZXMsXHJcbiAgICBfX3JlYWQ6IF9fcmVhZCxcclxuICAgIF9fc3ByZWFkOiBfX3NwcmVhZCxcclxuICAgIF9fc3ByZWFkQXJyYXlzOiBfX3NwcmVhZEFycmF5cyxcclxuICAgIF9fc3ByZWFkQXJyYXk6IF9fc3ByZWFkQXJyYXksXHJcbiAgICBfX2F3YWl0OiBfX2F3YWl0LFxyXG4gICAgX19hc3luY0dlbmVyYXRvcjogX19hc3luY0dlbmVyYXRvcixcclxuICAgIF9fYXN5bmNEZWxlZ2F0b3I6IF9fYXN5bmNEZWxlZ2F0b3IsXHJcbiAgICBfX2FzeW5jVmFsdWVzOiBfX2FzeW5jVmFsdWVzLFxyXG4gICAgX19tYWtlVGVtcGxhdGVPYmplY3Q6IF9fbWFrZVRlbXBsYXRlT2JqZWN0LFxyXG4gICAgX19pbXBvcnRTdGFyOiBfX2ltcG9ydFN0YXIsXHJcbiAgICBfX2ltcG9ydERlZmF1bHQ6IF9faW1wb3J0RGVmYXVsdCxcclxuICAgIF9fY2xhc3NQcml2YXRlRmllbGRHZXQ6IF9fY2xhc3NQcml2YXRlRmllbGRHZXQsXHJcbiAgICBfX2NsYXNzUHJpdmF0ZUZpZWxkU2V0OiBfX2NsYXNzUHJpdmF0ZUZpZWxkU2V0LFxyXG4gICAgX19jbGFzc1ByaXZhdGVGaWVsZEluOiBfX2NsYXNzUHJpdmF0ZUZpZWxkSW4sXHJcbiAgICBfX2FkZERpc3Bvc2FibGVSZXNvdXJjZTogX19hZGREaXNwb3NhYmxlUmVzb3VyY2UsXHJcbiAgICBfX2Rpc3Bvc2VSZXNvdXJjZXM6IF9fZGlzcG9zZVJlc291cmNlcyxcclxufTtcclxuIiwiZXhwb3J0IHR5cGUgTGlua0hpbnRUeXBlID0gJ2ludGVybmFsJyB8ICdleHRlcm5hbCcgfCAncmVnZXgnO1xuXG5leHBvcnQgaW50ZXJmYWNlIExpbmtIaW50QmFzZSB7XG5cdGxldHRlcjogc3RyaW5nO1xuXHR0eXBlOiBMaW5rSGludFR5cGU7XG5cdGxpbmtUZXh0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJldmlld0xpbmtIaW50IGV4dGVuZHMgTGlua0hpbnRCYXNlIHtcblx0bGlua0VsZW1lbnQ6IEhUTUxFbGVtZW50XG5cdGxlZnQ6IG51bWJlcjtcblx0dG9wOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU291cmNlTGlua0hpbnQgZXh0ZW5kcyBMaW5rSGludEJhc2Uge1xuXHRpbmRleDogbnVtYmVyXG59XG5cbmV4cG9ydCBjbGFzcyBTZXR0aW5ncyB7XG5cdC8vIERlZmF1bHRzIGFzIGluIFZpbWl1bSBleHRlbnNpb24gZm9yIGJyb3dzZXJzXG5cdGxldHRlcnM6IHN0cmluZyA9ICdzYWRmamtsZXdjbXBnaCc7XG5cdGp1bXBUb0FueXdoZXJlUmVnZXg6IHN0cmluZyA9ICdcXFxcYlxcXFx3ezMsfVxcXFxiJztcblx0bGlnaHRzcGVlZENhc2VTZW5zaXRpdmU6IGJvb2xlYW4gPSBmYWxzZTtcblx0anVtcFRvTGlua0lmT25lTGlua09ubHk6IGJvb2xlYW4gPSB0cnVlO1xuXHRsaWdodHNwZWVkSnVtcFRvU3RhcnRPZldvcmQ6IGJvb2xlYW4gPSB0cnVlO1xufVxuXG5leHBvcnQgY2xhc3MgUHJvY2Vzc29yIHtcblx0bGV0dGVyczogc3RyaW5nO1xuXG5cdHB1YmxpYyBpbml0OiAoKSA9PiBMaW5rSGludEJhc2VbXTtcbn1cbiIsImltcG9ydCB7V2lkZ2V0VHlwZX0gZnJvbSBcIkBjb2RlbWlycm9yL3ZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIE1hcmtXaWRnZXQgZXh0ZW5kcyBXaWRnZXRUeXBlIHtcbiAgICBjb25zdHJ1Y3RvcihyZWFkb25seSBtYXJrOiBzdHJpbmcsIHJlYWRvbmx5IHR5cGU6IHN0cmluZywgcmVhZG9ubHkgbWF0Y2hlZEV2ZW50S2V5OiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBlcShvdGhlcjogTWFya1dpZGdldCkge1xuICAgICAgICByZXR1cm4gb3RoZXIubWFyayA9PT0gdGhpcy5tYXJrICYmIG90aGVyLm1hdGNoZWRFdmVudEtleSA9PSB0aGlzLm1hdGNoZWRFdmVudEtleTtcbiAgICB9XG5cbiAgICB0b0RPTSgpIHtcbiAgICAgICAgY29uc3QgbWFyayA9IGFjdGl2ZURvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBtYXJrLmlubmVyVGV4dCA9IHRoaXMubWFyaztcblxuICAgICAgICBjb25zdCB3cmFwcGVyID0gYWN0aXZlRG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgd3JhcHBlci5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIjtcbiAgICAgICAgd3JhcHBlci5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgd3JhcHBlci5jbGFzc0xpc3QuYWRkKCdqbCcpO1xuICAgICAgICB3cmFwcGVyLmNsYXNzTGlzdC5hZGQoJ2psLScgKyB0aGlzLnR5cGUpO1xuICAgICAgICB3cmFwcGVyLmNsYXNzTGlzdC5hZGQoJ3BvcG92ZXInKTtcbiAgICAgICAgaWYgKHRoaXMubWF0Y2hlZEV2ZW50S2V5ICYmIHRoaXMubWFyay50b1VwcGVyQ2FzZSgpLnN0YXJ0c1dpdGgodGhpcy5tYXRjaGVkRXZlbnRLZXkudG9VcHBlckNhc2UoKSkpIHtcbiAgICAgICAgICAgIHdyYXBwZXIuY2xhc3NMaXN0LmFkZCgnbWF0Y2hlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHdyYXBwZXIuYXBwZW5kKG1hcmspO1xuXG4gICAgICAgIHJldHVybiB3cmFwcGVyO1xuICAgIH1cblxuICAgIGlnbm9yZUV2ZW50KCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtcbiAgICBEZWNvcmF0aW9uLFxuICAgIERlY29yYXRpb25TZXQsXG4gICAgRWRpdG9yVmlldyxcbiAgICBWaWV3VXBkYXRlLFxufSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuaW1wb3J0IHsgTWFya1dpZGdldCB9IGZyb20gXCIuL01hcmtXaWRnZXRcIjtcbmltcG9ydCB7U291cmNlTGlua0hpbnR9IGZyb20gXCIuLi8uLi90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgTWFya1BsdWdpbiB7XG4gICAgZGVjb3JhdGlvbnM6IERlY29yYXRpb25TZXQ7XG4gICAgbGlua3M6IFNvdXJjZUxpbmtIaW50W10gPSBbXTtcbiAgICBtYXRjaGVkRXZlbnRLZXk6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0cnVjdG9yKF92aWV3OiBFZGl0b3JWaWV3KSB7XG4gICAgICAgIHRoaXMubGlua3MgPSBbXTtcbiAgICAgICAgdGhpcy5tYXRjaGVkRXZlbnRLZXkgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuZGVjb3JhdGlvbnMgPSBEZWNvcmF0aW9uLm5vbmVcbiAgICB9XG5cbiAgICBzZXRMaW5rcyhsaW5rczogU291cmNlTGlua0hpbnRbXSkge1xuICAgICAgICB0aGlzLmxpbmtzID0gbGlua3M7XG4gICAgICAgIHRoaXMubWF0Y2hlZEV2ZW50S2V5ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNsZWFuKCkge1xuICAgICAgICB0aGlzLmxpbmtzID0gW107XG4gICAgICAgIHRoaXMubWF0Y2hlZEV2ZW50S2V5ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGZpbHRlcldpdGhFdmVudEtleShldmVudEtleTogc3RyaW5nKSB7XG4gICAgICAgIGlmIChldmVudEtleS5sZW5ndGggIT0gMSkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMubGlua3MgPSB0aGlzLmxpbmtzLmZpbHRlcih2ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB2LmxldHRlci5sZW5ndGggPT0gMiAmJiB2LmxldHRlclswXS50b1VwcGVyQ2FzZSgpID09IGV2ZW50S2V5LnRvVXBwZXJDYXNlKClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5tYXRjaGVkRXZlbnRLZXkgPSBldmVudEtleTtcbiAgICB9XG5cbiAgICBnZXQgdmlzaWJsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlua3MubGVuZ3RoID4gMDtcbiAgICB9XG5cbiAgICB1cGRhdGUoX3VwZGF0ZTogVmlld1VwZGF0ZSkge1xuICAgICAgICBjb25zdCB3aWRnZXRzID0gdGhpcy5saW5rcy5tYXAoKHgpID0+XG4gICAgICAgICAgICBEZWNvcmF0aW9uLndpZGdldCh7XG4gICAgICAgICAgICAgICAgd2lkZ2V0OiBuZXcgTWFya1dpZGdldCh4LmxldHRlciwgeC50eXBlLCB0aGlzLm1hdGNoZWRFdmVudEtleSksXG4gICAgICAgICAgICAgICAgc2lkZTogMSxcbiAgICAgICAgICAgIH0pLnJhbmdlKHguaW5kZXgpXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5kZWNvcmF0aW9ucyA9IERlY29yYXRpb24uc2V0KHdpZGdldHMpXG4gICAgfVxufVxuXG4iLCJpbXBvcnQge0VkaXRvcn0gZnJvbSBcImNvZGVtaXJyb3JcIjtcbmltcG9ydCB7U291cmNlTGlua0hpbnR9IGZyb20gXCIuLi8uLi90eXBlc1wiO1xuXG4vKipcbiAqIEdldCBvbmx5IHZpc2libGUgY29udGVudFxuICogQHBhcmFtIGNtRWRpdG9yXG4gKiBAcmV0dXJucyBMZXR0ZXIgb2Zmc2V0IGFuZCB2aXNpYmxlIGNvbnRlbnQgYXMgYSBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFZpc2libGVMaW5lVGV4dChjbUVkaXRvcjogRWRpdG9yKTogeyBpbmRPZmZzZXQ6IG51bWJlciwgc3Ryczogc3RyaW5nIH0ge1xuICAgIGNvbnN0IHNjcm9sbEluZm8gPSBjbUVkaXRvci5nZXRTY3JvbGxJbmZvKCk7XG4gICAgY29uc3QgeyBsaW5lOiBmcm9tIH0gPSBjbUVkaXRvci5jb29yZHNDaGFyKHsgbGVmdDogMCwgdG9wOiAwIH0sICdwYWdlJyk7XG4gICAgY29uc3QgeyBsaW5lOiB0byB9ID0gY21FZGl0b3IuY29vcmRzQ2hhcih7IGxlZnQ6IHNjcm9sbEluZm8ubGVmdCwgdG9wOiBzY3JvbGxJbmZvLnRvcCArIHNjcm9sbEluZm8uaGVpZ2h0fSlcbiAgICBjb25zdCBpbmRPZmZzZXQgPSBjbUVkaXRvci5pbmRleEZyb21Qb3Moe2NoOjAsIGxpbmU6IGZyb219KVxuICAgIGNvbnN0IHN0cnMgPSBjbUVkaXRvci5nZXRSYW5nZSh7Y2g6IDAsIGxpbmU6IGZyb219LCB7Y2g6IDAsIGxpbmU6IHRvICsgMX0pXG5cbiAgICByZXR1cm4geyBpbmRPZmZzZXQsIHN0cnMgfTtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIGFscGhhYmV0IC0gTGV0dGVycyB3aGljaCB1c2VkIHRvIHByb2R1Y2UgaGludHNcbiAqIEBwYXJhbSBudW1MaW5rSGludHMgLSBDb3VudCBvZiBuZWVkZWQgbGlua3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExpbmtIaW50TGV0dGVycyhhbHBoYWJldDogc3RyaW5nLCBudW1MaW5rSGludHM6IG51bWJlcik6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBhbHBoYWJldFVwcGVyY2FzZSA9IGFscGhhYmV0LnRvVXBwZXJDYXNlKClcblxuICAgIGxldCBwcmVmaXhDb3VudCA9IE1hdGguY2VpbCgobnVtTGlua0hpbnRzIC0gYWxwaGFiZXRVcHBlcmNhc2UubGVuZ3RoKSAvIChhbHBoYWJldFVwcGVyY2FzZS5sZW5ndGggLSAxKSlcblxuICAgIC8vIGVuc3VyZSAwIDw9IHByZWZpeENvdW50IDw9IGFscGhhYmV0Lmxlbmd0aFxuICAgIHByZWZpeENvdW50ID0gTWF0aC5tYXgocHJlZml4Q291bnQsIDApO1xuICAgIHByZWZpeENvdW50ID0gTWF0aC5taW4ocHJlZml4Q291bnQsIGFscGhhYmV0VXBwZXJjYXNlLmxlbmd0aCk7XG5cbiAgICBjb25zdCBwcmVmaXhlcyA9IFsnJywgLi4uQXJyYXkuZnJvbShhbHBoYWJldFVwcGVyY2FzZS5zbGljZSgwLCBwcmVmaXhDb3VudCkpXTtcblxuICAgIGNvbnN0IGxpbmtIaW50TGV0dGVycyA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwcmVmaXggPSBwcmVmaXhlc1tpXVxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFscGhhYmV0VXBwZXJjYXNlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAobGlua0hpbnRMZXR0ZXJzLmxlbmd0aCA8IG51bUxpbmtIaW50cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxldHRlciA9IGFscGhhYmV0VXBwZXJjYXNlW2pdO1xuICAgICAgICAgICAgICAgIGlmIChwcmVmaXggPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcHJlZml4ZXMuY29udGFpbnMobGV0dGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlua0hpbnRMZXR0ZXJzLnB1c2gobGV0dGVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmtIaW50TGV0dGVycy5wdXNoKHByZWZpeCArIGxldHRlcilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpbmtIaW50TGV0dGVycztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1ESGludExpbmtzKGNvbnRlbnQ6IHN0cmluZywgb2Zmc2V0OiBudW1iZXIsIGxldHRlcnM6IHN0cmluZyk6IFNvdXJjZUxpbmtIaW50W10ge1xuICAgIC8vIGV4cGVjdGluZyBlaXRoZXIgW1tMaW5rXV0gb3IgW1tMaW5rfFRpdGxlXV1cbiAgICBjb25zdCByZWdFeEludGVybmFsID0gL1xcW1xcWyguKz8pKFxcfC4rPyk/XV0vZztcbiAgICAvLyBleHBlY3RpbmcgW1RpdGxlXSguLi9leGFtcGxlLm1kKVxuICAgIGNvbnN0IHJlZ0V4TWRJbnRlcm5hbCA9IC9cXFtbXlxcW1xcXV0rP1xcXVxcKCgoXFwuXFwufFxcd3xcXGQpLis/KVxcKS9nO1xuICAgIC8vIGV4cGVjdGluZyBbVGl0bGVdKGZpbGU6Ly9saW5rKSwgW1RpdGxlXShodHRwczovL2xpbmspIG9yIGFueSBvdGhlciBbSmlyYS0xMjNdKGppcmE6Ly9ibGEtYmxhKSBsaW5rXG4gICAgY29uc3QgcmVnRXhFeHRlcm5hbCA9IC9cXFtbXlxcW1xcXV0rP1xcXVxcKCguKz86XFwvXFwvLis/KVxcKS9nO1xuICAgIC8vIGV4cGVjdGluZyBodHRwOi8vaG9nZWhvZ2Ugb3IgaHR0cHM6Ly9ob2dlaG9nZVxuICAgIGNvbnN0IHJlZ0V4VXJsID0gLyggfFxcbnxeKShodHRwcz86XFwvXFwvW14gXFxuXSspL2c7XG5cbiAgICB0eXBlIEluZGV4ZWRMaW5rID0geyBpbmRleDogbnVtYmVyLCB0eXBlOiAnaW50ZXJuYWwnIHwgJ2V4dGVybmFsJywgbGlua1RleHQ6IHN0cmluZyB9XG4gICAgbGV0IGluZGV4ZXMgPSBuZXcgU2V0PG51bWJlcj4oKVxuICAgIGxldCBsaW5rc1dpdGhJbmRleDogSW5kZXhlZExpbmtbXSA9IFtdO1xuICAgIGxldCByZWdFeFJlc3VsdDtcblxuICAgIGNvbnN0IGFkZExpbmtUb0FycmF5ID0gKGxpbms6IEluZGV4ZWRMaW5rKSA9PiB7XG4gICAgICAgIGlmKGluZGV4ZXMuaGFzKGxpbmsuaW5kZXgpKSByZXR1cm5cbiAgICAgICAgaW5kZXhlcy5hZGQobGluay5pbmRleClcbiAgICAgICAgbGlua3NXaXRoSW5kZXgucHVzaChsaW5rKVxuICAgIH1cblxuICAgIHdoaWxlKHJlZ0V4UmVzdWx0ID0gcmVnRXhJbnRlcm5hbC5leGVjKGNvbnRlbnQpKSB7XG4gICAgICAgIGNvbnN0IGxpbmtUZXh0ID0gcmVnRXhSZXN1bHRbMV0/LnRyaW0oKTtcbiAgICAgICAgYWRkTGlua1RvQXJyYXkoeyBpbmRleDogcmVnRXhSZXN1bHQuaW5kZXggKyBvZmZzZXQsIHR5cGU6ICdpbnRlcm5hbCcsIGxpbmtUZXh0IH0pO1xuICAgIH1cblxuICAgIC8vIEV4dGVybmFsIExpbmsgYWJvdmUgaW50ZXJuYWwsIHRvIHByZWZlciB0eXBlIGV4dGVybmFsIG92ZXIgaW50ZXJhbCBpbiBjYXNlIG9mIGEgZHVwZVxuICAgIHdoaWxlKHJlZ0V4UmVzdWx0ID0gcmVnRXhFeHRlcm5hbC5leGVjKGNvbnRlbnQpKSB7XG4gICAgICAgIGNvbnN0IGxpbmtUZXh0ID0gcmVnRXhSZXN1bHRbMV07XG4gICAgICAgIGFkZExpbmtUb0FycmF5KHsgaW5kZXg6IHJlZ0V4UmVzdWx0LmluZGV4ICsgb2Zmc2V0LCB0eXBlOiAnZXh0ZXJuYWwnLCBsaW5rVGV4dCB9KVxuICAgIH1cblxuICAgIHdoaWxlKHJlZ0V4UmVzdWx0ID0gcmVnRXhNZEludGVybmFsLmV4ZWMoY29udGVudCkpIHtcbiAgICAgICAgY29uc3QgbGlua1RleHQgPSByZWdFeFJlc3VsdFsxXTtcbiAgICAgICAgYWRkTGlua1RvQXJyYXkoeyBpbmRleDogcmVnRXhSZXN1bHQuaW5kZXggKyBvZmZzZXQsIHR5cGU6ICdpbnRlcm5hbCcsIGxpbmtUZXh0IH0pO1xuICAgIH1cblxuICAgIHdoaWxlKHJlZ0V4UmVzdWx0ID0gcmVnRXhVcmwuZXhlYyhjb250ZW50KSkge1xuICAgICAgICBjb25zdCBsaW5rVGV4dCA9IHJlZ0V4UmVzdWx0WzJdO1xuICAgICAgICBhZGRMaW5rVG9BcnJheSh7IGluZGV4OiByZWdFeFJlc3VsdC5pbmRleCArIG9mZnNldCArIDEsIHR5cGU6ICdleHRlcm5hbCcsIGxpbmtUZXh0IH0pXG4gICAgfVxuXG4gICAgY29uc3QgbGlua0hpbnRMZXR0ZXJzID0gZ2V0TGlua0hpbnRMZXR0ZXJzKGxldHRlcnMsIGxpbmtzV2l0aEluZGV4Lmxlbmd0aCk7XG5cbiAgICBjb25zdCBsaW5rc1dpdGhMZXR0ZXI6IFNvdXJjZUxpbmtIaW50W10gPSBbXTtcbiAgICBsaW5rc1dpdGhJbmRleFxuICAgICAgICAuc29ydCgoeCx5KSA9PiB4LmluZGV4IC0geS5pbmRleClcbiAgICAgICAgLmZvckVhY2goKGxpbmtIaW50LCBpKSA9PiB7XG4gICAgICAgICAgICBsaW5rc1dpdGhMZXR0ZXIucHVzaCh7IGxldHRlcjogbGlua0hpbnRMZXR0ZXJzW2ldLCAuLi5saW5rSGludH0pO1xuICAgICAgICB9KTtcblxuICAgIHJldHVybiBsaW5rc1dpdGhMZXR0ZXIuZmlsdGVyKGxpbmsgPT4gbGluay5sZXR0ZXIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlV2lkZ2V0RWxlbWVudChjb250ZW50OiBzdHJpbmcsIHR5cGU6IHN0cmluZykge1xuICAgIGNvbnN0IGxpbmtIaW50RWwgPSBhY3RpdmVEb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBsaW5rSGludEVsLmNsYXNzTGlzdC5hZGQoJ2psJyk7XG4gICAgbGlua0hpbnRFbC5jbGFzc0xpc3QuYWRkKCdqbC0nK3R5cGUpO1xuICAgIGxpbmtIaW50RWwuY2xhc3NMaXN0LmFkZCgncG9wb3ZlcicpO1xuICAgIGxpbmtIaW50RWwuaW5uZXJIVE1MID0gY29udGVudDtcbiAgICByZXR1cm4gbGlua0hpbnRFbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc3BsYXlTb3VyY2VQb3BvdmVycyhjbUVkaXRvcjogRWRpdG9yLCBsaW5rS2V5TWFwOiBTb3VyY2VMaW5rSGludFtdKTogdm9pZCB7XG4gICAgY29uc3QgZHJhd1dpZGdldCA9IChjbUVkaXRvcjogRWRpdG9yLCBsaW5rSGludDogU291cmNlTGlua0hpbnQpID0+IHtcbiAgICAgICAgY29uc3QgcG9zID0gY21FZGl0b3IucG9zRnJvbUluZGV4KGxpbmtIaW50LmluZGV4KTtcbiAgICAgICAgLy8gdGhlIGZvdXJ0aCBwYXJhbWV0ZXIgaXMgdW5kb2N1bWVudGVkLiBpdCBzcGVjaWZpZXMgd2hlcmUgdGhlIHdpZGdldCBzaG91bGQgYmUgcGxhY2VcbiAgICAgICAgcmV0dXJuIChjbUVkaXRvciBhcyBhbnkpLmFkZFdpZGdldChwb3MsIGNyZWF0ZVdpZGdldEVsZW1lbnQobGlua0hpbnQubGV0dGVyLCBsaW5rSGludC50eXBlKSwgZmFsc2UsICdvdmVyJyk7XG4gICAgfVxuXG4gICAgbGlua0tleU1hcC5mb3JFYWNoKHggPT4gZHJhd1dpZGdldChjbUVkaXRvciwgeCkpO1xufVxuXG4iLCJpbXBvcnQge1Byb2Nlc3NvciwgU291cmNlTGlua0hpbnR9IGZyb20gXCIuLi8uLi90eXBlc1wiO1xuaW1wb3J0IHtFZGl0b3JWaWV3fSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuaW1wb3J0IHtnZXRNREhpbnRMaW5rc30gZnJvbSBcIi4uL3V0aWxzL2NvbW1vblwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDTTZMaW5rUHJvY2Vzc29yIGltcGxlbWVudHMgUHJvY2Vzc29yIHtcbiAgICBjbUVkaXRvcjogRWRpdG9yVmlldztcbiAgICBsZXR0ZXJzOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihlZGl0b3I6IEVkaXRvclZpZXcsIGFscGhhYmV0OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5jbUVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgdGhpcy5sZXR0ZXJzID0gYWxwaGFiZXQ7XG4gICAgfVxuXG4gICAgcHVibGljIGluaXQoKTogU291cmNlTGlua0hpbnRbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFNvdXJjZUxpbmtIaW50cygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRWaXNpYmxlTGluZXMoKSB7XG4gICAgICAgIGNvbnN0IHsgY21FZGl0b3IgfSA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHsgZnJvbSwgdG8gfSA9IGNtRWRpdG9yLnZpZXdwb3J0O1xuXG4gICAgICAgIC8vIEZvciBDTTYgZ2V0IHJlYWwgdmlzaWJsZSBsaW5lcyB0b3BcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoY21FZGl0b3Iudmlld1N0YXRlPy5waXhlbFZpZXdwb3J0Py50b3ApIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHBpeGVsT2Zmc2V0VG9wID0gY21FZGl0b3Iudmlld1N0YXRlLnBpeGVsVmlld3BvcnQudG9wXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBsaW5lcyA9IGNtRWRpdG9yLnZpZXdTdGF0ZS52aWV3cG9ydExpbmVzXG5cbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGZyb20gPSBsaW5lcy5maWx0ZXIobGluZSA9PiBsaW5lLnRvcCA+IHBpeGVsT2Zmc2V0VG9wKVswXT8uZnJvbVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29udGVudCA9IGNtRWRpdG9yLnN0YXRlLnNsaWNlRG9jKGZyb20sIHRvKTtcblxuICAgICAgICByZXR1cm4geyBpbmRleDogZnJvbSwgY29udGVudCB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0U291cmNlTGlua0hpbnRzID0gKCk6IFNvdXJjZUxpbmtIaW50W10gPT4ge1xuICAgICAgICBjb25zdCB7IGxldHRlcnMgfSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IHsgaW5kZXgsIGNvbnRlbnQgfSA9IHRoaXMuZ2V0VmlzaWJsZUxpbmVzKCk7XG5cbiAgICAgICAgcmV0dXJuIGdldE1ESGludExpbmtzKGNvbnRlbnQsIGluZGV4LCBsZXR0ZXJzKTtcbiAgICB9XG59IiwiaW1wb3J0IHtnZXRMaW5rSGludExldHRlcnN9IGZyb20gXCIuL2NvbW1vblwiO1xuaW1wb3J0IHtTb3VyY2VMaW5rSGludH0gZnJvbSBcIi4uLy4uL3R5cGVzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0UmVnZXhwQmxvY2tzKGNvbnRlbnQ6IHN0cmluZywgb2Zmc2V0OiBudW1iZXIsIHJlZ2V4cDogc3RyaW5nLCBsZXR0ZXJzOiBzdHJpbmcsIGNhc2VTZW5zaXRpdmU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCByZWdFeFVybCA9IGNhc2VTZW5zaXRpdmUgPyBuZXcgUmVnRXhwKHJlZ2V4cCwgJ2cnKSA6IG5ldyBSZWdFeHAocmVnZXhwLCAnaWcnKTtcblxuICAgIGxldCBsaW5rc1dpdGhJbmRleDoge1xuICAgICAgICBpbmRleDogbnVtYmVyO1xuICAgICAgICB0eXBlOiBcInJlZ2V4XCI7XG4gICAgICAgIGxpbmtUZXh0OiBzdHJpbmc7XG4gICAgfVtdID0gW107XG5cbiAgICBsZXQgcmVnRXhSZXN1bHQ7XG5cbiAgICB3aGlsZSAoKHJlZ0V4UmVzdWx0ID0gcmVnRXhVcmwuZXhlYyhjb250ZW50KSkpIHtcbiAgICAgICAgY29uc3QgbGlua1RleHQgPSByZWdFeFJlc3VsdFsxXTtcbiAgICAgICAgbGlua3NXaXRoSW5kZXgucHVzaCh7XG4gICAgICAgICAgICBpbmRleDogcmVnRXhSZXN1bHQuaW5kZXggKyBvZmZzZXQsXG4gICAgICAgICAgICB0eXBlOiBcInJlZ2V4XCIsXG4gICAgICAgICAgICBsaW5rVGV4dCxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgbGlua0hpbnRMZXR0ZXJzID0gZ2V0TGlua0hpbnRMZXR0ZXJzKGxldHRlcnMsIGxpbmtzV2l0aEluZGV4Lmxlbmd0aCk7XG5cbiAgICBjb25zdCBsaW5rc1dpdGhMZXR0ZXI6IFNvdXJjZUxpbmtIaW50W10gPSBbXTtcbiAgICBsaW5rc1dpdGhJbmRleFxuICAgICAgICAuc29ydCgoeCwgeSkgPT4geC5pbmRleCAtIHkuaW5kZXgpXG4gICAgICAgIC5mb3JFYWNoKChsaW5rSGludCwgaSkgPT4ge1xuICAgICAgICAgICAgbGlua3NXaXRoTGV0dGVyLnB1c2goe1xuICAgICAgICAgICAgICAgIGxldHRlcjogbGlua0hpbnRMZXR0ZXJzW2ldLFxuICAgICAgICAgICAgICAgIC4uLmxpbmtIaW50LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgcmV0dXJuIGxpbmtzV2l0aExldHRlci5maWx0ZXIobGluayA9PiBsaW5rLmxldHRlcik7XG59XG4iLCJpbXBvcnQgQ002TGlua1Byb2Nlc3NvciBmcm9tIFwiLi9DTTZMaW5rUHJvY2Vzc29yXCI7XG5pbXBvcnQge1Byb2Nlc3Nvcn0gZnJvbSBcIi4uLy4uL3R5cGVzXCI7XG5pbXBvcnQge0VkaXRvclZpZXd9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5pbXBvcnQge2V4dHJhY3RSZWdleHBCbG9ja3N9IGZyb20gXCIuLi91dGlscy9yZWdleHBcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ002UmVnZXhQcm9jZXNzb3IgZXh0ZW5kcyBDTTZMaW5rUHJvY2Vzc29yIGltcGxlbWVudHMgUHJvY2Vzc29yIHtcbiAgICByZWdleHA6IHN0cmluZztcbiAgICBjYXNlU2Vuc2l0aXZlOiBib29sZWFuO1xuICAgIGNvbnN0cnVjdG9yKGVkaXRvcjogRWRpdG9yVmlldywgYWxwaGFiZXQ6IHN0cmluZywgcmVnZXhwOiBzdHJpbmcsIGNhc2VTZW5zaXRpdmU6IGJvb2xlYW4pIHtcbiAgICAgICAgc3VwZXIoZWRpdG9yLCBhbHBoYWJldCk7XG4gICAgICAgIHRoaXMucmVnZXhwID0gcmVnZXhwO1xuICAgICAgICB0aGlzLmNhc2VTZW5zaXRpdmUgPSBjYXNlU2Vuc2l0aXZlO1xuICAgIH1cblxuICAgIGluaXQoKSB7XG4gICAgICAgIGNvbnN0IHsgbGV0dGVycywgcmVnZXhwIH0gPSB0aGlzO1xuICAgICAgICBjb25zdCB7IGluZGV4LCBjb250ZW50IH0gPSB0aGlzLmdldFZpc2libGVMaW5lcygpO1xuICAgICAgICByZXR1cm4gZXh0cmFjdFJlZ2V4cEJsb2Nrcyhjb250ZW50LCBpbmRleCwgcmVnZXhwLCBsZXR0ZXJzLCB0aGlzLmNhc2VTZW5zaXRpdmUpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7RWRpdG9yfSBmcm9tIFwiY29kZW1pcnJvclwiO1xuaW1wb3J0IHtQcm9jZXNzb3IsIFNvdXJjZUxpbmtIaW50fSBmcm9tIFwiLi4vLi4vdHlwZXNcIjtcbmltcG9ydCB7ZGlzcGxheVNvdXJjZVBvcG92ZXJzLCBnZXRWaXNpYmxlTGluZVRleHR9IGZyb20gXCIuLi91dGlscy9jb21tb25cIjtcbmltcG9ydCB7ZXh0cmFjdFJlZ2V4cEJsb2Nrc30gZnJvbSBcIi4uL3V0aWxzL3JlZ2V4cFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMZWdhY3lSZWdleHBQcm9jZXNzb3IgaW1wbGVtZW50cyBQcm9jZXNzb3Ige1xuICAgIGNtRWRpdG9yOiBFZGl0b3I7XG4gICAgcmVnZXhwOiBzdHJpbmc7XG4gICAgbGV0dGVyczogc3RyaW5nO1xuICAgIGNhc2VTZW5zaXRpdmU6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3RvcihjbUVkaXRvcjogRWRpdG9yLCByZWdleHA6IHN0cmluZywgYWxwaGFiZXQ6IHN0cmluZywgY2FzZVNlbnNpdGl2ZTogYm9vbGVhbikge1xuICAgICAgICB0aGlzLmNtRWRpdG9yID0gY21FZGl0b3I7XG4gICAgICAgIHRoaXMucmVnZXhwID0gcmVnZXhwO1xuICAgICAgICB0aGlzLmxldHRlcnMgPSBhbHBoYWJldDtcbiAgICAgICAgdGhpcy5jYXNlU2Vuc2l0aXZlID0gY2FzZVNlbnNpdGl2ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW5pdCgpOiBTb3VyY2VMaW5rSGludFtdIHtcbiAgICAgICAgY29uc3QgW2NvbnRlbnQsIG9mZnNldF0gPSB0aGlzLmdldFZpc2libGVDb250ZW50KCk7XG4gICAgICAgIGNvbnN0IGxpbmtzID0gdGhpcy5nZXRMaW5rcyhjb250ZW50LCBvZmZzZXQpO1xuXG4gICAgICAgIHRoaXMuZGlzcGxheShsaW5rcyk7XG4gICAgICAgIHJldHVybiBsaW5rcztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFZpc2libGVDb250ZW50KCk6IFtzdHJpbmcsIG51bWJlcl0ge1xuICAgICAgICBjb25zdCB7IGNtRWRpdG9yIH0gPSB0aGlzO1xuICAgICAgICBjb25zdCB7IGluZE9mZnNldCwgc3RycyB9ID0gZ2V0VmlzaWJsZUxpbmVUZXh0KGNtRWRpdG9yKTtcblxuICAgICAgICByZXR1cm4gW3N0cnMsIGluZE9mZnNldF07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRMaW5rcyhjb250ZW50OiBzdHJpbmcsIG9mZnNldDogbnVtYmVyKTogU291cmNlTGlua0hpbnRbXSB7XG4gICAgICAgIGNvbnN0IHsgcmVnZXhwLCBsZXR0ZXJzIH0gPSB0aGlzXG4gICAgICAgIHJldHVybiBleHRyYWN0UmVnZXhwQmxvY2tzKGNvbnRlbnQsIG9mZnNldCwgcmVnZXhwLCBsZXR0ZXJzLCB0aGlzLmNhc2VTZW5zaXRpdmUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZGlzcGxheShsaW5rczogU291cmNlTGlua0hpbnRbXSk6IHZvaWQge1xuICAgICAgICBjb25zdCB7IGNtRWRpdG9yIH0gPSB0aGlzXG4gICAgICAgIGRpc3BsYXlTb3VyY2VQb3BvdmVycyhjbUVkaXRvciwgbGlua3MpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7UHJvY2Vzc29yLCBTb3VyY2VMaW5rSGludH0gZnJvbSBcIi4uLy4uL3R5cGVzXCI7XG5pbXBvcnQge0VkaXRvcn0gZnJvbSBcImNvZGVtaXJyb3JcIjtcbmltcG9ydCB7ZGlzcGxheVNvdXJjZVBvcG92ZXJzLCBnZXRNREhpbnRMaW5rcywgZ2V0VmlzaWJsZUxpbmVUZXh0fSBmcm9tIFwiLi4vdXRpbHMvY29tbW9uXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExlZ2FjeVNvdXJjZUxpbmtQcm9jZXNzb3IgaW1wbGVtZW50cyBQcm9jZXNzb3Ige1xuICAgIGNtRWRpdG9yOiBFZGl0b3I7XG4gICAgbGV0dGVyczogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IoZWRpdG9yOiBFZGl0b3IsIGFscGhhYmV0OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5jbUVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgdGhpcy5sZXR0ZXJzID0gYWxwaGFiZXQ7XG4gICAgfVxuXG4gICAgcHVibGljIGluaXQoKSB7XG4gICAgICAgIGNvbnN0IHsgY21FZGl0b3IgfSA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgbGlua0hpbnRzID0gdGhpcy5nZXRTb3VyY2VMaW5rSGludHMoY21FZGl0b3IpO1xuICAgICAgICBkaXNwbGF5U291cmNlUG9wb3ZlcnMoY21FZGl0b3IsIGxpbmtIaW50cyk7XG5cbiAgICAgICAgcmV0dXJuIGxpbmtIaW50cztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFNvdXJjZUxpbmtIaW50cyA9IChjbUVkaXRvcjogRWRpdG9yKTogU291cmNlTGlua0hpbnRbXSA9PiB7XG4gICAgICAgIGNvbnN0IHsgbGV0dGVycyB9ID0gdGhpcztcbiAgICAgICAgY29uc3QgeyBpbmRPZmZzZXQsIHN0cnMgfSA9IGdldFZpc2libGVMaW5lVGV4dChjbUVkaXRvcik7XG5cbiAgICAgICAgcmV0dXJuIGdldE1ESGludExpbmtzKHN0cnMsIGluZE9mZnNldCwgbGV0dGVycyk7XG4gICAgfVxufSIsImltcG9ydCB7TGlua0hpbnRUeXBlLCBQcmV2aWV3TGlua0hpbnR9IGZyb20gXCIuLi8uLi90eXBlc1wiO1xuaW1wb3J0IHtnZXRMaW5rSGludExldHRlcnN9IGZyb20gXCIuL2NvbW1vblwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlld0xpbmtIaW50cyhwcmV2aWV3Vmlld0VsOiBIVE1MRWxlbWVudCwgbGV0dGVyczogc3RyaW5nICk6IFByZXZpZXdMaW5rSGludFtdIHtcbiAgICBjb25zdCBhbmNob3JFbHMgPSBwcmV2aWV3Vmlld0VsLnF1ZXJ5U2VsZWN0b3JBbGwoJ2EnKTtcbiAgICBjb25zdCBlbWJlZEVscyA9IHByZXZpZXdWaWV3RWwucXVlcnlTZWxlY3RvckFsbCgnLmludGVybmFsLWVtYmVkJyk7XG5cbiAgICBjb25zdCBsaW5rSGludHM6IFByZXZpZXdMaW5rSGludFtdID0gW107XG4gICAgYW5jaG9yRWxzLmZvckVhY2goKGFuY2hvckVsLCBfaSkgPT4ge1xuICAgICAgICBpZiAoY2hlY2tJc1ByZXZpZXdFbE9uU2NyZWVuKHByZXZpZXdWaWV3RWwsIGFuY2hvckVsKSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsaW5rVHlwZTogTGlua0hpbnRUeXBlID0gYW5jaG9yRWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdpbnRlcm5hbC1saW5rJylcbiAgICAgICAgICAgID8gJ2ludGVybmFsJ1xuICAgICAgICAgICAgOiAnZXh0ZXJuYWwnO1xuXG4gICAgICAgIGNvbnN0IGxpbmtUZXh0ID0gbGlua1R5cGUgPT09ICdpbnRlcm5hbCdcbiAgICAgICAgICAgID8gYW5jaG9yRWwuZGF0YXNldFsnaHJlZiddID8/IGFuY2hvckVsLmhyZWZcbiAgICAgICAgICAgIDogYW5jaG9yRWwuaHJlZjtcblxuICAgICAgICBsZXQgb2Zmc2V0UGFyZW50ID0gYW5jaG9yRWwub2Zmc2V0UGFyZW50IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBsZXQgdG9wID0gYW5jaG9yRWwub2Zmc2V0VG9wO1xuICAgICAgICBsZXQgbGVmdCA9IGFuY2hvckVsLm9mZnNldExlZnQ7XG5cbiAgICAgICAgd2hpbGUgKG9mZnNldFBhcmVudCkge1xuICAgICAgICAgICAgaWYgKG9mZnNldFBhcmVudCA9PSBwcmV2aWV3Vmlld0VsKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0b3AgKz0gb2Zmc2V0UGFyZW50Lm9mZnNldFRvcDtcbiAgICAgICAgICAgICAgICBsZWZ0ICs9IG9mZnNldFBhcmVudC5vZmZzZXRMZWZ0O1xuICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5vZmZzZXRQYXJlbnQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGlua0hpbnRzLnB1c2goe1xuICAgICAgICAgICAgbGlua0VsZW1lbnQ6IGFuY2hvckVsLFxuICAgICAgICAgICAgbGV0dGVyOiAnJyxcbiAgICAgICAgICAgIGxpbmtUZXh0OiBsaW5rVGV4dCxcbiAgICAgICAgICAgIHR5cGU6IGxpbmtUeXBlLFxuICAgICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgICAgICBsZWZ0OiBsZWZ0LFxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGVtYmVkRWxzLmZvckVhY2goKGVtYmVkRWwsIF9pKSA9PiB7XG4gICAgICAgIGNvbnN0IGxpbmtUZXh0ID0gZW1iZWRFbC5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgICBjb25zdCBsaW5rRWwgPSBlbWJlZEVsLnF1ZXJ5U2VsZWN0b3IoJy5tYXJrZG93bi1lbWJlZC1saW5rJykgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKGxpbmtUZXh0ICYmIGxpbmtFbCkge1xuICAgICAgICAgICAgaWYgKGNoZWNrSXNQcmV2aWV3RWxPblNjcmVlbihwcmV2aWV3Vmlld0VsLCBsaW5rRWwpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBvZmZzZXRQYXJlbnQgPSBsaW5rRWwub2Zmc2V0UGFyZW50IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgbGV0IHRvcCA9IGxpbmtFbC5vZmZzZXRUb3A7XG4gICAgICAgICAgICBsZXQgbGVmdCA9IGxpbmtFbC5vZmZzZXRMZWZ0O1xuXG4gICAgICAgICAgICB3aGlsZSAob2Zmc2V0UGFyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldFBhcmVudCA9PSBwcmV2aWV3Vmlld0VsKSB7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0b3AgKz0gb2Zmc2V0UGFyZW50Lm9mZnNldFRvcDtcbiAgICAgICAgICAgICAgICAgICAgbGVmdCArPSBvZmZzZXRQYXJlbnQub2Zmc2V0TGVmdDtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxpbmtIaW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICBsaW5rRWxlbWVudDogbGlua0VsLFxuICAgICAgICAgICAgICAgIGxldHRlcjogJycsXG4gICAgICAgICAgICAgICAgbGlua1RleHQ6IGxpbmtUZXh0LFxuICAgICAgICAgICAgICAgIHR5cGU6ICdpbnRlcm5hbCcsXG4gICAgICAgICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogbGVmdCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3J0ZWRMaW5rSGludHMgPSBsaW5rSGludHMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICBpZiAoYS50b3AgPiBiLnRvcCkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH0gZWxzZSBpZiAoYS50b3AgPT09IGIudG9wKSB7XG4gICAgICAgICAgICBpZiAoYS5sZWZ0ID4gYi5sZWZ0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGEubGVmdCA9PT0gYi5sZWZ0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgbGlua0hpbnRMZXR0ZXJzID0gZ2V0TGlua0hpbnRMZXR0ZXJzKGxldHRlcnMsIHNvcnRlZExpbmtIaW50cy5sZW5ndGgpO1xuXG4gICAgc29ydGVkTGlua0hpbnRzLmZvckVhY2goKGxpbmtIaW50LCBpKSA9PiB7XG4gICAgICAgIGxpbmtIaW50LmxldHRlciA9IGxpbmtIaW50TGV0dGVyc1tpXTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzb3J0ZWRMaW5rSGludHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0lzUHJldmlld0VsT25TY3JlZW4ocGFyZW50OiBIVE1MRWxlbWVudCwgZWw6IEhUTUxFbGVtZW50KSB7XG4gICAgcmV0dXJuIGVsLm9mZnNldFRvcCA8IHBhcmVudC5zY3JvbGxUb3AgfHwgZWwub2Zmc2V0VG9wID4gcGFyZW50LnNjcm9sbFRvcCArIHBhcmVudC5vZmZzZXRIZWlnaHRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc3BsYXlQcmV2aWV3UG9wb3ZlcnMobGlua0hpbnRzOiBQcmV2aWV3TGlua0hpbnRbXSk6IEhUTUxFbGVtZW50W10ge1xuICAgIGNvbnN0IGxpbmtIaW50SHRtbEVsZW1lbnRzOiBIVE1MRWxlbWVudFtdID0gW11cbiAgICBmb3IgKGxldCBsaW5rSGludCBvZiBsaW5rSGludHMpIHtcbiAgICAgICAgY29uc3QgcG9wb3ZlckVsZW1lbnQgPSBsaW5rSGludC5saW5rRWxlbWVudC5jcmVhdGVFbCgnc3BhbicpO1xuICAgICAgICBsaW5rSGludC5saW5rRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSdcbiAgICAgICAgcG9wb3ZlckVsZW1lbnQuc3R5bGUudG9wID0gJzBweCc7XG4gICAgICAgIHBvcG92ZXJFbGVtZW50LnN0eWxlLmxlZnQgPSAnMHB4JztcbiAgICAgICAgcG9wb3ZlckVsZW1lbnQudGV4dENvbnRlbnQgPSBsaW5rSGludC5sZXR0ZXI7XG4gICAgICAgIHBvcG92ZXJFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2psJyk7XG4gICAgICAgIHBvcG92ZXJFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2psLScrbGlua0hpbnQudHlwZSk7XG4gICAgICAgIHBvcG92ZXJFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3BvcG92ZXInKTtcbiAgICAgICAgbGlua0hpbnRIdG1sRWxlbWVudHMucHVzaChwb3BvdmVyRWxlbWVudClcbiAgICB9XG4gICAgcmV0dXJuIGxpbmtIaW50SHRtbEVsZW1lbnRzXG59XG5cbiIsImltcG9ydCB7UHJldmlld0xpbmtIaW50fSBmcm9tIFwiLi4vLi4vdHlwZXNcIjtcbmltcG9ydCB7ZGlzcGxheVByZXZpZXdQb3BvdmVycywgZ2V0UHJldmlld0xpbmtIaW50c30gZnJvbSBcIi4uL3V0aWxzL3ByZXZpZXdcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJldmlld0xpbmtQcm9jZXNzb3Ige1xuICAgIHZpZXc6IEhUTUxFbGVtZW50O1xuICAgIGFscGhhYmV0OiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3Rvcih2aWV3OiBIVE1MRWxlbWVudCwgYWxwaGFiZXQ6IHN0cmluZykge1xuICAgICAgICB0aGlzLnZpZXcgPSB2aWV3O1xuICAgICAgICB0aGlzLmFscGhhYmV0ID0gYWxwaGFiZXQ7XG4gICAgfVxuXG4gICAgcHVibGljIGluaXQoKTogUHJldmlld0xpbmtIaW50W10ge1xuICAgICAgICBjb25zdCB7IHZpZXcsIGFscGhhYmV0IH0gPSB0aGlzXG4gICAgICAgIGNvbnN0IGxpbmtzID0gZ2V0UHJldmlld0xpbmtIaW50cyh2aWV3LCBhbHBoYWJldCk7XG4gICAgICAgIGRpc3BsYXlQcmV2aWV3UG9wb3ZlcnMobGlua3MpO1xuICAgICAgICByZXR1cm4gbGlua3M7XG4gICAgfVxufSIsImltcG9ydCB7UHJldmlld0xpbmtIaW50LCBTb3VyY2VMaW5rSGludH0gZnJvbSBcIi4uLy4uL3R5cGVzXCI7XG5pbXBvcnQge0VkaXRvclZpZXd9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5pbXBvcnQge2Rpc3BsYXlQcmV2aWV3UG9wb3ZlcnMsIGdldFByZXZpZXdMaW5rSGludHN9IGZyb20gXCIuLi91dGlscy9wcmV2aWV3XCI7XG5cbmltcG9ydCB7Z2V0TGlua0hpbnRMZXR0ZXJzLCBnZXRNREhpbnRMaW5rc30gZnJvbSBcIi4uL3V0aWxzL2NvbW1vblwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMaXZlUHJldmlld0xpbmtQcm9jZXNzb3Ige1xuICAgIHZpZXc6IEhUTUxFbGVtZW50O1xuICAgIGNtRWRpdG9yOiBFZGl0b3JWaWV3O1xuICAgIGFscGhhYmV0OiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3Rvcih2aWV3OiBIVE1MRWxlbWVudCwgZWRpdG9yOiBFZGl0b3JWaWV3LCBhbHBoYWJldDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMudmlldyA9IHZpZXc7XG4gICAgICAgIHRoaXMuY21FZGl0b3IgPSBlZGl0b3JcbiAgICAgICAgdGhpcy5hbHBoYWJldCA9IGFscGhhYmV0O1xuICAgIH1cblxuICAgIHB1YmxpYyBpbml0KCk6IFtQcmV2aWV3TGlua0hpbnRbXSxTb3VyY2VMaW5rSGludFtdLEhUTUxFbGVtZW50W11dIHtcbiAgICAgICAgY29uc3QgeyB2aWV3LCBhbHBoYWJldCB9ID0gdGhpc1xuICAgICAgICBjb25zdCBsaW5rcyA9IGdldFByZXZpZXdMaW5rSGludHModmlldywgYWxwaGFiZXQpO1xuICAgICAgICBjb25zdCBzb3VyY2VMaW5rcyA9IHRoaXMuZ2V0U291cmNlTGlua0hpbnRzKCk7XG4gICAgICAgIGNvbnN0IGxpbmtIaW50TGV0dGVycyA9IGdldExpbmtIaW50TGV0dGVycyhhbHBoYWJldCwgbGlua3MubGVuZ3RoICsgc291cmNlTGlua3MubGVuZ3RoKTtcbiAgICAgICAgY29uc3QgbGlua3NSZW1hcHBlZCA9IGxpbmtzLm1hcCgobGluaywgaWR4KSA9PiAoey4uLmxpbmssIGxldHRlcjogbGlua0hpbnRMZXR0ZXJzW2lkeF19KSkuZmlsdGVyKGxpbmsgPT4gbGluay5sZXR0ZXIpXG4gICAgICAgIGNvbnN0IHNvdXJjZUxpbmtzUmVtYXBwZWQgPSBzb3VyY2VMaW5rcy5tYXAoKGxpbmssIGlkeCkgPT4gKHsuLi5saW5rLCBsZXR0ZXI6IGxpbmtIaW50TGV0dGVyc1tpZHggKyBsaW5rcy5sZW5ndGhdfSkpLmZpbHRlcihsaW5rID0+IGxpbmsubGV0dGVyKVxuICAgICAgICBjb25zdCBsaW5rSGludEh0bWxFbGVtZW50cyA9IGRpc3BsYXlQcmV2aWV3UG9wb3ZlcnMobGlua3NSZW1hcHBlZCk7XG4gICAgICAgIHJldHVybiBbbGlua3NSZW1hcHBlZCwgc291cmNlTGlua3NSZW1hcHBlZCwgbGlua0hpbnRIdG1sRWxlbWVudHNdO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRWaXNpYmxlTGluZXMoKSB7XG4gICAgICAgIGNvbnN0IHsgY21FZGl0b3IgfSA9IHRoaXM7XG4gICAgICAgIGxldCB7IGZyb20sIHRvIH0gPSBjbUVkaXRvci52aWV3cG9ydDtcblxuICAgICAgICAvLyBGb3IgQ002IGdldCByZWFsIHZpc2libGUgbGluZXMgdG9wXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGNtRWRpdG9yLnZpZXdTdGF0ZT8ucGl4ZWxWaWV3cG9ydD8udG9wKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBwaXhlbE9mZnNldFRvcCA9IGNtRWRpdG9yLnZpZXdTdGF0ZS5waXhlbFZpZXdwb3J0LnRvcFxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgbGluZXMgPSBjbUVkaXRvci52aWV3U3RhdGUudmlld3BvcnRMaW5lc1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgZnJvbSA9IGxpbmVzLmZpbHRlcihsaW5lID0+IGxpbmUudG9wID4gcGl4ZWxPZmZzZXRUb3ApWzBdPy5mcm9tXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udGVudCA9IGNtRWRpdG9yLnN0YXRlLnNsaWNlRG9jKGZyb20sIHRvKTtcbiAgICAgICAgcmV0dXJuIHsgaW5kZXg6IGZyb20sIGNvbnRlbnQgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFNvdXJjZUxpbmtIaW50cyA9ICgpOiBTb3VyY2VMaW5rSGludFtdID0+IHtcbiAgICAgICAgY29uc3QgeyBhbHBoYWJldCB9ID0gdGhpcztcbiAgICAgICAgY29uc3QgeyBpbmRleCwgY29udGVudCB9ID0gdGhpcy5nZXRWaXNpYmxlTGluZXMoKTtcblxuICAgICAgICByZXR1cm4gZ2V0TURIaW50TGlua3MoY29udGVudCwgaW5kZXgsIGFscGhhYmV0KTtcbiAgICB9XG59IiwiaW1wb3J0IHtBcHAsIE1hcmtkb3duVmlldywgUGx1Z2luLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBWaWV3LCBlZGl0b3JMaXZlUHJldmlld0ZpZWxkfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQge0VkaXRvcn0gZnJvbSAnY29kZW1pcnJvcic7XG5pbXBvcnQge0VkaXRvclNlbGVjdGlvbn0gZnJvbSBcIkBjb2RlbWlycm9yL3N0YXRlXCI7XG5pbXBvcnQge0VkaXRvclZpZXcsIFZpZXdQbHVnaW59IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5pbXBvcnQge0xpbmtIaW50QmFzZSwgU2V0dGluZ3MsIFNvdXJjZUxpbmtIaW50fSBmcm9tICd0eXBlcyc7XG5pbXBvcnQge01hcmtQbHVnaW59IGZyb20gXCIuL2NtNi13aWRnZXQvTWFya1BsdWdpblwiO1xuXG5pbXBvcnQgQ002TGlua1Byb2Nlc3NvciBmcm9tIFwiLi9wcm9jZXNzb3JzL0NNNkxpbmtQcm9jZXNzb3JcIjtcbmltcG9ydCBDTTZSZWdleFByb2Nlc3NvciBmcm9tIFwiLi9wcm9jZXNzb3JzL0NNNlJlZ2V4UHJvY2Vzc29yXCI7XG5pbXBvcnQgTGVnYWN5UmVnZXhwUHJvY2Vzc29yIGZyb20gXCIuL3Byb2Nlc3NvcnMvTGVnYWN5UmVnZXhwUHJvY2Vzc29yXCI7XG5pbXBvcnQgTGVnYWN5U291cmNlTGlua1Byb2Nlc3NvciBmcm9tIFwiLi9wcm9jZXNzb3JzL0xlZ2FjeVNvdXJjZUxpbmtQcm9jZXNzb3JcIjtcbmltcG9ydCBQcmV2aWV3TGlua1Byb2Nlc3NvciBmcm9tIFwiLi9wcm9jZXNzb3JzL1ByZXZpZXdMaW5rUHJvY2Vzc29yXCI7XG5pbXBvcnQgTGl2ZVByZXZpZXdMaW5rUHJvY2Vzc29yIGZyb20gJy4vcHJvY2Vzc29ycy9MaXZlUHJldmlld0xpbmtQcm9jZXNzb3InO1xuXG5lbnVtIFZJRVdfTU9ERSB7XG4gICAgU09VUkNFLFxuICAgIFBSRVZJRVcsXG4gICAgTEVHQUNZLFxuICAgIExJVkVfUFJFVklFV1xufVxuaW50ZXJmYWNlIEN1cnNvclN0YXRlIHtcbiAgICB2aW1Nb2RlPzogc3RyaW5nO1xuICAgIGFuY2hvcj86IG51bWJlcjtcbn1cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEp1bXBUb0xpbmsgZXh0ZW5kcyBQbHVnaW4ge1xuICAgIGlzTGlua0hpbnRBY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBzZXR0aW5nczogU2V0dGluZ3M7XG4gICAgcHJlZml4SW5mbzogeyBwcmVmaXg6IHN0cmluZywgc2hpZnRLZXk6IGJvb2xlYW4gfSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBtYXJrVmlld1BsdWdpbjogVmlld1BsdWdpbjxhbnk+XG4gICAgY21FZGl0b3I6IEVkaXRvciB8IEVkaXRvclZpZXdcbiAgICBjdXJyZW50VmlldzogVmlld1xuICAgIGNvbnRlbnRFbGVtZW50OiBIVE1MRWxlbWVudFxuICAgIG1vZGU6IFZJRVdfTU9ERVxuICAgIGN1cnJlbnRDdXJzb3I6IEN1cnNvclN0YXRlID0ge307XG4gICAgY3Vyc29yQmVmb3JlSnVtcDogQ3Vyc29yU3RhdGUgPSB7fTtcblxuICAgIGFzeW5jIG9ubG9hZCgpIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IGF3YWl0IHRoaXMubG9hZERhdGEoKSB8fCBuZXcgU2V0dGluZ3MoKTtcblxuICAgICAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgICAgICBjb25zdCBtYXJrVmlld1BsdWdpbiA9IHRoaXMubWFya1ZpZXdQbHVnaW4gPSBWaWV3UGx1Z2luLmZyb21DbGFzcyhNYXJrUGx1Z2luLCB7XG4gICAgICAgICAgICBkZWNvcmF0aW9uczogdiA9PiB2LmRlY29yYXRpb25zXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyRWRpdG9yRXh0ZW5zaW9uKFttYXJrVmlld1BsdWdpbl0pXG5cbiAgICAgICAgdGhpcy53YXRjaEZvclNlbGVjdGlvbkNoYW5nZSgpO1xuXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICAgICAgICBpZDogJ2FjdGl2YXRlLWp1bXAtdG8tbGluaycsXG4gICAgICAgICAgICBuYW1lOiAnSnVtcCB0byBMaW5rJyxcbiAgICAgICAgICAgIGNhbGxiYWNrOiB0aGlzLmFjdGlvbi5iaW5kKHRoaXMsICdsaW5rJyksXG4gICAgICAgICAgICBob3RrZXlzOiBbe21vZGlmaWVyczogWydDdHJsJ10sIGtleTogYCdgfV0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICAgICAgICBpZDogXCJhY3RpdmF0ZS1qdW1wLXRvLWFueXdoZXJlXCIsXG4gICAgICAgICAgICBuYW1lOiBcIkp1bXAgdG8gQW55d2hlcmUgUmVnZXhcIixcbiAgICAgICAgICAgIGNhbGxiYWNrOiB0aGlzLmFjdGlvbi5iaW5kKHRoaXMsICdyZWdleHAnKSxcbiAgICAgICAgICAgIGhvdGtleXM6IFt7bW9kaWZpZXJzOiBbXCJDdHJsXCJdLCBrZXk6IFwiO1wifV0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICAgICAgICBpZDogXCJhY3RpdmF0ZS1saWdodHNwZWVkLWp1bXBcIixcbiAgICAgICAgICAgIG5hbWU6IFwiTGlnaHRzcGVlZCBKdW1wXCIsXG4gICAgICAgICAgICBjYWxsYmFjazogdGhpcy5hY3Rpb24uYmluZCh0aGlzLCAnbGlnaHRzcGVlZCcpLFxuICAgICAgICAgICAgaG90a2V5czogW10sXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9udW5sb2FkKCkge1xuICAgICAgICBjb25zb2xlLmxvZygndW5sb2FkaW5nIGp1bXAgdG8gbGlua3MgcGx1Z2luJyk7XG4gICAgfVxuXG4gICAgYWN0aW9uKHR5cGU6ICdsaW5rJyB8ICdyZWdleHAnIHwgJ2xpZ2h0c3BlZWQnKSB7XG4gICAgICAgIGlmICh0aGlzLmlzTGlua0hpbnRBY3RpdmUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFjdGl2ZVZpZXdPZlR5cGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KVxuICAgICAgICBjb25zdCBjdXJyZW50VmlldyA9IHRoaXMuY3VycmVudFZpZXcgPSBhY3RpdmVWaWV3T2ZUeXBlLmxlYWYudmlldztcbiAgICAgICAgY29uc3QgbW9kZSA9IHRoaXMubW9kZSA9IHRoaXMuZ2V0TW9kZSh0aGlzLmN1cnJlbnRWaWV3KTtcbiAgICAgICAgdGhpcy5jb250ZW50RWxlbWVudCA9IGFjdGl2ZVZpZXdPZlR5cGUuY29udGVudEVsXG4gICAgICAgIHRoaXMuY3Vyc29yQmVmb3JlSnVtcCA9IHRoaXMuY3VycmVudEN1cnNvcjtcblxuICAgICAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgVklFV19NT0RFLkxFR0FDWTpcbiAgICAgICAgICAgICAgICB0aGlzLmNtRWRpdG9yID0gKGN1cnJlbnRWaWV3IGFzIGFueSkuc291cmNlTW9kZS5jbUVkaXRvcjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgVklFV19NT0RFLkxJVkVfUFJFVklFVzpcbiAgICAgICAgICAgIGNhc2UgVklFV19NT0RFLlNPVVJDRTpcbiAgICAgICAgICAgICAgICB0aGlzLmNtRWRpdG9yID0gKDx7IGVkaXRvcj86IHsgY206IEVkaXRvclZpZXcgfSB9PmN1cnJlbnRWaWV3KS5lZGl0b3IuY207XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJsaW5rXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVKdW1wVG9MaW5rKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBjYXNlIFwicmVnZXhwXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVKdW1wVG9SZWdleCgpO1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgY2FzZSBcImxpZ2h0c3BlZWRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUxpZ2h0c3BlZWRKdW1wKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRNb2RlKGN1cnJlbnRWaWV3OiBWaWV3KTogVklFV19NT0RFIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBpc0xlZ2FjeSA9IHRoaXMuYXBwLnZhdWx0LmdldENvbmZpZyhcImxlZ2FjeUVkaXRvclwiKVxuXG4gICAgICAgIGlmIChjdXJyZW50Vmlldy5nZXRTdGF0ZSgpLm1vZGUgPT09ICdwcmV2aWV3Jykge1xuICAgICAgICAgICAgcmV0dXJuIFZJRVdfTU9ERS5QUkVWSUVXO1xuICAgICAgICB9IGVsc2UgaWYgKGlzTGVnYWN5KSB7XG4gICAgICAgICAgICByZXR1cm4gVklFV19NT0RFLkxFR0FDWTtcbiAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50Vmlldy5nZXRTdGF0ZSgpLm1vZGUgPT09ICdzb3VyY2UnKSB7XG4gICAgICAgICAgICBjb25zdCBpc0xpdmVQcmV2aWV3ID0gKDx7IGVkaXRvcj86IHsgY206IEVkaXRvclZpZXcgfSB9PmN1cnJlbnRWaWV3KS5lZGl0b3IuY20uc3RhdGUuZmllbGQoZWRpdG9yTGl2ZVByZXZpZXdGaWVsZClcbiAgICAgICAgICAgIGlmIChpc0xpdmVQcmV2aWV3KSByZXR1cm4gVklFV19NT0RFLkxJVkVfUFJFVklFVztcbiAgICAgICAgICAgIHJldHVybiBWSUVXX01PREUuU09VUkNFO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBoYW5kbGVKdW1wVG9MaW5rID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB7c2V0dGluZ3M6IHtsZXR0ZXJzfSB9ID0gdGhpc1xuXG4gICAgICAgIGNvbnN0IHsgbW9kZSwgY3VycmVudFZpZXcgfSA9IHRoaXM7XG5cbiAgICAgICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICAgICAgICBjYXNlIFZJRVdfTU9ERS5MRUdBQ1k6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbUVkaXRvciA9IHRoaXMuY21FZGl0b3IgYXMgRWRpdG9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNvdXJjZUxpbmtIaW50cyA9IG5ldyBMZWdhY3lTb3VyY2VMaW5rUHJvY2Vzc29yKGNtRWRpdG9yLCBsZXR0ZXJzKS5pbml0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVBY3Rpb25zKHNvdXJjZUxpbmtIaW50cyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFZJRVdfTU9ERS5MSVZFX1BSRVZJRVc6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbTZFZGl0b3IgPSB0aGlzLmNtRWRpdG9yIGFzIEVkaXRvclZpZXc7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJldmlld1ZpZXdFbDogSFRNTEVsZW1lbnQgPSAoY3VycmVudFZpZXcgYXMgYW55KS5jdXJyZW50TW9kZS5lZGl0b3IuY29udGFpbmVyRWw7XG4gICAgICAgICAgICAgICAgY29uc3QgW3ByZXZpZXdMaW5rSGludHMsIHNvdXJjZUxpbmtIaW50cywgbGlua0hpbnRIdG1sRWxlbWVudHNdID0gbmV3IExpdmVQcmV2aWV3TGlua1Byb2Nlc3NvcihwcmV2aWV3Vmlld0VsLCBjbTZFZGl0b3IsIGxldHRlcnMpLmluaXQoKTtcbiAgICAgICAgICAgICAgICBjbTZFZGl0b3IucGx1Z2luKHRoaXMubWFya1ZpZXdQbHVnaW4pLnNldExpbmtzKHNvdXJjZUxpbmtIaW50cyk7XG4gICAgICAgICAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLnVwZGF0ZU9wdGlvbnMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUFjdGlvbnMoWy4uLnByZXZpZXdMaW5rSGludHMsIC4uLnNvdXJjZUxpbmtIaW50c10sIGxpbmtIaW50SHRtbEVsZW1lbnRzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgVklFV19NT0RFLlBSRVZJRVc6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmV2aWV3Vmlld0VsOiBIVE1MRWxlbWVudCA9IChjdXJyZW50VmlldyBhcyBhbnkpLnByZXZpZXdNb2RlLmNvbnRhaW5lckVsLnF1ZXJ5U2VsZWN0b3IoJ2Rpdi5tYXJrZG93bi1wcmV2aWV3LXZpZXcnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwcmV2aWV3TGlua0hpbnRzID0gbmV3IFByZXZpZXdMaW5rUHJvY2Vzc29yKHByZXZpZXdWaWV3RWwsIGxldHRlcnMpLmluaXQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUFjdGlvbnMocHJldmlld0xpbmtIaW50cyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFZJRVdfTU9ERS5TT1VSQ0U6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjbTZFZGl0b3IgPSB0aGlzLmNtRWRpdG9yIGFzIEVkaXRvclZpZXc7XG4gICAgICAgICAgICAgICAgY29uc3QgbGl2ZVByZXZpZXdMaW5rcyA9IG5ldyBDTTZMaW5rUHJvY2Vzc29yKGNtNkVkaXRvciwgbGV0dGVycykuaW5pdCgpO1xuICAgICAgICAgICAgICAgIGNtNkVkaXRvci5wbHVnaW4odGhpcy5tYXJrVmlld1BsdWdpbikuc2V0TGlua3MobGl2ZVByZXZpZXdMaW5rcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLnVwZGF0ZU9wdGlvbnMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUFjdGlvbnMobGl2ZVByZXZpZXdMaW5rcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKlxuICAgICogIGNhc2VTZW5zaXRpdmUgaXMgb25seSBmb3IgbGlnaHRzcGVlZCBhbmQgc2hhbGwgbm90IGFmZmVjdCBqdW1wVG9Bbnl3aGVyZSwgc28gaXQgaXMgdHJ1ZVxuICAgICogIGJ5IGRlZmF1bHRcbiAgICAqL1xuICAgIGhhbmRsZUp1bXBUb1JlZ2V4ID0gKHN0cmluZ1RvU2VhcmNoPzogc3RyaW5nLCBjYXNlU2Vuc2l0aXZlOiBib29sZWFuID0gdHJ1ZSkgPT4ge1xuICAgICAgICBjb25zdCB7c2V0dGluZ3M6IHtsZXR0ZXJzLCBqdW1wVG9Bbnl3aGVyZVJlZ2V4fX0gPSB0aGlzXG4gICAgICAgIGNvbnN0IHdoYXRUb0xvb2tBdCA9IHN0cmluZ1RvU2VhcmNoIHx8IGp1bXBUb0FueXdoZXJlUmVnZXg7XG5cbiAgICAgICAgY29uc3QgeyBtb2RlIH0gPSB0aGlzXG5cbiAgICAgICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICAgICAgICBjYXNlIFZJRVdfTU9ERS5TT1VSQ0U6XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVNYXJrZG93blJlZ2V4KGxldHRlcnMsIHdoYXRUb0xvb2tBdCwgY2FzZVNlbnNpdGl2ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFZJRVdfTU9ERS5MSVZFX1BSRVZJRVc6XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVNYXJrZG93blJlZ2V4KGxldHRlcnMsIHdoYXRUb0xvb2tBdCwgY2FzZVNlbnNpdGl2ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgVklFV19NT0RFLlBSRVZJRVc6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFZJRVdfTU9ERS5MRUdBQ1k6XG4gICAgICAgICAgICAgICAgY29uc3QgY21FZGl0b3IgPSB0aGlzLmNtRWRpdG9yIGFzIEVkaXRvclxuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmtzID0gbmV3IExlZ2FjeVJlZ2V4cFByb2Nlc3NvcihjbUVkaXRvciwgd2hhdFRvTG9va0F0LCBsZXR0ZXJzLCBjYXNlU2Vuc2l0aXZlKS5pbml0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVBY3Rpb25zKGxpbmtzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGhhbmRsZU1hcmtkb3duUmVnZXggPSAobGV0dGVyczogc3RyaW5nLCB3aGF0VG9Mb29rQXQ6IHN0cmluZywgY2FzZVNlbnNpdGl2ZTogYm9vbGVhbikgPT4ge1xuICAgICAgICBjb25zdCBjbTZFZGl0b3IgPSB0aGlzLmNtRWRpdG9yIGFzIEVkaXRvclZpZXdcbiAgICAgICAgY29uc3QgbGl2ZVByZXZpZXdMaW5rcyA9IG5ldyBDTTZSZWdleFByb2Nlc3NvcihjbTZFZGl0b3IsIGxldHRlcnMsIHdoYXRUb0xvb2tBdCwgY2FzZVNlbnNpdGl2ZSkuaW5pdCgpO1xuICAgICAgICBjbTZFZGl0b3IucGx1Z2luKHRoaXMubWFya1ZpZXdQbHVnaW4pLnNldExpbmtzKGxpdmVQcmV2aWV3TGlua3MpO1xuICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2UudXBkYXRlT3B0aW9ucygpO1xuICAgICAgICB0aGlzLmhhbmRsZUFjdGlvbnMobGl2ZVByZXZpZXdMaW5rcyk7XG4gICAgfVxuXG4gICAgLy8gYWRhcHRlZCBmcm9tOiBodHRwczovL2dpdGh1Yi5jb20vbXJqYWNrcGhpbC9vYnNpZGlhbi1qdW1wLXRvLWxpbmsvaXNzdWVzLzM1I2lzc3VlY29tbWVudC0xMDg1OTA1NjY4XG4gICAgaGFuZGxlTGlnaHRzcGVlZEp1bXAoKSB7XG4gICAgICAgIC8vIGdldCBhbGwgdGV4dCBjb2xvclxuICAgICAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgICAgIGlmICghY29udGVudEVsKSB7cmV0dXJufVxuXG4gICAgICAgIC8vIHRoaXMgZWxlbWVudCBkb2Vzbid0IGV4aXN0IGluIGNtNS9oYXMgYSBkaWZmZXJlbnQgY2xhc3MsIHNvIGxpZ2h0c3BlZWQgd2lsbCBub3Qgd29yayBpbiBjbTVcbiAgICAgICAgY29uc3QgY29udGVudENvbnRhaW5lckNvbG9yID0gY29udGVudEVsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJjbS1jb250ZW50Q29udGFpbmVyXCIpO1xuICAgICAgICBjb25zdCBvcmlnaW5hbENvbG9yID0gKGNvbnRlbnRDb250YWluZXJDb2xvclswXSBhcyBIVE1MRWxlbWVudCkuc3R5bGUuY29sb3I7XG5cbiAgICAgICAgLy8gY2hhbmdlIGFsbCB0ZXh0IGNvbG9yIHRvIGdyYXlcbiAgICAgICAgKGNvbnRlbnRDb250YWluZXJDb2xvclswXSBhcyBIVE1MRWxlbWVudCkuc3R5bGUuY29sb3IgPSAndmFyKC0tanVtcC10by1saW5rLWxpZ2h0c3BlZWQtY29sb3IpJztcblxuICAgICAgICBjb25zdCBrZXlBcnJheTogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgZ3JhYktleSA9IChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgLy8gaGFuZGxlIEVzY2FwZSB0byByZWplY3QgdGhlIG1vZGVcbiAgICAgICAgICAgIGlmIChldmVudC5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgICAgICAgICAgICAgY29udGVudEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGdyYWJLZXksIHsgY2FwdHVyZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAoY29udGVudENvbnRhaW5lckNvbG9yWzBdIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5jb2xvciA9IG9yaWdpbmFsQ29sb3I7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHRlc3QgaWYga2V5cHJlc3MgaXMgY2FwaXRhbGl6ZWRcbiAgICAgICAgICAgIGlmICgvXltcXHdcXFNcXFddJC9pLnRlc3QoZXZlbnQua2V5KSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzQ2FwaXRhbCA9IGV2ZW50LnNoaWZ0S2V5O1xuICAgICAgICAgICAgICAgIGlmIChpc0NhcGl0YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FwdHVyZSB1cHBlcmNhc2VcbiAgICAgICAgICAgICAgICAgICAga2V5QXJyYXkucHVzaCgoZXZlbnQua2V5KS50b1VwcGVyQ2FzZSgpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBjYXB0dXJlIGxvd2VyY2FzZVxuICAgICAgICAgICAgICAgICAgICBrZXlBcnJheS5wdXNoKGV2ZW50LmtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzdG9wIHdoZW4gbGVuZ3RoIG9mIGFycmF5IGlzIGVxdWFsIHRvIDJcbiAgICAgICAgICAgIGlmIChrZXlBcnJheS5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdHJpbmdUb1NlYXJjaCA9IHRoaXMuc2V0dGluZ3MubGlnaHRzcGVlZEp1bXBUb1N0YXJ0T2ZXb3JkID8gXCJcXFxcYlwiICsga2V5QXJyYXkuam9pbihcIlwiKSA6IGtleUFycmF5LmpvaW4oXCJcIik7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUp1bXBUb1JlZ2V4KHN0cmluZ1RvU2VhcmNoLCB0aGlzLnNldHRpbmdzLmxpZ2h0c3BlZWRDYXNlU2Vuc2l0aXZlKTtcblxuICAgICAgICAgICAgICAgIC8vIHJlbW92aW5nIGV2ZW50TGlzdGVuZXIgYWZ0ZXIgcHJvY2VlZGVkXG4gICAgICAgICAgICAgICAgY29udGVudEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGdyYWJLZXksIHsgY2FwdHVyZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAoY29udGVudENvbnRhaW5lckNvbG9yWzBdIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5jb2xvciA9IG9yaWdpbmFsQ29sb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29udGVudEVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBncmFiS2V5LCB7IGNhcHR1cmU6IHRydWUgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlSG90a2V5KGhlbGRTaGlmdEtleTogYm9vbGVhbiwgbGluazogU291cmNlTGlua0hpbnQgfCBMaW5rSGludEJhc2UpIHtcbiAgICAgICAgaWYgKGxpbmsudHlwZSA9PT0gJ2ludGVybmFsJykge1xuICAgICAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKClcbiAgICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlIHNlY29uZCBhcmd1bWVudCBpcyBmb3IgdGhlIGxpbmsgcmVzb2x1dGlvblxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQoZGVjb2RlVVJJKGxpbmsubGlua1RleHQpLCBmaWxlLnBhdGgsIGhlbGRTaGlmdEtleSwge2FjdGl2ZTogdHJ1ZX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGxpbmsudHlwZSA9PT0gJ2V4dGVybmFsJykge1xuICAgICAgICAgICAgd2luZG93Lm9wZW4obGluay5saW5rVGV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmNtRWRpdG9yO1xuICAgICAgICAgICAgaWYgKGVkaXRvciBpbnN0YW5jZW9mIEVkaXRvclZpZXcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IChsaW5rIGFzIFNvdXJjZUxpbmtIaW50KS5pbmRleDtcbiAgICAgICAgICAgICAgICBjb25zdCB7dmltTW9kZSwgYW5jaG9yfSA9IHRoaXMuY3Vyc29yQmVmb3JlSnVtcDtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VTZWxlY3Rpb24gPSBoZWxkU2hpZnRLZXkgfHwgKHZpbU1vZGUgPT09ICd2aXN1YWwnIHx8IHZpbU1vZGUgPT09ICd2aXN1YWwgYmxvY2snKVxuXG4gICAgICAgICAgICAgICAgaWYgKHVzZVNlbGVjdGlvbiAmJiBhbmNob3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZGlzcGF0Y2goe3NlbGVjdGlvbjogRWRpdG9yU2VsZWN0aW9uLnJhbmdlKGFuY2hvciwgaW5kZXgpfSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZGlzcGF0Y2goeyBzZWxlY3Rpb246IEVkaXRvclNlbGVjdGlvbi5jdXJzb3IoaW5kZXgpIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlZGl0b3Iuc2V0Q3Vyc29yKGVkaXRvci5wb3NGcm9tSW5kZXgoKDxTb3VyY2VMaW5rSGludD5saW5rKS5pbmRleCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVtb3ZlUG9wb3ZlcnMobGlua0hpbnRIdG1sRWxlbWVudHM6IEhUTUxFbGVtZW50W10gfCB1bmRlZmluZWQgPSBbXSkge1xuICAgICAgICBjb25zdCBjdXJyZW50VmlldyA9IHRoaXMuY29udGVudEVsZW1lbnQ7XG5cbiAgICAgICAgY3VycmVudFZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnJlbW92ZVBvcG92ZXJzKGxpbmtIaW50SHRtbEVsZW1lbnRzKSlcbiAgICAgICAgbGlua0hpbnRIdG1sRWxlbWVudHM/LmZvckVhY2goZSA9PiBlLnJlbW92ZSgpKTtcbiAgICAgICAgY3VycmVudFZpZXcucXVlcnlTZWxlY3RvckFsbCgnLmpsLnBvcG92ZXInKS5mb3JFYWNoKGUgPT4gZS5yZW1vdmUoKSk7XG5cbiAgICAgICAgdGhpcy5wcmVmaXhJbmZvID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAodGhpcy5tb2RlID09IFZJRVdfTU9ERS5TT1VSQ0UgfHwgdGhpcy5tb2RlID09IFZJRVdfTU9ERS5MSVZFX1BSRVZJRVcpIHtcbiAgICAgICAgICAgICh0aGlzLmNtRWRpdG9yIGFzIEVkaXRvclZpZXcpLnBsdWdpbih0aGlzLm1hcmtWaWV3UGx1Z2luKS5jbGVhbigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS51cGRhdGVPcHRpb25zKCk7XG4gICAgICAgIHRoaXMuaXNMaW5rSGludEFjdGl2ZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJlbW92ZVBvcG92ZXJzV2l0aG91dFByZWZpeEV2ZW50S2V5KGV2ZW50S2V5OiBzdHJpbmcsIGxpbmtIaW50SHRtbEVsZW1lbnRzOiBIVE1MRWxlbWVudFtdIHwgdW5kZWZpbmVkID0gW10pIHtcbiAgICAgICAgY29uc3QgY3VycmVudFZpZXcgPSB0aGlzLmNvbnRlbnRFbGVtZW50O1xuXG4gICAgICAgIGxpbmtIaW50SHRtbEVsZW1lbnRzPy5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgICAgaWYgKGUuaW5uZXJIVE1MLmxlbmd0aCA9PSAyICYmIGUuaW5uZXJIVE1MWzBdID09IGV2ZW50S2V5KSB7XG4gICAgICAgICAgICAgICAgZS5jbGFzc0xpc3QuYWRkKFwibWF0Y2hlZFwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGUucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGN1cnJlbnRWaWV3LnF1ZXJ5U2VsZWN0b3JBbGwoJy5qbC5wb3BvdmVyJykuZm9yRWFjaChlID0+IHtcbiAgICAgICAgICAgIGlmIChlLmlubmVySFRNTC5sZW5ndGggPT0gMiAmJiBlLmlubmVySFRNTFswXSA9PSBldmVudEtleSkge1xuICAgICAgICAgICAgICAgIGUuY2xhc3NMaXN0LmFkZChcIm1hdGNoZWRcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlLnJlbW92ZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5tb2RlID09IFZJRVdfTU9ERS5TT1VSQ0UgfHwgdGhpcy5tb2RlID09IFZJRVdfTU9ERS5MSVZFX1BSRVZJRVcpIHtcbiAgICAgICAgICAgICh0aGlzLmNtRWRpdG9yIGFzIEVkaXRvclZpZXcpLnBsdWdpbih0aGlzLm1hcmtWaWV3UGx1Z2luKS5maWx0ZXJXaXRoRXZlbnRLZXkoZXZlbnRLZXkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS51cGRhdGVPcHRpb25zKCk7XG4gICAgfVxuXG4gICAgaGFuZGxlQWN0aW9ucyhsaW5rSGludHM6IExpbmtIaW50QmFzZVtdLCBsaW5rSGludEh0bWxFbGVtZW50cz86IEhUTUxFbGVtZW50W10pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgY29udGVudEVsZW1lbnQgPSB0aGlzLmNvbnRlbnRFbGVtZW50XG4gICAgICAgIGlmICghbGlua0hpbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGlua0hpbnRNYXA6IHsgW2xldHRlcjogc3RyaW5nXTogTGlua0hpbnRCYXNlIH0gPSB7fTtcbiAgICAgICAgbGlua0hpbnRzLmZvckVhY2goeCA9PiBsaW5rSGludE1hcFt4LmxldHRlcl0gPSB4KTtcblxuICAgICAgICBjb25zdCBoYW5kbGVLZXlEb3duID0gKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoWydTaGlmdCcsICdDb250cm9sJywgJ0NhcHNMb2NrJywgJ1Njcm9sbExvY2snLCAnR3JvdXBOZXh0JywgJ01ldGEnXS5pbmNsdWRlcyhldmVudC5rZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBldmVudEtleSA9IGV2ZW50LmtleS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgY29uc3QgcHJlZml4ZXMgPSBuZXcgU2V0KE9iamVjdC5rZXlzKGxpbmtIaW50TWFwKS5maWx0ZXIoeCA9PiB4Lmxlbmd0aCA+IDEpLm1hcCh4ID0+IHhbMF0pKTtcblxuICAgICAgICAgICAgbGV0IGxpbmtIaW50OiBMaW5rSGludEJhc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmVmaXhJbmZvKSB7XG4gICAgICAgICAgICAgICAgbGlua0hpbnQgPSBsaW5rSGludE1hcFt0aGlzLnByZWZpeEluZm8ucHJlZml4ICsgZXZlbnRLZXldO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaW5rSGludCA9IGxpbmtIaW50TWFwW2V2ZW50S2V5XTtcbiAgICAgICAgICAgICAgICBpZiAoIWxpbmtIaW50ICYmIHByZWZpeGVzICYmIHByZWZpeGVzLmhhcyhldmVudEtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmVmaXhJbmZvID0ge3ByZWZpeDogZXZlbnRLZXksIHNoaWZ0S2V5OiBldmVudC5zaGlmdEtleX07XG5cbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlUG9wb3ZlcnNXaXRob3V0UHJlZml4RXZlbnRLZXkoZXZlbnRLZXksIGxpbmtIaW50SHRtbEVsZW1lbnRzKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgY29uc3QgaGVsZFNoaWZ0S2V5ID0gdGhpcy5wcmVmaXhJbmZvPy5zaGlmdEtleSB8fCBldmVudC5zaGlmdEtleTtcblxuICAgICAgICAgICAgbGlua0hpbnQgJiYgdGhpcy5oYW5kbGVIb3RrZXkoaGVsZFNoaWZ0S2V5LCBsaW5rSGludCk7XG5cbiAgICAgICAgICAgIHRoaXMucmVtb3ZlUG9wb3ZlcnMobGlua0hpbnRIdG1sRWxlbWVudHMpO1xuICAgICAgICAgICAgY29udGVudEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZUtleURvd24sIHsgY2FwdHVyZTogdHJ1ZSB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAobGlua0hpbnRzLmxlbmd0aCA9PT0gMSAmJiB0aGlzLnNldHRpbmdzLmp1bXBUb0xpbmtJZk9uZUxpbmtPbmx5KSB7XG4gICAgICAgICAgICBjb25zdCBoZWxkU2hpZnRLZXkgPSB0aGlzLnByZWZpeEluZm8/LnNoaWZ0S2V5O1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVIb3RrZXkoaGVsZFNoaWZ0S2V5LCBsaW5rSGludHNbMF0pO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVQb3BvdmVycyhsaW5rSGludEh0bWxFbGVtZW50cyk7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRlbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5yZW1vdmVQb3BvdmVycyhsaW5rSGludEh0bWxFbGVtZW50cykpXG4gICAgICAgIGNvbnRlbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlEb3duLCB7IGNhcHR1cmU6IHRydWUgfSk7XG4gICAgICAgIHRoaXMuaXNMaW5rSGludEFjdGl2ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29kZU1pcnJvcidzIHZpbSBhdXRvbWF0aWNhbGx5IGV4aXRzIHZpc3VhbCBtb2RlIHdoZW4gZXhlY3V0aW5nIGEgY29tbWFuZC5cbiAgICAgKiBUaGlzIGtlZXBzIHRyYWNrIG9mIHNlbGVjdGlvbiBjaGFuZ2VzIHNvIHdlIGNhbiByZXN0b3JlIHRoZSBzZWxlY3Rpb24uXG4gICAgICpcbiAgICAgKiBUaGlzIGlzIHRoZSBzYW1lIGFwcHJvYWNoIHRha2VuIGJ5IHRoZSBvYnNpZGlhbi12aW1yYy1wbHVnaW5cbiAgICAgKi9cbiAgICB3YXRjaEZvclNlbGVjdGlvbkNoYW5nZSgpIHtcbiAgICAgICAgY29uc3QgdXBkYXRlU2VsZWN0aW9uID0gdGhpcy51cGRhdGVTZWxlY3Rpb24uYmluZCh0aGlzKVxuICAgICAgICBjb25zdCB3YXRjaEZvckNoYW5nZXMgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpPy5lZGl0b3I7XG4gICAgICAgICAgICBjb25zdCBjbTogRWRpdG9yIHwgdW5kZWZpbmVkID0gKGVkaXRvciBhcyBhbnkpPy5jbT8uY207XG5cbiAgICAgICAgICAgIGlmIChjbSAmJiAhKGNtIGFzIGFueSkuX2hhbmRsZXJzLmN1cnNvckFjdGl2aXR5LmluY2x1ZGVzKHVwZGF0ZVNlbGVjdGlvbikpIHtcbiAgICAgICAgICAgICAgICBjbS5vbihcImN1cnNvckFjdGl2aXR5XCIsIHVwZGF0ZVNlbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlcigoKSA9PiBjbS5vZmYoXCJjdXJzb3JBY3Rpdml0eVwiLCB1cGRhdGVTZWxlY3Rpb24pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiYWN0aXZlLWxlYWYtY2hhbmdlXCIsIHdhdGNoRm9yQ2hhbmdlcykpO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsIHdhdGNoRm9yQ2hhbmdlcykpO1xuICAgICAgICB3YXRjaEZvckNoYW5nZXMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVTZWxlY3Rpb24oZWRpdG9yOiBFZGl0b3IpIHtcbiAgICAgICAgY29uc3QgYW5jaG9yID0gZWRpdG9yLmxpc3RTZWxlY3Rpb25zKClbMF0/LmFuY2hvclxuICAgICAgICB0aGlzLmN1cnJlbnRDdXJzb3IgPSB7XG4gICAgICAgICAgICBhbmNob3I6IGFuY2hvciA/IGVkaXRvci5pbmRleEZyb21Qb3MoYW5jaG9yKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHZpbU1vZGU6IGVkaXRvci5zdGF0ZS52aW0/Lm1vZGVcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICAgIHBsdWdpbjogSnVtcFRvTGlua1xuXG4gICAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogSnVtcFRvTGluaykge1xuICAgICAgICBzdXBlcihhcHAsIHBsdWdpbilcblxuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpblxuICAgIH1cblxuICAgIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgICAgIGxldCB7Y29udGFpbmVyRWx9ID0gdGhpcztcblxuICAgICAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHt0ZXh0OiAnU2V0dGluZ3MgZm9yIEp1bXAgVG8gTGluay4nfSk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZSgnQ2hhcmFjdGVycyB1c2VkIGZvciBsaW5rIGhpbnRzJylcbiAgICAgICAgICAgIC5zZXREZXNjKCdUaGUgY2hhcmFjdGVycyBwbGFjZWQgbmV4dCB0byBlYWNoIGxpbmsgYWZ0ZXIgZW50ZXIgbGluay1oaW50IG1vZGUuJylcbiAgICAgICAgICAgIC5hZGRUZXh0KGNiID0+IHtcbiAgICAgICAgICAgICAgICBjYi5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5sZXR0ZXJzKVxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmxldHRlcnMgPSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5wbHVnaW4uc2V0dGluZ3MpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKCdKdW1wIFRvIEFueXdoZXJlJylcbiAgICAgICAgICAgIC5zZXREZXNjKFwiUmVnZXggYmFzZWQgbmF2aWdhdGluZyBpbiBlZGl0b3IgbW9kZVwiKVxuICAgICAgICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgICAgICAgICAgdGV4dFxuICAgICAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoJ0N1c3RvbSBSZWdleCcpXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5qdW1wVG9Bbnl3aGVyZVJlZ2V4KVxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5qdW1wVG9Bbnl3aGVyZVJlZ2V4ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlRGF0YSh0aGlzLnBsdWdpbi5zZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoJ0xpZ2h0c3BlZWQgcmVnZXggY2FzZSBzZW5zaXRpdml0eScpXG4gICAgICAgICAgICAuc2V0RGVzYyhcbiAgICAgICAgICAgICAgICAnSWYgZW5hYmxlZCwgdGhlIHJlZ2V4IGZvciBtYXRjaGluZyB3aWxsIGJlIGNhc2Ugc2Vuc2l0aXZlLidcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5saWdodHNwZWVkQ2FzZVNlbnNpdGl2ZSlcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jIChzdGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5saWdodHNwZWVkQ2FzZVNlbnNpdGl2ZSA9IHN0YXRlO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlRGF0YSh0aGlzLnBsdWdpbi5zZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgICAgIC5zZXROYW1lKCdKdW1wIHRvIExpbmsgSWYgT25seSBPbmUgTGluayBJbiBQYWdlJylcbiAgICAgICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgICAgICAgICdJZiBlbmFibGVkLCBhdXRvIGp1bXAgdG8gbGluayBpZiB0aGVyZSBpcyBvbmx5IG9uZSBsaW5rIGluIHBhZ2UnXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuanVtcFRvTGlua0lmT25lTGlua09ubHkpXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAoc3RhdGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuanVtcFRvTGlua0lmT25lTGlua09ubHkgPSBzdGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZSgnTGlnaHRzcGVlZCBvbmx5IGp1bXBzIHRvIHN0YXJ0IG9mIHdvcmRzJylcbiAgICAgICAgICAgIC5zZXREZXNjKFxuICAgICAgICAgICAgICAgICdJZiBlbmFibGVkLCBsaWdodHNwZWVkIGp1bXBzIHdpbGwgb25seSB0YXJnZXQgY2hhcmFjdGVycyBvY2N1cmluZyBhdCB0aGUgc3RhcnQgb2Ygd29yZHMuJ1xuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgICAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmxpZ2h0c3BlZWRKdW1wVG9TdGFydE9mV29yZClcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jIChzdGF0ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5saWdodHNwZWVkSnVtcFRvU3RhcnRPZldvcmQgPSBzdGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxufVxuIl0sIm5hbWVzIjpbIldpZGdldFR5cGUiLCJEZWNvcmF0aW9uIiwiUGx1Z2luIiwiVmlld1BsdWdpbiIsIk1hcmtkb3duVmlldyIsImVkaXRvckxpdmVQcmV2aWV3RmllbGQiLCJFZGl0b3JWaWV3IiwiRWRpdG9yU2VsZWN0aW9uIiwiUGx1Z2luU2V0dGluZ1RhYiIsIlNldHRpbmciXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFvR0E7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7QUFDaEgsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDL0QsUUFBUSxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0FBQ25HLFFBQVEsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0FBQ3RHLFFBQVEsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFO0FBQ3RILFFBQVEsSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFVBQVUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQzlFLEtBQUssQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQWdNRDtBQUN1QixPQUFPLGVBQWUsS0FBSyxVQUFVLEdBQUcsZUFBZSxHQUFHLFVBQVUsS0FBSyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUU7QUFDdkgsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQixJQUFJLE9BQU8sQ0FBQyxDQUFDLElBQUksR0FBRyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUMsVUFBVSxHQUFHLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFDckY7O01DNVNhLFFBQVEsQ0FBQTtBQUFyQixJQUFBLFdBQUEsR0FBQTs7UUFFQyxJQUFPLENBQUEsT0FBQSxHQUFXLGdCQUFnQixDQUFDO1FBQ25DLElBQW1CLENBQUEsbUJBQUEsR0FBVyxlQUFlLENBQUM7UUFDOUMsSUFBdUIsQ0FBQSx1QkFBQSxHQUFZLEtBQUssQ0FBQztRQUN6QyxJQUF1QixDQUFBLHVCQUFBLEdBQVksSUFBSSxDQUFDO1FBQ3hDLElBQTJCLENBQUEsMkJBQUEsR0FBWSxJQUFJLENBQUM7S0FDNUM7QUFBQTs7QUN2QkssTUFBTyxVQUFXLFNBQVFBLGVBQVUsQ0FBQTtBQUN0QyxJQUFBLFdBQUEsQ0FBcUIsSUFBWSxFQUFXLElBQVksRUFBVyxlQUF1QixFQUFBO0FBQ3RGLFFBQUEsS0FBSyxFQUFFLENBQUM7UUFEUyxJQUFJLENBQUEsSUFBQSxHQUFKLElBQUksQ0FBUTtRQUFXLElBQUksQ0FBQSxJQUFBLEdBQUosSUFBSSxDQUFRO1FBQVcsSUFBZSxDQUFBLGVBQUEsR0FBZixlQUFlLENBQVE7S0FFekY7QUFFRCxJQUFBLEVBQUUsQ0FBQyxLQUFpQixFQUFBO0FBQ2hCLFFBQUEsT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDO0tBQ3BGO0lBRUQsS0FBSyxHQUFBO1FBQ0QsTUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsRCxRQUFBLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUUzQixNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BELFFBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDO0FBQ3ZDLFFBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO0FBQ3BDLFFBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QyxRQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2pDLElBQUksSUFBSSxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUU7QUFDaEcsWUFBQSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNwQyxTQUFBO0FBQ0QsUUFBQSxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRXJCLFFBQUEsT0FBTyxPQUFPLENBQUM7S0FDbEI7SUFFRCxXQUFXLEdBQUE7QUFDUCxRQUFBLE9BQU8sS0FBSyxDQUFDO0tBQ2hCO0FBQ0o7O01DdkJZLFVBQVUsQ0FBQTtBQUtuQixJQUFBLFdBQUEsQ0FBWSxLQUFpQixFQUFBO1FBSDdCLElBQUssQ0FBQSxLQUFBLEdBQXFCLEVBQUUsQ0FBQztRQUM3QixJQUFlLENBQUEsZUFBQSxHQUF1QixTQUFTLENBQUM7QUFHNUMsUUFBQSxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNoQixRQUFBLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO0FBQ2pDLFFBQUEsSUFBSSxDQUFDLFdBQVcsR0FBR0MsZUFBVSxDQUFDLElBQUksQ0FBQTtLQUNyQztBQUVELElBQUEsUUFBUSxDQUFDLEtBQXVCLEVBQUE7QUFDNUIsUUFBQSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNuQixRQUFBLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO0tBQ3BDO0lBRUQsS0FBSyxHQUFBO0FBQ0QsUUFBQSxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNoQixRQUFBLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDO0tBQ3BDO0FBRUQsSUFBQSxrQkFBa0IsQ0FBQyxRQUFnQixFQUFBO0FBQy9CLFFBQUEsSUFBSSxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUM7WUFBRSxPQUFPO1FBRWpDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFHO1lBQy9CLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLElBQUksUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ3RGLFNBQUMsQ0FBQyxDQUFDO0FBRUgsUUFBQSxJQUFJLENBQUMsZUFBZSxHQUFHLFFBQVEsQ0FBQztLQUNuQztBQUVELElBQUEsSUFBSSxPQUFPLEdBQUE7QUFDUCxRQUFBLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0tBQ2hDO0FBRUQsSUFBQSxNQUFNLENBQUMsT0FBbUIsRUFBQTtBQUN0QixRQUFBLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUM3QkEsZUFBVSxDQUFDLE1BQU0sQ0FBQztBQUNkLFlBQUEsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDO0FBQzlELFlBQUEsSUFBSSxFQUFFLENBQUM7U0FDVixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FDcEIsQ0FBQztRQUVGLElBQUksQ0FBQyxXQUFXLEdBQUdBLGVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7S0FDN0M7QUFDSjs7QUNuREQ7Ozs7QUFJRztBQUNHLFNBQVUsa0JBQWtCLENBQUMsUUFBZ0IsRUFBQTtBQUMvQyxJQUFBLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUM1QyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN4RSxJQUFBLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxDQUFBO0FBQzNHLElBQUEsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUE7QUFDM0QsSUFBQSxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFDLENBQUMsQ0FBQTtBQUUxRSxJQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUM7QUFDL0IsQ0FBQztBQUVEOzs7O0FBSUc7QUFDYSxTQUFBLGtCQUFrQixDQUFDLFFBQWdCLEVBQUUsWUFBb0IsRUFBQTtBQUNyRSxJQUFBLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBRWhELElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxZQUFZLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxLQUFLLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBOztJQUd2RyxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDdkMsV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTlELE1BQU0sUUFBUSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU5RSxNQUFNLGVBQWUsR0FBRyxFQUFFLENBQUE7QUFDMUIsSUFBQSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0QyxRQUFBLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUMxQixRQUFBLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDL0MsWUFBQSxJQUFJLGVBQWUsQ0FBQyxNQUFNLEdBQUcsWUFBWSxFQUFFO0FBQ3ZDLGdCQUFBLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLE1BQU0sS0FBSyxFQUFFLEVBQUU7QUFDZixvQkFBQSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUM1Qix3QkFBQSxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2hDLHFCQUFBO0FBQ0osaUJBQUE7QUFBTSxxQkFBQTtBQUNILG9CQUFBLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFBO0FBQ3hDLGlCQUFBO0FBQ0osYUFBQTtBQUFNLGlCQUFBO2dCQUNILE1BQU07QUFDVCxhQUFBO0FBQ0osU0FBQTtBQUNKLEtBQUE7QUFFRCxJQUFBLE9BQU8sZUFBZSxDQUFDO0FBQzNCLENBQUM7U0FFZSxjQUFjLENBQUMsT0FBZSxFQUFFLE1BQWMsRUFBRSxPQUFlLEVBQUE7OztJQUUzRSxNQUFNLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQzs7SUFFN0MsTUFBTSxlQUFlLEdBQUcscUNBQXFDLENBQUM7O0lBRTlELE1BQU0sYUFBYSxHQUFHLGlDQUFpQyxDQUFDOztJQUV4RCxNQUFNLFFBQVEsR0FBRywrQkFBK0IsQ0FBQztBQUdqRCxJQUFBLElBQUksT0FBTyxHQUFHLElBQUksR0FBRyxFQUFVLENBQUE7SUFDL0IsSUFBSSxjQUFjLEdBQWtCLEVBQUUsQ0FBQztBQUN2QyxJQUFBLElBQUksV0FBVyxDQUFDO0FBRWhCLElBQUEsTUFBTSxjQUFjLEdBQUcsQ0FBQyxJQUFpQixLQUFJO0FBQ3pDLFFBQUEsSUFBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFBRSxPQUFNO0FBQ2xDLFFBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDdkIsUUFBQSxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQzdCLEtBQUMsQ0FBQTtJQUVELE9BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDN0MsTUFBTSxRQUFRLEdBQUcsQ0FBQSxFQUFBLEdBQUEsV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLElBQUksRUFBRSxDQUFDO0FBQ3hDLFFBQUEsY0FBYyxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxLQUFLLEdBQUcsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUNyRixLQUFBOztJQUdELE9BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDN0MsUUFBQSxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsUUFBQSxjQUFjLENBQUMsRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLEtBQUssR0FBRyxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFBO0FBQ3BGLEtBQUE7SUFFRCxPQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQy9DLFFBQUEsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLFFBQUEsY0FBYyxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxLQUFLLEdBQUcsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUNyRixLQUFBO0lBRUQsT0FBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUN4QyxRQUFBLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQyxRQUFBLGNBQWMsQ0FBQyxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsS0FBSyxHQUFHLE1BQU0sR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFBO0FBQ3hGLEtBQUE7SUFFRCxNQUFNLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTNFLE1BQU0sZUFBZSxHQUFxQixFQUFFLENBQUM7SUFDN0MsY0FBYztBQUNULFNBQUEsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDaEMsU0FBQSxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFJO0FBQ3JCLFFBQUEsZUFBZSxDQUFDLElBQUksQ0FBRyxNQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBQSxFQUFLLFFBQVEsQ0FBQSxDQUFFLENBQUM7QUFDckUsS0FBQyxDQUFDLENBQUM7QUFFUCxJQUFBLE9BQU8sZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUFFZSxTQUFBLG1CQUFtQixDQUFDLE9BQWUsRUFBRSxJQUFZLEVBQUE7SUFDN0QsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN2RCxJQUFBLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBQyxJQUFJLENBQUMsQ0FBQztBQUNyQyxJQUFBLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3BDLElBQUEsVUFBVSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUM7QUFDL0IsSUFBQSxPQUFPLFVBQVUsQ0FBQztBQUN0QixDQUFDO0FBRWUsU0FBQSxxQkFBcUIsQ0FBQyxRQUFnQixFQUFFLFVBQTRCLEVBQUE7QUFDaEYsSUFBQSxNQUFNLFVBQVUsR0FBRyxDQUFDLFFBQWdCLEVBQUUsUUFBd0IsS0FBSTtRQUM5RCxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7UUFFbEQsT0FBUSxRQUFnQixDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsbUJBQW1CLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2hILEtBQUMsQ0FBQTtBQUVELElBQUEsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JEOztBQzNIYyxNQUFPLGdCQUFnQixDQUFBO0lBSWpDLFdBQVksQ0FBQSxNQUFrQixFQUFFLFFBQWdCLEVBQUE7UUErQnhDLElBQWtCLENBQUEsa0JBQUEsR0FBRyxNQUF1QjtBQUNoRCxZQUFBLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFDekIsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFbEQsT0FBTyxjQUFjLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNuRCxTQUFDLENBQUE7QUFuQ0csUUFBQSxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztBQUN2QixRQUFBLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDO0tBQzNCO0lBRU0sSUFBSSxHQUFBO0FBQ1AsUUFBQSxPQUFPLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0tBQ3BDO0lBRU0sZUFBZSxHQUFBOztBQUNsQixRQUFBLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFFMUIsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDOzs7UUFJckMsSUFBSSxDQUFBLEVBQUEsR0FBQSxNQUFBLFFBQVEsQ0FBQyxTQUFTLE1BQUUsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsYUFBYSxNQUFFLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLEdBQUcsRUFBRTs7WUFFeEMsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFBOztBQUUzRCxZQUFBLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFBOztZQUc5QyxJQUFJLEdBQUcsTUFBQSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFFLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLElBQUksQ0FBQTtBQUNsRSxTQUFBO0FBRUQsUUFBQSxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFFbEQsUUFBQSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQztLQUNuQztBQVFKOztBQzFDSyxTQUFVLG1CQUFtQixDQUFDLE9BQWUsRUFBRSxNQUFjLEVBQUUsTUFBYyxFQUFFLE9BQWUsRUFBRSxhQUFzQixFQUFBO0lBQ3hILE1BQU0sUUFBUSxHQUFHLGFBQWEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRXBGLElBQUksY0FBYyxHQUlaLEVBQUUsQ0FBQztBQUVULElBQUEsSUFBSSxXQUFXLENBQUM7SUFFaEIsUUFBUSxXQUFXLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRztBQUMzQyxRQUFBLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxjQUFjLENBQUMsSUFBSSxDQUFDO0FBQ2hCLFlBQUEsS0FBSyxFQUFFLFdBQVcsQ0FBQyxLQUFLLEdBQUcsTUFBTTtBQUNqQyxZQUFBLElBQUksRUFBRSxPQUFPO1lBQ2IsUUFBUTtBQUNYLFNBQUEsQ0FBQyxDQUFDO0FBQ04sS0FBQTtJQUVELE1BQU0sZUFBZSxHQUFHLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFM0UsTUFBTSxlQUFlLEdBQXFCLEVBQUUsQ0FBQztJQUM3QyxjQUFjO0FBQ1QsU0FBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNqQyxTQUFBLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUk7QUFDckIsUUFBQSxlQUFlLENBQUMsSUFBSSxDQUNoQixNQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBQSxFQUN2QixRQUFRLENBQUEsQ0FDYixDQUFDO0FBQ1AsS0FBQyxDQUFDLENBQUM7QUFFUCxJQUFBLE9BQU8sZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZEOztBQy9CcUIsTUFBQSxpQkFBa0IsU0FBUSxnQkFBZ0IsQ0FBQTtBQUczRCxJQUFBLFdBQUEsQ0FBWSxNQUFrQixFQUFFLFFBQWdCLEVBQUUsTUFBYyxFQUFFLGFBQXNCLEVBQUE7QUFDcEYsUUFBQSxLQUFLLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3hCLFFBQUEsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDckIsUUFBQSxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztLQUN0QztJQUVELElBQUksR0FBQTtBQUNBLFFBQUEsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDakMsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDbEQsUUFBQSxPQUFPLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7S0FDbkY7QUFDSjs7QUNkYSxNQUFPLHFCQUFxQixDQUFBO0FBTXRDLElBQUEsV0FBQSxDQUFZLFFBQWdCLEVBQUUsTUFBYyxFQUFFLFFBQWdCLEVBQUUsYUFBc0IsRUFBQTtBQUNsRixRQUFBLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQ3pCLFFBQUEsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDckIsUUFBQSxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztBQUN4QixRQUFBLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO0tBQ3RDO0lBRU0sSUFBSSxHQUFBO1FBQ1AsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNuRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUU3QyxRQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEIsUUFBQSxPQUFPLEtBQUssQ0FBQztLQUNoQjtJQUVPLGlCQUFpQixHQUFBO0FBQ3JCLFFBQUEsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQztRQUMxQixNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxHQUFHLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRXpELFFBQUEsT0FBTyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM1QjtJQUVPLFFBQVEsQ0FBQyxPQUFlLEVBQUUsTUFBYyxFQUFBO0FBQzVDLFFBQUEsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUE7QUFDaEMsUUFBQSxPQUFPLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7S0FDcEY7QUFFTyxJQUFBLE9BQU8sQ0FBQyxLQUF1QixFQUFBO0FBQ25DLFFBQUEsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQTtBQUN6QixRQUFBLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMxQztBQUNKOztBQ3RDYSxNQUFPLHlCQUF5QixDQUFBO0lBSTFDLFdBQVksQ0FBQSxNQUFjLEVBQUUsUUFBZ0IsRUFBQTtBQWNwQyxRQUFBLElBQUEsQ0FBQSxrQkFBa0IsR0FBRyxDQUFDLFFBQWdCLEtBQXNCO0FBQ2hFLFlBQUEsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztZQUN6QixNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxHQUFHLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXpELE9BQU8sY0FBYyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDcEQsU0FBQyxDQUFBO0FBbEJHLFFBQUEsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7QUFDdkIsUUFBQSxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztLQUMzQjtJQUVNLElBQUksR0FBQTtBQUNQLFFBQUEsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQztRQUUxQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDcEQsUUFBQSxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFFM0MsUUFBQSxPQUFPLFNBQVMsQ0FBQztLQUNwQjtBQVFKOztBQ3pCZSxTQUFBLG1CQUFtQixDQUFDLGFBQTBCLEVBQUUsT0FBZSxFQUFBO0lBQzNFLE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN0RCxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUVuRSxNQUFNLFNBQVMsR0FBc0IsRUFBRSxDQUFDO0lBQ3hDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFJOztBQUMvQixRQUFBLElBQUksd0JBQXdCLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxFQUFFO1lBQ25ELE9BQU07QUFDVCxTQUFBO1FBRUQsTUFBTSxRQUFRLEdBQWlCLFFBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQztBQUN2RSxjQUFFLFVBQVU7Y0FDVixVQUFVLENBQUM7QUFFakIsUUFBQSxNQUFNLFFBQVEsR0FBRyxRQUFRLEtBQUssVUFBVTtjQUNsQyxDQUFBLEVBQUEsR0FBQSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxHQUFJLFFBQVEsQ0FBQyxJQUFJO0FBQzNDLGNBQUUsUUFBUSxDQUFDLElBQUksQ0FBQztBQUVwQixRQUFBLElBQUksWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUEyQixDQUFDO0FBQ3hELFFBQUEsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQztBQUM3QixRQUFBLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUM7QUFFL0IsUUFBQSxPQUFPLFlBQVksRUFBRTtZQUNqQixJQUFJLFlBQVksSUFBSSxhQUFhLEVBQUU7Z0JBQy9CLFlBQVksR0FBRyxTQUFTLENBQUM7QUFDNUIsYUFBQTtBQUFNLGlCQUFBO0FBQ0gsZ0JBQUEsR0FBRyxJQUFJLFlBQVksQ0FBQyxTQUFTLENBQUM7QUFDOUIsZ0JBQUEsSUFBSSxJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUM7QUFDaEMsZ0JBQUEsWUFBWSxHQUFHLFlBQVksQ0FBQyxZQUEyQixDQUFDO0FBQzNELGFBQUE7QUFDSixTQUFBO1FBQ0QsU0FBUyxDQUFDLElBQUksQ0FBQztBQUNYLFlBQUEsV0FBVyxFQUFFLFFBQVE7QUFDckIsWUFBQSxNQUFNLEVBQUUsRUFBRTtBQUNWLFlBQUEsUUFBUSxFQUFFLFFBQVE7QUFDbEIsWUFBQSxJQUFJLEVBQUUsUUFBUTtBQUNkLFlBQUEsR0FBRyxFQUFFLEdBQUc7QUFDUixZQUFBLElBQUksRUFBRSxJQUFJO0FBQ2IsU0FBQSxDQUFDLENBQUM7QUFDUCxLQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFJO1FBQzdCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0MsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBZ0IsQ0FBQztRQUU1RSxJQUFJLFFBQVEsSUFBSSxNQUFNLEVBQUU7QUFDcEIsWUFBQSxJQUFJLHdCQUF3QixDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsRUFBRTtnQkFDakQsT0FBTTtBQUNULGFBQUE7QUFFRCxZQUFBLElBQUksWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUEyQixDQUFDO0FBQ3RELFlBQUEsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUMzQixZQUFBLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7QUFFN0IsWUFBQSxPQUFPLFlBQVksRUFBRTtnQkFDakIsSUFBSSxZQUFZLElBQUksYUFBYSxFQUFFO29CQUMvQixZQUFZLEdBQUcsU0FBUyxDQUFDO0FBQzVCLGlCQUFBO0FBQU0scUJBQUE7QUFDSCxvQkFBQSxHQUFHLElBQUksWUFBWSxDQUFDLFNBQVMsQ0FBQztBQUM5QixvQkFBQSxJQUFJLElBQUksWUFBWSxDQUFDLFVBQVUsQ0FBQztBQUNoQyxvQkFBQSxZQUFZLEdBQUcsWUFBWSxDQUFDLFlBQTJCLENBQUM7QUFDM0QsaUJBQUE7QUFDSixhQUFBO1lBRUQsU0FBUyxDQUFDLElBQUksQ0FBQztBQUNYLGdCQUFBLFdBQVcsRUFBRSxNQUFNO0FBQ25CLGdCQUFBLE1BQU0sRUFBRSxFQUFFO0FBQ1YsZ0JBQUEsUUFBUSxFQUFFLFFBQVE7QUFDbEIsZ0JBQUEsSUFBSSxFQUFFLFVBQVU7QUFDaEIsZ0JBQUEsR0FBRyxFQUFFLEdBQUc7QUFDUixnQkFBQSxJQUFJLEVBQUUsSUFBSTtBQUNiLGFBQUEsQ0FBQyxDQUFDO0FBQ04sU0FBQTtBQUNMLEtBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxlQUFlLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUk7QUFDNUMsUUFBQSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRTtBQUNmLFlBQUEsT0FBTyxDQUFDLENBQUM7QUFDWixTQUFBO0FBQU0sYUFBQSxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRTtBQUN4QixZQUFBLElBQUksQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFO0FBQ2pCLGdCQUFBLE9BQU8sQ0FBQyxDQUFDO0FBQ1osYUFBQTtBQUFNLGlCQUFBLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFO0FBQzFCLGdCQUFBLE9BQU8sQ0FBQyxDQUFDO0FBQ1osYUFBQTtBQUFNLGlCQUFBO2dCQUNILE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDYixhQUFBO0FBQ0osU0FBQTtBQUFNLGFBQUE7WUFDSCxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ2IsU0FBQTtBQUNMLEtBQUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxlQUFlLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU1RSxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSTtBQUNwQyxRQUFBLFFBQVEsQ0FBQyxNQUFNLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pDLEtBQUMsQ0FBQyxDQUFDO0FBRUgsSUFBQSxPQUFPLGVBQWUsQ0FBQztBQUMzQixDQUFDO0FBRWUsU0FBQSx3QkFBd0IsQ0FBQyxNQUFtQixFQUFFLEVBQWUsRUFBQTtBQUN6RSxJQUFBLE9BQU8sRUFBRSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFBO0FBQ25HLENBQUM7QUFFSyxTQUFVLHNCQUFzQixDQUFDLFNBQTRCLEVBQUE7SUFDL0QsTUFBTSxvQkFBb0IsR0FBa0IsRUFBRSxDQUFBO0FBQzlDLElBQUEsS0FBSyxJQUFJLFFBQVEsSUFBSSxTQUFTLEVBQUU7UUFDNUIsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0QsUUFBUSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQTtBQUNoRCxRQUFBLGNBQWMsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztBQUNqQyxRQUFBLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNsQyxRQUFBLGNBQWMsQ0FBQyxXQUFXLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUM3QyxRQUFBLGNBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25DLGNBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEQsUUFBQSxjQUFjLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN4QyxRQUFBLG9CQUFvQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQUM1QyxLQUFBO0FBQ0QsSUFBQSxPQUFPLG9CQUFvQixDQUFBO0FBQy9COztBQ3RIYyxNQUFPLG9CQUFvQixDQUFBO0lBSXJDLFdBQVksQ0FBQSxJQUFpQixFQUFFLFFBQWdCLEVBQUE7QUFDM0MsUUFBQSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNqQixRQUFBLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0tBQzVCO0lBRU0sSUFBSSxHQUFBO0FBQ1AsUUFBQSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQTtRQUMvQixNQUFNLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDbEQsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUIsUUFBQSxPQUFPLEtBQUssQ0FBQztLQUNoQjtBQUNKOztBQ1phLE1BQU8sd0JBQXdCLENBQUE7QUFLekMsSUFBQSxXQUFBLENBQVksSUFBaUIsRUFBRSxNQUFrQixFQUFFLFFBQWdCLEVBQUE7UUFtQzNELElBQWtCLENBQUEsa0JBQUEsR0FBRyxNQUF1QjtBQUNoRCxZQUFBLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFDMUIsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFbEQsT0FBTyxjQUFjLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNwRCxTQUFDLENBQUE7QUF2Q0csUUFBQSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNqQixRQUFBLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFBO0FBQ3RCLFFBQUEsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7S0FDNUI7SUFFTSxJQUFJLEdBQUE7QUFDUCxRQUFBLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFBO1FBQy9CLE1BQU0sS0FBSyxHQUFHLG1CQUFtQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNsRCxRQUFBLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0FBQzlDLFFBQUEsTUFBTSxlQUFlLEdBQUcsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3hGLFFBQUEsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLE1BQUssTUFBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsRUFBSyxJQUFJLENBQUUsRUFBQSxFQUFBLE1BQU0sRUFBRSxlQUFlLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQSxDQUFBLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNySCxRQUFBLE1BQU0sbUJBQW1CLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLHNDQUFVLElBQUksQ0FBQSxFQUFBLEVBQUUsTUFBTSxFQUFFLGVBQWUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFBLENBQUEsQ0FBRSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDaEosUUFBQSxNQUFNLG9CQUFvQixHQUFHLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ25FLFFBQUEsT0FBTyxDQUFDLGFBQWEsRUFBRSxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0tBQ3JFO0lBRU0sZUFBZSxHQUFBOztBQUNsQixRQUFBLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDMUIsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDOzs7UUFJckMsSUFBSSxDQUFBLEVBQUEsR0FBQSxNQUFBLFFBQVEsQ0FBQyxTQUFTLE1BQUUsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsYUFBYSxNQUFFLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLEdBQUcsRUFBRTs7WUFFeEMsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFBOztBQUUzRCxZQUFBLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFBOztZQUU5QyxJQUFJLEdBQUcsTUFBQSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFFLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLElBQUksQ0FBQTtBQUNsRSxTQUFBO0FBQ0QsUUFBQSxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDbEQsUUFBQSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQztLQUNuQztBQVFKOztBQ3RDRCxJQUFLLFNBS0osQ0FBQTtBQUxELENBQUEsVUFBSyxTQUFTLEVBQUE7QUFDVixJQUFBLFNBQUEsQ0FBQSxTQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsUUFBTSxDQUFBO0FBQ04sSUFBQSxTQUFBLENBQUEsU0FBQSxDQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLFNBQU8sQ0FBQTtBQUNQLElBQUEsU0FBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxRQUFNLENBQUE7QUFDTixJQUFBLFNBQUEsQ0FBQSxTQUFBLENBQUEsY0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsY0FBWSxDQUFBO0FBQ2hCLENBQUMsRUFMSSxTQUFTLEtBQVQsU0FBUyxHQUtiLEVBQUEsQ0FBQSxDQUFBLENBQUE7QUFLb0IsTUFBQSxVQUFXLFNBQVFDLGVBQU0sQ0FBQTtBQUE5QyxJQUFBLFdBQUEsR0FBQTs7UUFDSSxJQUFnQixDQUFBLGdCQUFBLEdBQVksS0FBSyxDQUFDO1FBRWxDLElBQVUsQ0FBQSxVQUFBLEdBQXNELFNBQVMsQ0FBQztRQU0xRSxJQUFhLENBQUEsYUFBQSxHQUFnQixFQUFFLENBQUM7UUFDaEMsSUFBZ0IsQ0FBQSxnQkFBQSxHQUFnQixFQUFFLENBQUM7UUEwRm5DLElBQWdCLENBQUEsZ0JBQUEsR0FBRyxNQUFLO1lBQ3BCLE1BQU0sRUFBQyxRQUFRLEVBQUUsRUFBQyxPQUFPLEVBQUMsRUFBRSxHQUFHLElBQUksQ0FBQTtBQUVuQyxZQUFBLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBRW5DLFlBQUEsUUFBUSxJQUFJO0FBQ1IsZ0JBQUEsS0FBSyxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQ25CLG9CQUFBLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFrQixDQUFDO0FBQ3pDLG9CQUFBLE1BQU0sZUFBZSxHQUFHLElBQUkseUJBQXlCLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2hGLG9CQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ3BDLE1BQU07QUFDVCxpQkFBQTtBQUNELGdCQUFBLEtBQUssU0FBUyxDQUFDLFlBQVksRUFBRTtBQUN6QixvQkFBQSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBc0IsQ0FBQztvQkFDOUMsTUFBTSxhQUFhLEdBQWlCLFdBQW1CLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7b0JBQ3ZGLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxlQUFlLEVBQUUsb0JBQW9CLENBQUMsR0FBRyxJQUFJLHdCQUF3QixDQUFDLGFBQWEsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDekksb0JBQUEsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQ2hFLG9CQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDO0FBQ25DLG9CQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLGdCQUFnQixFQUFFLEdBQUcsZUFBZSxDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztvQkFDcEYsTUFBTTtBQUNULGlCQUFBO0FBQ0QsZ0JBQUEsS0FBSyxTQUFTLENBQUMsT0FBTyxFQUFFO0FBQ3BCLG9CQUFBLE1BQU0sYUFBYSxHQUFpQixXQUFtQixDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDM0gsb0JBQUEsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLG9CQUFvQixDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNqRixvQkFBQSxJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7b0JBQ3JDLE1BQU07QUFDVCxpQkFBQTtBQUNELGdCQUFBLEtBQUssU0FBUyxDQUFDLE1BQU0sRUFBRTtBQUNuQixvQkFBQSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBc0IsQ0FBQztBQUM5QyxvQkFBQSxNQUFNLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3pFLG9CQUFBLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ2pFLG9CQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDO0FBQ25DLG9CQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDckMsTUFBTTtBQUNULGlCQUFBO0FBQ0osYUFBQTtBQUNMLFNBQUMsQ0FBQTtBQUVEOzs7QUFHRTtBQUNGLFFBQUEsSUFBQSxDQUFBLGlCQUFpQixHQUFHLENBQUMsY0FBdUIsRUFBRSxhQUF5QixHQUFBLElBQUksS0FBSTtZQUMzRSxNQUFNLEVBQUMsUUFBUSxFQUFFLEVBQUMsT0FBTyxFQUFFLG1CQUFtQixFQUFDLEVBQUMsR0FBRyxJQUFJLENBQUE7QUFDdkQsWUFBQSxNQUFNLFlBQVksR0FBRyxjQUFjLElBQUksbUJBQW1CLENBQUM7QUFFM0QsWUFBQSxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFBO0FBRXJCLFlBQUEsUUFBUSxJQUFJO2dCQUNSLEtBQUssU0FBUyxDQUFDLE1BQU07b0JBQ2pCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO29CQUMvRCxNQUFNO2dCQUNWLEtBQUssU0FBUyxDQUFDLFlBQVk7b0JBQ3ZCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO29CQUMvRCxNQUFLO2dCQUNULEtBQUssU0FBUyxDQUFDLE9BQU87b0JBQ2xCLE1BQU07Z0JBQ1YsS0FBSyxTQUFTLENBQUMsTUFBTTtBQUNqQixvQkFBQSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBa0IsQ0FBQTtBQUN4QyxvQkFBQSxNQUFNLEtBQUssR0FBRyxJQUFJLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQy9GLG9CQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzFCLE1BQU07QUFHYixhQUFBO0FBRUwsU0FBQyxDQUFBO1FBRUQsSUFBbUIsQ0FBQSxtQkFBQSxHQUFHLENBQUMsT0FBZSxFQUFFLFlBQW9CLEVBQUUsYUFBc0IsS0FBSTtBQUNwRixZQUFBLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxRQUFzQixDQUFBO0FBQzdDLFlBQUEsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGlCQUFpQixDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3ZHLFlBQUEsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDakUsWUFBQSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUNuQyxZQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN6QyxTQUFDLENBQUE7S0FnTko7SUFsWFMsTUFBTSxHQUFBOztBQUNSLFlBQUEsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFBLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFJLElBQUksUUFBUSxFQUFFLENBQUM7QUFFeEQsWUFBQSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUVuRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxHQUFHQyxlQUFVLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRTtBQUMxRSxnQkFBQSxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXO0FBQ2xDLGFBQUEsQ0FBQyxDQUFDO0FBQ0gsWUFBQSxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFBO1lBRTlDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBRS9CLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDWixnQkFBQSxFQUFFLEVBQUUsdUJBQXVCO0FBQzNCLGdCQUFBLElBQUksRUFBRSxjQUFjO2dCQUNwQixRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztBQUN4QyxnQkFBQSxPQUFPLEVBQUUsQ0FBQyxFQUFDLFNBQVMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFBLENBQUEsQ0FBRyxFQUFDLENBQUM7QUFDN0MsYUFBQSxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ1osZ0JBQUEsRUFBRSxFQUFFLDJCQUEyQjtBQUMvQixnQkFBQSxJQUFJLEVBQUUsd0JBQXdCO2dCQUM5QixRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztBQUMxQyxnQkFBQSxPQUFPLEVBQUUsQ0FBQyxFQUFDLFNBQVMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUMsQ0FBQztBQUM3QyxhQUFBLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxVQUFVLENBQUM7QUFDWixnQkFBQSxFQUFFLEVBQUUsMEJBQTBCO0FBQzlCLGdCQUFBLElBQUksRUFBRSxpQkFBaUI7Z0JBQ3ZCLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDO0FBQzlDLGdCQUFBLE9BQU8sRUFBRSxFQUFFO0FBQ2QsYUFBQSxDQUFDLENBQUM7U0FDTixDQUFBLENBQUE7QUFBQSxLQUFBO0lBRUQsUUFBUSxHQUFBO0FBQ0osUUFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7S0FDakQ7QUFFRCxJQUFBLE1BQU0sQ0FBQyxJQUFzQyxFQUFBO1FBQ3pDLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFO1lBQ3ZCLE9BQU87QUFDVixTQUFBO1FBRUQsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDQyxxQkFBWSxDQUFDLENBQUE7UUFDeEUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ2xFLFFBQUEsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUN4RCxRQUFBLElBQUksQ0FBQyxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxDQUFBO0FBQ2hELFFBQUEsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7QUFFM0MsUUFBQSxRQUFRLElBQUk7WUFDUixLQUFLLFNBQVMsQ0FBQyxNQUFNO2dCQUNqQixJQUFJLENBQUMsUUFBUSxHQUFJLFdBQW1CLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztnQkFDekQsTUFBTTtZQUNWLEtBQUssU0FBUyxDQUFDLFlBQVksQ0FBQztZQUM1QixLQUFLLFNBQVMsQ0FBQyxNQUFNO2dCQUNqQixJQUFJLENBQUMsUUFBUSxHQUFxQyxXQUFZLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDekUsTUFBTTtBQUNiLFNBQUE7QUFFRCxRQUFBLFFBQVEsSUFBSTtBQUNSLFlBQUEsS0FBSyxNQUFNO2dCQUNQLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4QixPQUFNO0FBQ1YsWUFBQSxLQUFLLFFBQVE7Z0JBQ1QsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3pCLE9BQU07QUFDVixZQUFBLEtBQUssWUFBWTtnQkFDYixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDNUIsT0FBTTtBQUNiLFNBQUE7S0FDSjtBQUVELElBQUEsT0FBTyxDQUFDLFdBQWlCLEVBQUE7O0FBRXJCLFFBQUEsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFBO1FBRXpELElBQUksV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7WUFDM0MsT0FBTyxTQUFTLENBQUMsT0FBTyxDQUFDO0FBQzVCLFNBQUE7QUFBTSxhQUFBLElBQUksUUFBUSxFQUFFO1lBQ2pCLE9BQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUMzQixTQUFBO2FBQU0sSUFBSSxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUNqRCxZQUFBLE1BQU0sYUFBYSxHQUFxQyxXQUFZLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDQywrQkFBc0IsQ0FBQyxDQUFBO0FBQ2xILFlBQUEsSUFBSSxhQUFhO2dCQUFFLE9BQU8sU0FBUyxDQUFDLFlBQVksQ0FBQztZQUNqRCxPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDM0IsU0FBQTtLQUVKOztJQStFRCxvQkFBb0IsR0FBQTs7QUFFaEIsUUFBQSxNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQ0QscUJBQVksQ0FBQyxDQUFDO1FBQ3RFLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFBQyxPQUFNO0FBQUMsU0FBQTs7UUFHeEIsTUFBTSxxQkFBcUIsR0FBRyxTQUFTLENBQUMsc0JBQXNCLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUN0RixNQUFNLGFBQWEsR0FBSSxxQkFBcUIsQ0FBQyxDQUFDLENBQWlCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQzs7UUFHM0UscUJBQXFCLENBQUMsQ0FBQyxDQUFpQixDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsc0NBQXNDLENBQUM7UUFFL0YsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO0FBQzlCLFFBQUEsTUFBTSxPQUFPLEdBQUcsQ0FBQyxLQUFvQixLQUFJO1lBQ3JDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFHdkIsWUFBQSxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssUUFBUSxFQUFFO0FBQ3hCLGdCQUFBLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3BFLHFCQUFxQixDQUFDLENBQUMsQ0FBaUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQztBQUN6RSxhQUFBOztZQUdELElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDL0IsZ0JBQUEsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztBQUNqQyxnQkFBQSxJQUFJLFNBQVMsRUFBRTs7QUFFWCxvQkFBQSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQzVDLGlCQUFBO0FBQU0scUJBQUE7O0FBRUgsb0JBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUIsaUJBQUE7QUFDSixhQUFBOztBQUdELFlBQUEsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDdkIsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsR0FBRyxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUVqSCxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsQ0FBQzs7QUFHOUUsZ0JBQUEsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDcEUscUJBQXFCLENBQUMsQ0FBQyxDQUFpQixDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDO0FBQ3pFLGFBQUE7QUFDTCxTQUFDLENBQUE7QUFDRCxRQUFBLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7S0FDckU7SUFFRCxZQUFZLENBQUMsWUFBcUIsRUFBRSxJQUFtQyxFQUFBO0FBQ25FLFFBQUEsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRTtZQUMxQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQTtBQUMvQyxZQUFBLElBQUksSUFBSSxFQUFFOztnQkFFTixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQ3RHLGFBQUE7QUFDSixTQUFBO0FBQU0sYUFBQSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFO0FBQ2pDLFlBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDOUIsU0FBQTtBQUFNLGFBQUE7QUFDSCxZQUFBLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDN0IsSUFBSSxNQUFNLFlBQVlFLGVBQVUsRUFBRTtBQUM5QixnQkFBQSxNQUFNLEtBQUssR0FBSSxJQUF1QixDQUFDLEtBQUssQ0FBQztnQkFDN0MsTUFBTSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7QUFDaEQsZ0JBQUEsTUFBTSxZQUFZLEdBQUcsWUFBWSxLQUFLLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLGNBQWMsQ0FBQyxDQUFBO0FBRXpGLGdCQUFBLElBQUksWUFBWSxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7QUFDdEMsb0JBQUEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFDLFNBQVMsRUFBRUMscUJBQWUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFDLENBQUMsQ0FBQTtBQUNyRSxpQkFBQTtBQUFNLHFCQUFBO0FBQ0gsb0JBQUEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsRUFBRUEscUJBQWUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0FBQ2hFLGlCQUFBO0FBQ0osYUFBQTtBQUFNLGlCQUFBO0FBQ0gsZ0JBQUEsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFrQixJQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN2RSxhQUFBO0FBQ0osU0FBQTtLQUNKO0lBRUQsY0FBYyxDQUFDLHVCQUFrRCxFQUFFLEVBQUE7QUFDL0QsUUFBQSxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO0FBRXhDLFFBQUEsV0FBVyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFBO0FBQ3pGLFFBQUEsb0JBQW9CLGFBQXBCLG9CQUFvQixLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFwQixvQkFBb0IsQ0FBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQy9DLFFBQUEsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFFckUsUUFBQSxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztBQUM1QixRQUFBLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLFlBQVksRUFBRTtBQUNyRSxZQUFBLElBQUksQ0FBQyxRQUF1QixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDckUsU0FBQTtBQUNELFFBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUM7QUFDbkMsUUFBQSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO0tBQ2pDO0FBRUQsSUFBQSxtQ0FBbUMsQ0FBQyxRQUFnQixFQUFFLG9CQUFBLEdBQWtELEVBQUUsRUFBQTtBQUN0RyxRQUFBLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7UUFFeEMsb0JBQW9CLEtBQUEsSUFBQSxJQUFwQixvQkFBb0IsS0FBcEIsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsb0JBQW9CLENBQUUsT0FBTyxDQUFDLENBQUMsSUFBRztBQUM5QixZQUFBLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksUUFBUSxFQUFFO0FBQ3ZELGdCQUFBLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMzQixPQUFPO0FBQ1YsYUFBQTtZQUVELENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNmLFNBQUMsQ0FBQyxDQUFDO1FBRUgsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUc7QUFDcEQsWUFBQSxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLFFBQVEsRUFBRTtBQUN2RCxnQkFBQSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDM0IsT0FBTztBQUNWLGFBQUE7WUFFRCxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDZixTQUFDLENBQUMsQ0FBQztBQUVILFFBQUEsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsWUFBWSxFQUFFO0FBQ3JFLFlBQUEsSUFBSSxDQUFDLFFBQXVCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMxRixTQUFBO0FBQ0QsUUFBQSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztLQUN0QztJQUVELGFBQWEsQ0FBQyxTQUF5QixFQUFFLG9CQUFvQyxFQUFBOztBQUN6RSxRQUFBLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUE7QUFDMUMsUUFBQSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtZQUNuQixPQUFPO0FBQ1YsU0FBQTtRQUVELE1BQU0sV0FBVyxHQUF1QyxFQUFFLENBQUM7QUFDM0QsUUFBQSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBRWxELFFBQUEsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFvQixLQUFVOztZQUNqRCxJQUFJLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUN6RixPQUFPO0FBQ1YsYUFBQTtZQUVELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDekMsWUFBQSxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFNUYsWUFBQSxJQUFJLFFBQXNCLENBQUM7WUFDM0IsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNqQixRQUFRLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxDQUFDO0FBQzdELGFBQUE7QUFBTSxpQkFBQTtBQUNILGdCQUFBLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDakQsb0JBQUEsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUMsQ0FBQztvQkFFL0QsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN2QixLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3hCLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO0FBRWpDLG9CQUFBLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxRQUFRLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztvQkFFekUsT0FBTztBQUNWLGlCQUFBO0FBQ0osYUFBQTtZQUVELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QixLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDeEIsS0FBSyxDQUFDLHdCQUF3QixFQUFFLENBQUM7QUFFakMsWUFBQSxNQUFNLFlBQVksR0FBRyxDQUFBLENBQUEsRUFBQSxHQUFBLElBQUksQ0FBQyxVQUFVLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsUUFBUSxLQUFJLEtBQUssQ0FBQyxRQUFRLENBQUM7WUFFakUsUUFBUSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBRXRELFlBQUEsSUFBSSxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQzFDLFlBQUEsY0FBYyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxhQUFhLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUNwRixTQUFDLENBQUM7UUFFRixJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUU7WUFDakUsTUFBTSxZQUFZLEdBQUcsQ0FBQSxFQUFBLEdBQUEsSUFBSSxDQUFDLFVBQVUsTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxRQUFRLENBQUM7WUFDL0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUMsWUFBQSxJQUFJLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDMUMsT0FBTTtBQUNULFNBQUE7QUFFRCxRQUFBLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQTtBQUN6RixRQUFBLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7QUFDN0UsUUFBQSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0tBQ2hDO0FBRUQ7Ozs7O0FBS0c7SUFDSCx1QkFBdUIsR0FBQTtRQUNuQixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN2RCxNQUFNLGVBQWUsR0FBRyxNQUFLOztBQUN6QixZQUFBLE1BQU0sTUFBTSxHQUFHLENBQUEsRUFBQSxHQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDSCxxQkFBWSxDQUFDLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsTUFBTSxDQUFDO0FBQzVFLFlBQUEsTUFBTSxFQUFFLEdBQXVCLENBQUMsRUFBQSxHQUFBLE1BQWMsS0FBZCxJQUFBLElBQUEsTUFBTSxLQUFOLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLE1BQU0sQ0FBVSxFQUFFLE1BQUUsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsRUFBRSxDQUFDO0FBRXZELFlBQUEsSUFBSSxFQUFFLElBQUksQ0FBRSxFQUFVLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUU7QUFDdkUsZ0JBQUEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUN6QyxnQkFBQSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO0FBQ2xFLGFBQUE7QUFDTCxTQUFDLENBQUE7QUFDRCxRQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7QUFDakYsUUFBQSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQztBQUN4RSxRQUFBLGVBQWUsRUFBRSxDQUFDO0tBQ3JCO0FBRUQsSUFBQSxlQUFlLENBQUMsTUFBYyxFQUFBOztBQUMxQixRQUFBLE1BQU0sTUFBTSxHQUFHLENBQUEsRUFBQSxHQUFBLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBRSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQSxNQUFNLENBQUE7UUFDakQsSUFBSSxDQUFDLGFBQWEsR0FBRztBQUNqQixZQUFBLE1BQU0sRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FBRyxTQUFTO1lBQ3hELE9BQU8sRUFBRSxNQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRywwQ0FBRSxJQUFJO1NBQ2xDLENBQUE7S0FDSjtBQUNKLENBQUE7QUFFRCxNQUFNLFVBQVcsU0FBUUkseUJBQWdCLENBQUE7SUFHckMsV0FBWSxDQUFBLEdBQVEsRUFBRSxNQUFrQixFQUFBO0FBQ3BDLFFBQUEsS0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUVsQixRQUFBLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO0tBQ3ZCO0lBRUQsT0FBTyxHQUFBO0FBQ0gsUUFBQSxJQUFJLEVBQUMsV0FBVyxFQUFDLEdBQUcsSUFBSSxDQUFDO1FBRXpCLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUVwQixXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFDLElBQUksRUFBRSw0QkFBNEIsRUFBQyxDQUFDLENBQUM7UUFFakUsSUFBSUMsZ0JBQU8sQ0FBQyxXQUFXLENBQUM7YUFDbkIsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO2FBQ3pDLE9BQU8sQ0FBQyxxRUFBcUUsQ0FBQzthQUM5RSxPQUFPLENBQUMsRUFBRSxJQUFHO1lBQ1YsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7QUFDcEMsaUJBQUEsUUFBUSxDQUFDLENBQUMsS0FBYSxLQUFJO2dCQUN4QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFBO2dCQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQzlDLGFBQUMsQ0FBQyxDQUFBO0FBQ1YsU0FBQyxDQUFDLENBQUM7UUFFUCxJQUFJQSxnQkFBTyxDQUFDLFdBQVcsQ0FBQzthQUNuQixPQUFPLENBQUMsa0JBQWtCLENBQUM7YUFDM0IsT0FBTyxDQUFDLHVDQUF1QyxDQUFDO0FBQ2hELGFBQUEsT0FBTyxDQUFDLENBQUMsSUFBSSxLQUNWLElBQUk7YUFDQyxjQUFjLENBQUMsY0FBYyxDQUFDO2FBQzlCLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQztBQUNsRCxhQUFBLFFBQVEsQ0FBQyxDQUFPLEtBQUssS0FBSSxTQUFBLENBQUEsSUFBQSxFQUFBLEtBQUEsQ0FBQSxFQUFBLEtBQUEsQ0FBQSxFQUFBLGFBQUE7WUFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO0FBQ2pELFlBQUEsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3BELENBQUEsQ0FBQyxDQUNULENBQUM7UUFFTixJQUFJQSxnQkFBTyxDQUFDLFdBQVcsQ0FBQzthQUNuQixPQUFPLENBQUMsbUNBQW1DLENBQUM7YUFDNUMsT0FBTyxDQUNKLDREQUE0RCxDQUMvRDtBQUNBLGFBQUEsU0FBUyxDQUFDLENBQUMsTUFBTSxLQUFJO1lBQ2xCLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUM7QUFDeEQsaUJBQUEsUUFBUSxDQUFDLENBQU8sS0FBSyxLQUFJLFNBQUEsQ0FBQSxJQUFBLEVBQUEsS0FBQSxDQUFBLEVBQUEsS0FBQSxDQUFBLEVBQUEsYUFBQTtnQkFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEdBQUcsS0FBSyxDQUFDO0FBQ3JELGdCQUFBLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNwRCxDQUFBLENBQUMsQ0FBQztBQUNQLFNBQUMsQ0FBQyxDQUFDO1FBRVAsSUFBSUEsZ0JBQU8sQ0FBQyxXQUFXLENBQUM7YUFDbkIsT0FBTyxDQUFDLHVDQUF1QyxDQUFDO2FBQ2hELE9BQU8sQ0FDSixpRUFBaUUsQ0FDcEU7QUFDQSxhQUFBLFNBQVMsQ0FBQyxDQUFDLE1BQU0sS0FBSTtZQUNsQixNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDO0FBQ3hELGlCQUFBLFFBQVEsQ0FBQyxDQUFPLEtBQUssS0FBSSxTQUFBLENBQUEsSUFBQSxFQUFBLEtBQUEsQ0FBQSxFQUFBLEtBQUEsQ0FBQSxFQUFBLGFBQUE7Z0JBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztBQUNyRCxnQkFBQSxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDcEQsQ0FBQSxDQUFDLENBQUM7QUFDUCxTQUFDLENBQUMsQ0FBQztRQUVQLElBQUlBLGdCQUFPLENBQUMsV0FBVyxDQUFDO2FBQ25CLE9BQU8sQ0FBQyx5Q0FBeUMsQ0FBQzthQUNsRCxPQUFPLENBQ0osMEZBQTBGLENBQzdGO0FBQ0EsYUFBQSxTQUFTLENBQUMsQ0FBQyxNQUFNLEtBQUk7WUFDbEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsQ0FBQztBQUM1RCxpQkFBQSxRQUFRLENBQUMsQ0FBTyxLQUFLLEtBQUksU0FBQSxDQUFBLElBQUEsRUFBQSxLQUFBLENBQUEsRUFBQSxLQUFBLENBQUEsRUFBQSxhQUFBO2dCQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsR0FBRyxLQUFLLENBQUM7QUFDekQsZ0JBQUEsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ3BELENBQUEsQ0FBQyxDQUFDO0FBQ1AsU0FBQyxDQUFDLENBQUM7S0FDVjtBQUNKOzs7OyJ9
