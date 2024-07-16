'use strict';

var obsidian = require('obsidian');

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
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var GeneralModal = /** @class */ (function (_super) {
    __extends(GeneralModal, _super);
    function GeneralModal(leaves) {
        var _this = _super.call(this, app) || this;
        _this.leaves = leaves;
        return _this;
    }
    GeneralModal.prototype.open = function () {
        var _this = this;
        this.dimBackground = false;
        _super.prototype.open.call(this);
        this.chooser.setSelectedItem(1);
        this.focusTab();
        this.containerEl
            .getElementsByClassName("prompt-input-container")
            .item(0)
            .detach();
        // hotkey = this.app.hotkeyManager.bakedIds.find((e)=>e == "")
        this.scope.register(["Ctrl"], "Tab", function (e) {
            _this.chooser.setSelectedItem(_this.chooser.selectedItem + 1);
            _this.focusTab();
        });
        this.scope.register(["Ctrl", "Shift"], "Tab", function (e) {
            _this.chooser.setSelectedItem(_this.chooser.selectedItem - 1);
            _this.focusTab();
        });
        return new Promise(function (resolve) {
            _this.resolve = resolve;
        });
    };
    GeneralModal.prototype.onClose = function () {
        if (this.resolve)
            this.resolve(this.chooser.selectedItem);
    };
    GeneralModal.prototype.getSuggestions = function (query) {
        return this.leaves.map(function (leaf) { return leaf.view.getDisplayText(); });
    };
    GeneralModal.prototype.renderSuggestion = function (value, el) {
        el.setText(value);
    };
    GeneralModal.prototype.onChooseSuggestion = function (item, evt) { };
    GeneralModal.prototype.focusTab = function () {
        this.app.workspace.setActiveLeaf(this.leaves[this.chooser.selectedItem]);
    };
    return GeneralModal;
}(obsidian.SuggestModal));

var CTPSettingTab = /** @class */ (function (_super) {
    __extends(CTPSettingTab, _super);
    function CTPSettingTab(plugin, settings) {
        var _this = _super.call(this, plugin.app, plugin) || this;
        _this.settings = settings;
        _this.plugin = plugin;
        return _this;
    }
    CTPSettingTab.prototype.display = function () {
        var _this = this;
        var containerEl = this.containerEl;
        containerEl.empty();
        containerEl.createEl("h2", {
            text: "Cycle through Panes Configuration",
        });
        var descEl = createFragment();
        descEl.append(createEl("p", {
            text: "These are the View Types this Plugin will cycle through using any of the available commands.",
        }), createEl("p", {
            text: 'To add a new View Type to this List, simply run the Command: "Cycle through Panes: Enable this View Type". More advanced Users can edit and delete the Types in the text field (one per line).',
        }));
        new obsidian.Setting(containerEl)
            .setName("Enabled View Types")
            .setDesc(descEl)
            .addTextArea(function (cb) {
            var value = "";
            _this.settings.viewTypes.forEach(function (type) { return (value += type + "\n"); });
            cb.setValue(value);
            cb.setPlaceholder("markdown");
            cb.onChange(function (newValue) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            //                                                    No empty lines
                            this.settings.viewTypes = newValue
                                .split("\n")
                                .filter(function (pre) { return !!pre; });
                            return [4 /*yield*/, this.plugin.saveSettings()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        new obsidian.Setting(containerEl)
            .setName("Show modal when switching tabs")
            .addToggle(function (cb) {
            cb.setValue(_this.settings.showModal);
            cb.onChange(function (value) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.settings.showModal = value;
                            return [4 /*yield*/, this.plugin.saveSettings()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        new obsidian.Setting(containerEl).setName("Skip pinned tabs").addToggle(function (cb) {
            cb.setValue(_this.settings.skipPinned);
            cb.onChange(function (value) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.settings.skipPinned = value;
                            return [4 /*yield*/, this.plugin.saveSettings()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        new obsidian.Setting(containerEl)
            .setName("Stay in current split")
            .setDesc("If enabled and the currently active file is in the sidebar, you cycle within that sidebar and can't switch to the main tabs. Use the ")
            .addToggle(function (cb) {
            cb.setValue(_this.settings.stayInSplit);
            cb.onChange(function (value) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.settings.stayInSplit = value;
                            return [4 /*yield*/, this.plugin.saveSettings()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    };
    return CTPSettingTab;
}(obsidian.PluginSettingTab));

var DEFAULT_SETTINGS = {
    viewTypes: ["markdown", "canvas"],
    showModal: true,
    skipPinned: false,
    stayInSplit: true,
};

var CycleThroughPanes = /** @class */ (function (_super) {
    __extends(CycleThroughPanes, _super);
    function CycleThroughPanes() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ctrlPressedTimestamp = 0;
        _this.leafIndex = 0;
        _this.keyDownFunc = _this.onKeyDown.bind(_this);
        _this.keyUpFunc = _this.onKeyUp.bind(_this);
        return _this;
    }
    CycleThroughPanes.prototype.getLeavesOfTypes = function (types) {
        var _this = this;
        var leaves = [];
        var activeLeaf = this.app.workspace.activeLeaf;
        this.app.workspace.iterateAllLeaves(function (leaf) {
            if (_this.settings.skipPinned && leaf.getViewState().pinned)
                return;
            var correctViewType = types.contains(leaf.view.getViewType());
            if (!correctViewType)
                return;
            var isMainWindow = leaf.view.containerEl.win == window;
            var sameWindow = leaf.view.containerEl.win == activeWindow;
            var correctPane = false;
            if (isMainWindow) {
                if (_this.settings.stayInSplit) {
                    correctPane =
                        sameWindow && leaf.getRoot() == activeLeaf.getRoot();
                }
                else {
                    correctPane =
                        sameWindow &&
                            leaf.getRoot() == _this.app.workspace.rootSplit;
                }
            }
            else {
                correctPane = sameWindow;
            }
            if (correctPane) {
                leaves.push(leaf);
            }
        });
        return leaves;
    };
    CycleThroughPanes.prototype.onload = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("loading plugin: Cycle through panes");
                        return [4 /*yield*/, this.loadSettings()];
                    case 1:
                        _a.sent();
                        this.addSettingTab(new CTPSettingTab(this, this.settings));
                        this.addCommand({
                            id: "cycle-through-panes",
                            name: "Go to right tab",
                            checkCallback: function (checking) {
                                var active = _this.app.workspace.activeLeaf;
                                if (active) {
                                    if (!checking) {
                                        var leaves = _this.getLeavesOfTypes(_this.settings.viewTypes);
                                        var index = leaves.indexOf(active);
                                        if (index === leaves.length - 1) {
                                            _this.app.workspace.setActiveLeaf(leaves[0], {
                                                focus: true,
                                            });
                                        }
                                        else {
                                            _this.app.workspace.setActiveLeaf(leaves[index + 1], { focus: true });
                                        }
                                    }
                                    return true;
                                }
                                return false;
                            },
                        });
                        this.addCommand({
                            id: "cycle-through-panes-reverse",
                            name: "Go to left tab",
                            checkCallback: function (checking) {
                                var active = _this.app.workspace.activeLeaf;
                                if (active) {
                                    if (!checking) {
                                        var leaves = _this.getLeavesOfTypes(_this.settings.viewTypes);
                                        var index = leaves.indexOf(active);
                                        if (index !== undefined) {
                                            if (index === 0) {
                                                _this.app.workspace.setActiveLeaf(leaves[leaves.length - 1], { focus: true });
                                            }
                                            else {
                                                _this.app.workspace.setActiveLeaf(leaves[index - 1], { focus: true });
                                            }
                                        }
                                    }
                                    return true;
                                }
                                return false;
                            },
                        });
                        this.addCommand({
                            id: "cycle-through-panes-add-view",
                            name: "Enable this View Type",
                            checkCallback: function (checking) {
                                var active = _this.app.workspace.activeLeaf;
                                if (active &&
                                    !_this.settings.viewTypes.contains(active.view.getViewType())) {
                                    if (!checking) {
                                        _this.settings.viewTypes.push(active.view.getViewType());
                                        _this.saveSettings();
                                    }
                                    return true;
                                }
                                return false;
                            },
                        });
                        this.addCommand({
                            id: "cycle-through-panes-remove-view",
                            name: "Disable this View Type",
                            checkCallback: function (checking) {
                                var active = _this.app.workspace.activeLeaf;
                                if (active &&
                                    _this.settings.viewTypes.contains(active.view.getViewType())) {
                                    if (!checking) {
                                        _this.settings.viewTypes.remove(active.view.getViewType());
                                        _this.saveSettings();
                                    }
                                    return true;
                                }
                                return false;
                            },
                        });
                        this.addCommand({
                            id: "focus-left-sidebar",
                            name: "Focus on left sidebar",
                            callback: function () {
                                app.workspace.leftSplit.expand();
                                var leaf;
                                app.workspace.iterateAllLeaves(function (e) {
                                    if (e.getRoot() == app.workspace.leftSplit) {
                                        if (e.activeTime > ((leaf === null || leaf === void 0 ? void 0 : leaf.activeTime) || 0)) {
                                            leaf = e;
                                        }
                                    }
                                });
                                app.workspace.setActiveLeaf(leaf, { focus: true });
                            },
                        });
                        this.addCommand({
                            id: "focus-right-sidebar",
                            name: "Focus on right sidebar",
                            callback: function () {
                                app.workspace.rightSplit.expand();
                                var leaf;
                                app.workspace.iterateAllLeaves(function (e) {
                                    if (e.getRoot() == app.workspace.rightSplit) {
                                        if (e.activeTime > ((leaf === null || leaf === void 0 ? void 0 : leaf.activeTime) || 0)) {
                                            leaf = e;
                                        }
                                    }
                                });
                                app.workspace.setActiveLeaf(leaf, { focus: true });
                            },
                        });
                        this.addCommand({
                            id: "focus-on-last-active-pane",
                            name: "Go to previous tab",
                            callback: function () { return __awaiter(_this, void 0, void 0, function () {
                                var leaves, _a, leaf;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            this.setLeaves();
                                            leaves = this.leaves;
                                            if (!this.settings.showModal) return [3 /*break*/, 2];
                                            this.modal = new GeneralModal(leaves);
                                            _a = this;
                                            return [4 /*yield*/, this.modal.open()];
                                        case 1:
                                            _a.leafIndex = _b.sent();
                                            return [3 /*break*/, 3];
                                        case 2:
                                            this.leafIndex = this.leafIndex + 1;
                                            if (this.leafIndex >= this.leaves.length)
                                                this.leafIndex = 0;
                                            _b.label = 3;
                                        case 3:
                                            leaf = leaves[this.leafIndex];
                                            if (leaf) {
                                                this.app.workspace.setActiveLeaf(leaf, { focus: true });
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                        });
                        this.addCommand({
                            id: "focus-on-last-active-pane-reverse",
                            name: "Go to next tab",
                            callback: function () { return __awaiter(_this, void 0, void 0, function () {
                                var leaves, _a, leaf;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            this.setLeaves();
                                            leaves = this.leaves;
                                            if (!this.settings.showModal) return [3 /*break*/, 2];
                                            this.modal = new GeneralModal(leaves);
                                            _a = this;
                                            return [4 /*yield*/, this.modal.open()];
                                        case 1:
                                            _a.leafIndex = _b.sent();
                                            return [3 /*break*/, 3];
                                        case 2:
                                            this.leafIndex = this.leafIndex - 1;
                                            if (this.leafIndex < 0)
                                                this.leafIndex = leaves.length - 1;
                                            _b.label = 3;
                                        case 3:
                                            leaf = leaves[this.leafIndex];
                                            if (leaf) {
                                                this.app.workspace.setActiveLeaf(leaf, { focus: true });
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                        });
                        window.addEventListener("keydown", this.keyDownFunc);
                        window.addEventListener("keyup", this.keyUpFunc);
                        return [2 /*return*/];
                }
            });
        });
    };
    CycleThroughPanes.prototype.setLeaves = function () {
        if (!this.leaves) {
            var leaves = this.getLeavesOfTypes(this.settings.viewTypes);
            leaves.sort(function (a, b) {
                return b.activeTime - a.activeTime;
            });
            this.leaves = leaves;
            this.leafIndex = leaves.indexOf(this.app.workspace.activeLeaf);
        }
    };
    CycleThroughPanes.prototype.onKeyDown = function (e) {
        if (e.key == "Control") {
            this.ctrlPressedTimestamp = e.timeStamp;
            this.ctrlKeyCode = e.code;
        }
    };
    CycleThroughPanes.prototype.onKeyUp = function (e) {
        var _a;
        if (e.code == this.ctrlKeyCode && this.ctrlPressedTimestamp) {
            this.ctrlPressedTimestamp = 0;
            this.leaves = null;
            (_a = this.modal) === null || _a === void 0 ? void 0 : _a.close();
            this.modal = undefined;
        }
    };
    CycleThroughPanes.prototype.onunload = function () {
        console.log("unloading plugin: Cycle through panes");
        window.removeEventListener("keydown", this.keyDownFunc);
        window.removeEventListener("keyup", this.keyUpFunc);
    };
    CycleThroughPanes.prototype.loadSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = this;
                        _c = (_b = Object).assign;
                        _d = [{},
                            DEFAULT_SETTINGS];
                        return [4 /*yield*/, this.loadData()];
                    case 1:
                        _a.settings = _c.apply(_b, _d.concat([_e.sent()]));
                        return [2 /*return*/];
                }
            });
        });
    };
    CycleThroughPanes.prototype.saveSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.saveData(this.settings)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return CycleThroughPanes;
}(obsidian.Plugin));

module.exports = CycleThroughPanes;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNyYy9tb2RhbC50cyIsInNyYy9zZXR0aW5nc1RhYi50cyIsInNyYy90eXBlcy50cyIsInNyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19lc0RlY29yYXRlKGN0b3IsIGRlc2NyaXB0b3JJbiwgZGVjb3JhdG9ycywgY29udGV4dEluLCBpbml0aWFsaXplcnMsIGV4dHJhSW5pdGlhbGl6ZXJzKSB7XHJcbiAgICBmdW5jdGlvbiBhY2NlcHQoZikgeyBpZiAoZiAhPT0gdm9pZCAwICYmIHR5cGVvZiBmICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbiBleHBlY3RlZFwiKTsgcmV0dXJuIGY7IH1cclxuICAgIHZhciBraW5kID0gY29udGV4dEluLmtpbmQsIGtleSA9IGtpbmQgPT09IFwiZ2V0dGVyXCIgPyBcImdldFwiIDoga2luZCA9PT0gXCJzZXR0ZXJcIiA/IFwic2V0XCIgOiBcInZhbHVlXCI7XHJcbiAgICB2YXIgdGFyZ2V0ID0gIWRlc2NyaXB0b3JJbiAmJiBjdG9yID8gY29udGV4dEluW1wic3RhdGljXCJdID8gY3RvciA6IGN0b3IucHJvdG90eXBlIDogbnVsbDtcclxuICAgIHZhciBkZXNjcmlwdG9yID0gZGVzY3JpcHRvckluIHx8ICh0YXJnZXQgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgY29udGV4dEluLm5hbWUpIDoge30pO1xyXG4gICAgdmFyIF8sIGRvbmUgPSBmYWxzZTtcclxuICAgIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgdmFyIGNvbnRleHQgPSB7fTtcclxuICAgICAgICBmb3IgKHZhciBwIGluIGNvbnRleHRJbikgY29udGV4dFtwXSA9IHAgPT09IFwiYWNjZXNzXCIgPyB7fSA6IGNvbnRleHRJbltwXTtcclxuICAgICAgICBmb3IgKHZhciBwIGluIGNvbnRleHRJbi5hY2Nlc3MpIGNvbnRleHQuYWNjZXNzW3BdID0gY29udGV4dEluLmFjY2Vzc1twXTtcclxuICAgICAgICBjb250ZXh0LmFkZEluaXRpYWxpemVyID0gZnVuY3Rpb24gKGYpIHsgaWYgKGRvbmUpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgYWRkIGluaXRpYWxpemVycyBhZnRlciBkZWNvcmF0aW9uIGhhcyBjb21wbGV0ZWRcIik7IGV4dHJhSW5pdGlhbGl6ZXJzLnB1c2goYWNjZXB0KGYgfHwgbnVsbCkpOyB9O1xyXG4gICAgICAgIHZhciByZXN1bHQgPSAoMCwgZGVjb3JhdG9yc1tpXSkoa2luZCA9PT0gXCJhY2Nlc3NvclwiID8geyBnZXQ6IGRlc2NyaXB0b3IuZ2V0LCBzZXQ6IGRlc2NyaXB0b3Iuc2V0IH0gOiBkZXNjcmlwdG9yW2tleV0sIGNvbnRleHQpO1xyXG4gICAgICAgIGlmIChraW5kID09PSBcImFjY2Vzc29yXCIpIHtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gdm9pZCAwKSBjb250aW51ZTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gbnVsbCB8fCB0eXBlb2YgcmVzdWx0ICE9PSBcIm9iamVjdFwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0IGV4cGVjdGVkXCIpO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuZ2V0KSkgZGVzY3JpcHRvci5nZXQgPSBfO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuc2V0KSkgZGVzY3JpcHRvci5zZXQgPSBfO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuaW5pdCkpIGluaXRpYWxpemVycy5wdXNoKF8pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChfID0gYWNjZXB0KHJlc3VsdCkpIHtcclxuICAgICAgICAgICAgaWYgKGtpbmQgPT09IFwiZmllbGRcIikgaW5pdGlhbGl6ZXJzLnB1c2goXyk7XHJcbiAgICAgICAgICAgIGVsc2UgZGVzY3JpcHRvcltrZXldID0gXztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGFyZ2V0KSBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBjb250ZXh0SW4ubmFtZSwgZGVzY3JpcHRvcik7XHJcbiAgICBkb25lID0gdHJ1ZTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3J1bkluaXRpYWxpemVycyh0aGlzQXJnLCBpbml0aWFsaXplcnMsIHZhbHVlKSB7XHJcbiAgICB2YXIgdXNlVmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5pdGlhbGl6ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFsdWUgPSB1c2VWYWx1ZSA/IGluaXRpYWxpemVyc1tpXS5jYWxsKHRoaXNBcmcsIHZhbHVlKSA6IGluaXRpYWxpemVyc1tpXS5jYWxsKHRoaXNBcmcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVzZVZhbHVlID8gdmFsdWUgOiB2b2lkIDA7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wcm9wS2V5KHgpIHtcclxuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gXCJzeW1ib2xcIiA/IHggOiBcIlwiLmNvbmNhdCh4KTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NldEZ1bmN0aW9uTmFtZShmLCBuYW1lLCBwcmVmaXgpIHtcclxuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gXCJzeW1ib2xcIikgbmFtZSA9IG5hbWUuZGVzY3JpcHRpb24gPyBcIltcIi5jb25jYXQobmFtZS5kZXNjcmlwdGlvbiwgXCJdXCIpIDogXCJcIjtcclxuICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkoZiwgXCJuYW1lXCIsIHsgY29uZmlndXJhYmxlOiB0cnVlLCB2YWx1ZTogcHJlZml4ID8gXCJcIi5jb25jYXQocHJlZml4LCBcIiBcIiwgbmFtZSkgOiBuYW1lIH0pO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkge1xyXG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcclxuICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XHJcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xyXG4gICAgICAgIHdoaWxlIChnICYmIChnID0gMCwgb3BbMF0gJiYgKF8gPSAwKSksIF8pIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcclxuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cclxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2NyZWF0ZUJpbmRpbmcgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG0sIGspO1xyXG4gICAgaWYgKCFkZXNjIHx8IChcImdldFwiIGluIGRlc2MgPyAhbS5fX2VzTW9kdWxlIDogZGVzYy53cml0YWJsZSB8fCBkZXNjLmNvbmZpZ3VyYWJsZSkpIHtcclxuICAgICAgICBkZXNjID0geyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9O1xyXG4gICAgfVxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCBkZXNjKTtcclxufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBvW2syXSA9IG1ba107XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXhwb3J0U3RhcihtLCBvKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIHApKSBfX2NyZWF0ZUJpbmRpbmcobywgbSwgcCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3ZhbHVlcyhvKSB7XHJcbiAgICB2YXIgcyA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBTeW1ib2wuaXRlcmF0b3IsIG0gPSBzICYmIG9bc10sIGkgPSAwO1xyXG4gICAgaWYgKG0pIHJldHVybiBtLmNhbGwobyk7XHJcbiAgICBpZiAobyAmJiB0eXBlb2Ygby5sZW5ndGggPT09IFwibnVtYmVyXCIpIHJldHVybiB7XHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAobyAmJiBpID49IG8ubGVuZ3RoKSBvID0gdm9pZCAwO1xyXG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogbyAmJiBvW2krK10sIGRvbmU6ICFvIH07XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IocyA/IFwiT2JqZWN0IGlzIG5vdCBpdGVyYWJsZS5cIiA6IFwiU3ltYm9sLml0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVhZChvLCBuKSB7XHJcbiAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XHJcbiAgICBpZiAoIW0pIHJldHVybiBvO1xyXG4gICAgdmFyIGkgPSBtLmNhbGwobyksIHIsIGFyID0gW10sIGU7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XHJcbiAgICBmaW5hbGx5IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxseSB7IGlmIChlKSB0aHJvdyBlLmVycm9yOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbi8qKiBAZGVwcmVjYXRlZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWQoKSB7XHJcbiAgICBmb3IgKHZhciBhciA9IFtdLCBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKylcclxuICAgICAgICBhciA9IGFyLmNvbmNhdChfX3JlYWQoYXJndW1lbnRzW2ldKSk7XHJcbiAgICByZXR1cm4gYXI7XHJcbn1cclxuXHJcbi8qKiBAZGVwcmVjYXRlZCAqL1xyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheXMoKSB7XHJcbiAgICBmb3IgKHZhciBzID0gMCwgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHMgKz0gYXJndW1lbnRzW2ldLmxlbmd0aDtcclxuICAgIGZvciAodmFyIHIgPSBBcnJheShzKSwgayA9IDAsIGkgPSAwOyBpIDwgaWw7IGkrKylcclxuICAgICAgICBmb3IgKHZhciBhID0gYXJndW1lbnRzW2ldLCBqID0gMCwgamwgPSBhLmxlbmd0aDsgaiA8IGpsOyBqKyssIGsrKylcclxuICAgICAgICAgICAgcltrXSA9IGFbal07XHJcbiAgICByZXR1cm4gcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXkodG8sIGZyb20sIHBhY2spIHtcclxuICAgIGlmIChwYWNrIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIGZvciAodmFyIGkgPSAwLCBsID0gZnJvbS5sZW5ndGgsIGFyOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGFyIHx8ICEoaSBpbiBmcm9tKSkge1xyXG4gICAgICAgICAgICBpZiAoIWFyKSBhciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20sIDAsIGkpO1xyXG4gICAgICAgICAgICBhcltpXSA9IGZyb21baV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRvLmNvbmNhdChhciB8fCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0KHYpIHtcclxuICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgX19hd2FpdCA/ICh0aGlzLnYgPSB2LCB0aGlzKSA6IG5ldyBfX2F3YWl0KHYpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0dlbmVyYXRvcih0aGlzQXJnLCBfYXJndW1lbnRzLCBnZW5lcmF0b3IpIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgZyA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSwgaSwgcSA9IFtdO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiKSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlmIChnW25dKSBpW25dID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChhLCBiKSB7IHEucHVzaChbbiwgdiwgYSwgYl0pID4gMSB8fCByZXN1bWUobiwgdik7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiByZXN1bWUobiwgdikgeyB0cnkgeyBzdGVwKGdbbl0odikpOyB9IGNhdGNoIChlKSB7IHNldHRsZShxWzBdWzNdLCBlKTsgfSB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKHIpIHsgci52YWx1ZSBpbnN0YW5jZW9mIF9fYXdhaXQgPyBQcm9taXNlLnJlc29sdmUoci52YWx1ZS52KS50aGVuKGZ1bGZpbGwsIHJlamVjdCkgOiBzZXR0bGUocVswXVsyXSwgcik7IH1cclxuICAgIGZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHsgcmVzdW1lKFwibmV4dFwiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHJlamVjdCh2YWx1ZSkgeyByZXN1bWUoXCJ0aHJvd1wiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShmLCB2KSB7IGlmIChmKHYpLCBxLnNoaWZ0KCksIHEubGVuZ3RoKSByZXN1bWUocVswXVswXSwgcVswXVsxXSk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNEZWxlZ2F0b3Iobykge1xyXG4gICAgdmFyIGksIHA7XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIsIGZ1bmN0aW9uIChlKSB7IHRocm93IGU7IH0pLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlbbl0gPSBvW25dID8gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIChwID0gIXApID8geyB2YWx1ZTogX19hd2FpdChvW25dKHYpKSwgZG9uZTogZmFsc2UgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkSW4oc3RhdGUsIHJlY2VpdmVyKSB7XHJcbiAgICBpZiAocmVjZWl2ZXIgPT09IG51bGwgfHwgKHR5cGVvZiByZWNlaXZlciAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcmVjZWl2ZXIgIT09IFwiZnVuY3Rpb25cIikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgdXNlICdpbicgb3BlcmF0b3Igb24gbm9uLW9iamVjdFwiKTtcclxuICAgIHJldHVybiB0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyID09PSBzdGF0ZSA6IHN0YXRlLmhhcyhyZWNlaXZlcik7XHJcbn1cclxuIiwiaW1wb3J0IHsgU3VnZ2VzdE1vZGFsLCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBHZW5lcmFsTW9kYWwgZXh0ZW5kcyBTdWdnZXN0TW9kYWw8c3RyaW5nPiB7XG4gICAgcmVzb2x2ZTogKHZhbHVlOiBudW1iZXIpID0+IHZvaWQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGxlYXZlczogV29ya3NwYWNlTGVhZltdKSB7XG4gICAgICAgIHN1cGVyKGFwcCk7XG4gICAgfVxuXG4gICAgb3BlbigpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICB0aGlzLmRpbUJhY2tncm91bmQgPSBmYWxzZTtcbiAgICAgICAgc3VwZXIub3BlbigpO1xuXG4gICAgICAgIHRoaXMuY2hvb3Nlci5zZXRTZWxlY3RlZEl0ZW0oMSk7XG4gICAgICAgIHRoaXMuZm9jdXNUYWIoKTtcblxuICAgICAgICB0aGlzLmNvbnRhaW5lckVsXG4gICAgICAgICAgICAuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInByb21wdC1pbnB1dC1jb250YWluZXJcIilcbiAgICAgICAgICAgIC5pdGVtKDApXG4gICAgICAgICAgICAuZGV0YWNoKCk7XG5cbiAgICAgICAgLy8gaG90a2V5ID0gdGhpcy5hcHAuaG90a2V5TWFuYWdlci5iYWtlZElkcy5maW5kKChlKT0+ZSA9PSBcIlwiKVxuXG4gICAgICAgIHRoaXMuc2NvcGUucmVnaXN0ZXIoW1wiQ3RybFwiXSwgXCJUYWJcIiwgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2hvb3Nlci5zZXRTZWxlY3RlZEl0ZW0odGhpcy5jaG9vc2VyLnNlbGVjdGVkSXRlbSArIDEpO1xuICAgICAgICAgICAgdGhpcy5mb2N1c1RhYigpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnNjb3BlLnJlZ2lzdGVyKFtcIkN0cmxcIiwgXCJTaGlmdFwiXSwgXCJUYWJcIiwgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2hvb3Nlci5zZXRTZWxlY3RlZEl0ZW0odGhpcy5jaG9vc2VyLnNlbGVjdGVkSXRlbSAtIDEpO1xuICAgICAgICAgICAgdGhpcy5mb2N1c1RhYigpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uQ2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlc29sdmUpIHRoaXMucmVzb2x2ZSh0aGlzLmNob29zZXIuc2VsZWN0ZWRJdGVtKTtcbiAgICB9XG5cbiAgICBnZXRTdWdnZXN0aW9ucyhxdWVyeTogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5sZWF2ZXMubWFwKChsZWFmKSA9PiBsZWFmLnZpZXcuZ2V0RGlzcGxheVRleHQoKSk7XG4gICAgfVxuXG4gICAgcmVuZGVyU3VnZ2VzdGlvbih2YWx1ZTogc3RyaW5nLCBlbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICAgICAgZWwuc2V0VGV4dCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgb25DaG9vc2VTdWdnZXN0aW9uKGl0ZW06IHN0cmluZywgZXZ0OiBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCkge31cblxuICAgIGZvY3VzVGFiKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uuc2V0QWN0aXZlTGVhZihcbiAgICAgICAgICAgIHRoaXMubGVhdmVzW3RoaXMuY2hvb3Nlci5zZWxlY3RlZEl0ZW1dXG4gICAgICAgICk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IEN5Y2xlVGhyb3VnaFBhbmVzIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ1RQU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICAgIHNldHRpbmdzOiBTZXR0aW5ncztcbiAgICBwbHVnaW46IEN5Y2xlVGhyb3VnaFBhbmVzO1xuXG4gICAgY29uc3RydWN0b3IocGx1Z2luOiBDeWNsZVRocm91Z2hQYW5lcywgc2V0dGluZ3M6IFNldHRpbmdzKSB7XG4gICAgICAgIHN1cGVyKHBsdWdpbi5hcHAsIHBsdWdpbik7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgfVxuXG4gICAgZGlzcGxheSgpIHtcbiAgICAgICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcblxuICAgICAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgICAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHtcbiAgICAgICAgICAgIHRleHQ6IFwiQ3ljbGUgdGhyb3VnaCBQYW5lcyBDb25maWd1cmF0aW9uXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGRlc2NFbCA9IGNyZWF0ZUZyYWdtZW50KCk7XG4gICAgICAgIGRlc2NFbC5hcHBlbmQoXG4gICAgICAgICAgICBjcmVhdGVFbChcInBcIiwge1xuICAgICAgICAgICAgICAgIHRleHQ6IFwiVGhlc2UgYXJlIHRoZSBWaWV3IFR5cGVzIHRoaXMgUGx1Z2luIHdpbGwgY3ljbGUgdGhyb3VnaCB1c2luZyBhbnkgb2YgdGhlIGF2YWlsYWJsZSBjb21tYW5kcy5cIixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnVG8gYWRkIGEgbmV3IFZpZXcgVHlwZSB0byB0aGlzIExpc3QsIHNpbXBseSBydW4gdGhlIENvbW1hbmQ6IFwiQ3ljbGUgdGhyb3VnaCBQYW5lczogRW5hYmxlIHRoaXMgVmlldyBUeXBlXCIuIE1vcmUgYWR2YW5jZWQgVXNlcnMgY2FuIGVkaXQgYW5kIGRlbGV0ZSB0aGUgVHlwZXMgaW4gdGhlIHRleHQgZmllbGQgKG9uZSBwZXIgbGluZSkuJyxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZShcIkVuYWJsZWQgVmlldyBUeXBlc1wiKVxuICAgICAgICAgICAgLnNldERlc2MoZGVzY0VsKVxuICAgICAgICAgICAgLmFkZFRleHRBcmVhKChjYikgPT4ge1xuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy52aWV3VHlwZXMuZm9yRWFjaChcbiAgICAgICAgICAgICAgICAgICAgKHR5cGUpID0+ICh2YWx1ZSArPSB0eXBlICsgXCJcXG5cIilcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNiLnNldFZhbHVlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBjYi5zZXRQbGFjZWhvbGRlcihcIm1hcmtkb3duXCIpO1xuICAgICAgICAgICAgICAgIGNiLm9uQ2hhbmdlKGFzeW5jIChuZXdWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBObyBlbXB0eSBsaW5lc1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLnZpZXdUeXBlcyA9IG5ld1ZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKHByZSkgPT4gISFwcmUpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoXCJTaG93IG1vZGFsIHdoZW4gc3dpdGNoaW5nIHRhYnNcIilcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKGNiKSA9PiB7XG4gICAgICAgICAgICAgICAgY2Iuc2V0VmFsdWUodGhpcy5zZXR0aW5ncy5zaG93TW9kYWwpO1xuICAgICAgICAgICAgICAgIGNiLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLnNob3dNb2RhbCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKS5zZXROYW1lKFwiU2tpcCBwaW5uZWQgdGFic1wiKS5hZGRUb2dnbGUoKGNiKSA9PiB7XG4gICAgICAgICAgICBjYi5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLnNraXBQaW5uZWQpO1xuICAgICAgICAgICAgY2Iub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5za2lwUGlubmVkID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAuc2V0TmFtZShcIlN0YXkgaW4gY3VycmVudCBzcGxpdFwiKVxuICAgICAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgICAgICAgXCJJZiBlbmFibGVkIGFuZCB0aGUgY3VycmVudGx5IGFjdGl2ZSBmaWxlIGlzIGluIHRoZSBzaWRlYmFyLCB5b3UgY3ljbGUgd2l0aGluIHRoYXQgc2lkZWJhciBhbmQgY2FuJ3Qgc3dpdGNoIHRvIHRoZSBtYWluIHRhYnMuIFVzZSB0aGUgXCJcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKGNiKSA9PiB7XG4gICAgICAgICAgICAgICAgY2Iuc2V0VmFsdWUodGhpcy5zZXR0aW5ncy5zdGF5SW5TcGxpdCk7XG4gICAgICAgICAgICAgICAgY2Iub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3Muc3RheUluU3BsaXQgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJleHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzIHtcbiAgICB2aWV3VHlwZXM6IHN0cmluZ1tdO1xuICAgIHNob3dNb2RhbDogYm9vbGVhbjtcbiAgICBza2lwUGlubmVkOiBib29sZWFuO1xuICAgIHN0YXlJblNwbGl0OiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogU2V0dGluZ3MgPSB7XG4gICAgdmlld1R5cGVzOiBbXCJtYXJrZG93blwiLCBcImNhbnZhc1wiXSxcbiAgICBzaG93TW9kYWw6IHRydWUsXG4gICAgc2tpcFBpbm5lZDogZmFsc2UsXG4gICAgc3RheUluU3BsaXQ6IHRydWUsXG59O1xuXG5kZWNsYXJlIG1vZHVsZSBcIm9ic2lkaWFuXCIge1xuICAgIGludGVyZmFjZSBBcHAge1xuICAgICAgICBob3RrZXlNYW5hZ2VyOiB7XG4gICAgICAgICAgICBiYWtlZElkczogc3RyaW5nW107XG4gICAgICAgICAgICBiYWtlZEhvdGtleXM6IHsgbW9kaWZpZXJzOiBzdHJpbmc7IGtleTogc3RyaW5nIH1bXTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpbnRlcmZhY2UgV29ya3NwYWNlTGVhZiB7XG4gICAgICAgIGFjdGl2ZVRpbWU6IG51bWJlcjtcbiAgICB9XG5cbiAgICBpbnRlcmZhY2UgTW9kYWwge1xuICAgICAgICBjaG9vc2VyOiB7XG4gICAgICAgICAgICBtb3ZlRG93bjogYW55O1xuICAgICAgICAgICAgbW92ZVVwOiBhbnk7XG4gICAgICAgICAgICBzZWxlY3RlZEl0ZW06IG51bWJlcjtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkSXRlbTogKGluZGV4OiBudW1iZXIpID0+IHZvaWQ7XG4gICAgICAgIH07XG4gICAgICAgIGRpbUJhY2tncm91bmQ6IGJvb2xlYW47XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgUGx1Z2luLCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBHZW5lcmFsTW9kYWwgfSBmcm9tIFwiLi9tb2RhbFwiO1xuaW1wb3J0IENUUFNldHRpbmdUYWIgZnJvbSBcIi4vc2V0dGluZ3NUYWJcIjtcbmltcG9ydCB7IERFRkFVTFRfU0VUVElOR1MsIFNldHRpbmdzIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3ljbGVUaHJvdWdoUGFuZXMgZXh0ZW5kcyBQbHVnaW4ge1xuICAgIHNldHRpbmdzOiBTZXR0aW5ncztcbiAgICBjdHJsUHJlc3NlZFRpbWVzdGFtcCA9IDA7XG4gICAgY3RybEtleUNvZGU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBsZWFmSW5kZXggPSAwO1xuICAgIG1vZGFsOiBHZW5lcmFsTW9kYWwgfCB1bmRlZmluZWQ7XG4gICAgbGVhdmVzOiBXb3Jrc3BhY2VMZWFmW107XG5cbiAgICBrZXlEb3duRnVuYyA9IHRoaXMub25LZXlEb3duLmJpbmQodGhpcyk7XG4gICAga2V5VXBGdW5jID0gdGhpcy5vbktleVVwLmJpbmQodGhpcyk7XG5cbiAgICBnZXRMZWF2ZXNPZlR5cGVzKHR5cGVzOiBzdHJpbmdbXSk6IFdvcmtzcGFjZUxlYWZbXSB7XG4gICAgICAgIGNvbnN0IGxlYXZlczogV29ya3NwYWNlTGVhZltdID0gW107XG4gICAgICAgIGNvbnN0IGFjdGl2ZUxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZjtcbiAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLml0ZXJhdGVBbGxMZWF2ZXMoKGxlYWYpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnNraXBQaW5uZWQgJiYgbGVhZi5nZXRWaWV3U3RhdGUoKS5waW5uZWQpIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3QgY29ycmVjdFZpZXdUeXBlID0gdHlwZXMuY29udGFpbnMobGVhZi52aWV3LmdldFZpZXdUeXBlKCkpO1xuXG4gICAgICAgICAgICBpZiAoIWNvcnJlY3RWaWV3VHlwZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zdCBpc01haW5XaW5kb3cgPSBsZWFmLnZpZXcuY29udGFpbmVyRWwud2luID09IHdpbmRvdztcbiAgICAgICAgICAgIGNvbnN0IHNhbWVXaW5kb3cgPSBsZWFmLnZpZXcuY29udGFpbmVyRWwud2luID09IGFjdGl2ZVdpbmRvdztcblxuICAgICAgICAgICAgbGV0IGNvcnJlY3RQYW5lID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoaXNNYWluV2luZG93KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3Muc3RheUluU3BsaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29ycmVjdFBhbmUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgc2FtZVdpbmRvdyAmJiBsZWFmLmdldFJvb3QoKSA9PSBhY3RpdmVMZWFmLmdldFJvb3QoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb3JyZWN0UGFuZSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1lV2luZG93ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWFmLmdldFJvb3QoKSA9PSB0aGlzLmFwcC53b3Jrc3BhY2Uucm9vdFNwbGl0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29ycmVjdFBhbmUgPSBzYW1lV2luZG93O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNvcnJlY3RQYW5lKSB7XG4gICAgICAgICAgICAgICAgbGVhdmVzLnB1c2gobGVhZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBsZWF2ZXM7XG4gICAgfVxuXG4gICAgYXN5bmMgb25sb2FkKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImxvYWRpbmcgcGx1Z2luOiBDeWNsZSB0aHJvdWdoIHBhbmVzXCIpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICAgICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBDVFBTZXR0aW5nVGFiKHRoaXMsIHRoaXMuc2V0dGluZ3MpKTtcblxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgICAgICAgaWQ6IFwiY3ljbGUtdGhyb3VnaC1wYW5lc1wiLFxuICAgICAgICAgICAgbmFtZTogXCJHbyB0byByaWdodCB0YWJcIixcbiAgICAgICAgICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5hY3RpdmVMZWFmO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNoZWNraW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsZWF2ZXM6IFdvcmtzcGFjZUxlYWZbXSA9IHRoaXMuZ2V0TGVhdmVzT2ZUeXBlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLnZpZXdUeXBlc1xuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gbGVhdmVzLmluZGV4T2YoYWN0aXZlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSBsZWF2ZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5zZXRBY3RpdmVMZWFmKGxlYXZlc1swXSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb2N1czogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLnNldEFjdGl2ZUxlYWYoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlYXZlc1tpbmRleCArIDFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGZvY3VzOiB0cnVlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgICAgICAgaWQ6IFwiY3ljbGUtdGhyb3VnaC1wYW5lcy1yZXZlcnNlXCIsXG4gICAgICAgICAgICBuYW1lOiBcIkdvIHRvIGxlZnQgdGFiXCIsXG4gICAgICAgICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmc6IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3RpdmUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZjtcbiAgICAgICAgICAgICAgICBpZiAoYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxlYXZlczogV29ya3NwYWNlTGVhZltdID0gdGhpcy5nZXRMZWF2ZXNPZlR5cGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3Mudmlld1R5cGVzXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBsZWF2ZXMuaW5kZXhPZihhY3RpdmUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uuc2V0QWN0aXZlTGVhZihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlYXZlc1tsZWF2ZXMubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGZvY3VzOiB0cnVlIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uuc2V0QWN0aXZlTGVhZihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlYXZlc1tpbmRleCAtIDFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBmb2N1czogdHJ1ZSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgICAgICAgaWQ6IFwiY3ljbGUtdGhyb3VnaC1wYW5lcy1hZGQtdmlld1wiLFxuICAgICAgICAgICAgbmFtZTogXCJFbmFibGUgdGhpcyBWaWV3IFR5cGVcIixcbiAgICAgICAgICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5hY3RpdmVMZWFmO1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlICYmXG4gICAgICAgICAgICAgICAgICAgICF0aGlzLnNldHRpbmdzLnZpZXdUeXBlcy5jb250YWlucyhhY3RpdmUudmlldy5nZXRWaWV3VHlwZSgpKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNoZWNraW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLnZpZXdUeXBlcy5wdXNoKGFjdGl2ZS52aWV3LmdldFZpZXdUeXBlKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgICAgICAgIGlkOiBcImN5Y2xlLXRocm91Z2gtcGFuZXMtcmVtb3ZlLXZpZXdcIixcbiAgICAgICAgICAgIG5hbWU6IFwiRGlzYWJsZSB0aGlzIFZpZXcgVHlwZVwiLFxuICAgICAgICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlID0gdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWY7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICBhY3RpdmUgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy52aWV3VHlwZXMuY29udGFpbnMoYWN0aXZlLnZpZXcuZ2V0Vmlld1R5cGUoKSlcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGVja2luZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy52aWV3VHlwZXMucmVtb3ZlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZS52aWV3LmdldFZpZXdUeXBlKClcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgICAgICAgaWQ6IFwiZm9jdXMtbGVmdC1zaWRlYmFyXCIsXG4gICAgICAgICAgICBuYW1lOiBcIkZvY3VzIG9uIGxlZnQgc2lkZWJhclwiLFxuICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBhcHAud29ya3NwYWNlLmxlZnRTcGxpdC5leHBhbmQoKTtcbiAgICAgICAgICAgICAgICBsZXQgbGVhZjogV29ya3NwYWNlTGVhZjtcbiAgICAgICAgICAgICAgICBhcHAud29ya3NwYWNlLml0ZXJhdGVBbGxMZWF2ZXMoKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUuZ2V0Um9vdCgpID09IGFwcC53b3Jrc3BhY2UubGVmdFNwbGl0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5hY3RpdmVUaW1lID4gKGxlYWY/LmFjdGl2ZVRpbWUgfHwgMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWFmID0gZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFwcC53b3Jrc3BhY2Uuc2V0QWN0aXZlTGVhZihsZWFmLCB7IGZvY3VzOiB0cnVlIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgICAgICAgIGlkOiBcImZvY3VzLXJpZ2h0LXNpZGViYXJcIixcbiAgICAgICAgICAgIG5hbWU6IFwiRm9jdXMgb24gcmlnaHQgc2lkZWJhclwiLFxuICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBhcHAud29ya3NwYWNlLnJpZ2h0U3BsaXQuZXhwYW5kKCk7XG4gICAgICAgICAgICAgICAgbGV0IGxlYWY6IFdvcmtzcGFjZUxlYWY7XG4gICAgICAgICAgICAgICAgYXBwLndvcmtzcGFjZS5pdGVyYXRlQWxsTGVhdmVzKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmdldFJvb3QoKSA9PSBhcHAud29ya3NwYWNlLnJpZ2h0U3BsaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmFjdGl2ZVRpbWUgPiAobGVhZj8uYWN0aXZlVGltZSB8fCAwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlYWYgPSBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYXBwLndvcmtzcGFjZS5zZXRBY3RpdmVMZWFmKGxlYWYsIHsgZm9jdXM6IHRydWUgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgICAgICAgaWQ6IFwiZm9jdXMtb24tbGFzdC1hY3RpdmUtcGFuZVwiLFxuICAgICAgICAgICAgbmFtZTogXCJHbyB0byBwcmV2aW91cyB0YWJcIixcbiAgICAgICAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRMZWF2ZXMoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBsZWF2ZXMgPSB0aGlzLmxlYXZlcztcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zaG93TW9kYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb2RhbCA9IG5ldyBHZW5lcmFsTW9kYWwobGVhdmVzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZWFmSW5kZXggPSBhd2FpdCB0aGlzLm1vZGFsLm9wZW4oKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxlYWZJbmRleCA9IHRoaXMubGVhZkluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGVhZkluZGV4ID49IHRoaXMubGVhdmVzLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGVhZkluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgbGVhZiA9IGxlYXZlc1t0aGlzLmxlYWZJbmRleF07XG5cbiAgICAgICAgICAgICAgICBpZiAobGVhZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uuc2V0QWN0aXZlTGVhZihsZWFmLCB7IGZvY3VzOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgICAgICAgaWQ6IFwiZm9jdXMtb24tbGFzdC1hY3RpdmUtcGFuZS1yZXZlcnNlXCIsXG4gICAgICAgICAgICBuYW1lOiBcIkdvIHRvIG5leHQgdGFiXCIsXG4gICAgICAgICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0TGVhdmVzKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbGVhdmVzID0gdGhpcy5sZWF2ZXM7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3Muc2hvd01vZGFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW9kYWwgPSBuZXcgR2VuZXJhbE1vZGFsKGxlYXZlcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGVhZkluZGV4ID0gYXdhaXQgdGhpcy5tb2RhbC5vcGVuKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZWFmSW5kZXggPSB0aGlzLmxlYWZJbmRleCAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxlYWZJbmRleCA8IDApIHRoaXMubGVhZkluZGV4ID0gbGVhdmVzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGxlYWYgPSBsZWF2ZXNbdGhpcy5sZWFmSW5kZXhdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGxlYWYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAud29ya3NwYWNlLnNldEFjdGl2ZUxlYWYobGVhZiwgeyBmb2N1czogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5rZXlEb3duRnVuYyk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5rZXlVcEZ1bmMpO1xuICAgIH1cblxuICAgIHNldExlYXZlcygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxlYXZlcykge1xuICAgICAgICAgICAgY29uc3QgbGVhdmVzID0gdGhpcy5nZXRMZWF2ZXNPZlR5cGVzKHRoaXMuc2V0dGluZ3Mudmlld1R5cGVzKTtcbiAgICAgICAgICAgIGxlYXZlcy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIuYWN0aXZlVGltZSAtIGEuYWN0aXZlVGltZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5sZWF2ZXMgPSBsZWF2ZXM7XG4gICAgICAgICAgICB0aGlzLmxlYWZJbmRleCA9IGxlYXZlcy5pbmRleE9mKHRoaXMuYXBwLndvcmtzcGFjZS5hY3RpdmVMZWFmKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uS2V5RG93bihlOiBLZXlib2FyZEV2ZW50KSB7XG4gICAgICAgIGlmIChlLmtleSA9PSBcIkNvbnRyb2xcIikge1xuICAgICAgICAgICAgdGhpcy5jdHJsUHJlc3NlZFRpbWVzdGFtcCA9IGUudGltZVN0YW1wO1xuICAgICAgICAgICAgdGhpcy5jdHJsS2V5Q29kZSA9IGUuY29kZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uS2V5VXAoZTogS2V5Ym9hcmRFdmVudCkge1xuICAgICAgICBpZiAoZS5jb2RlID09IHRoaXMuY3RybEtleUNvZGUgJiYgdGhpcy5jdHJsUHJlc3NlZFRpbWVzdGFtcCkge1xuICAgICAgICAgICAgdGhpcy5jdHJsUHJlc3NlZFRpbWVzdGFtcCA9IDA7XG4gICAgICAgICAgICB0aGlzLmxlYXZlcyA9IG51bGw7XG5cbiAgICAgICAgICAgIHRoaXMubW9kYWw/LmNsb3NlKCk7XG5cbiAgICAgICAgICAgIHRoaXMubW9kYWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbnVubG9hZCgpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJ1bmxvYWRpbmcgcGx1Z2luOiBDeWNsZSB0aHJvdWdoIHBhbmVzXCIpO1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5rZXlEb3duRnVuYyk7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5rZXlVcEZ1bmMpO1xuICAgIH1cblxuICAgIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICAgICAgICB7fSxcbiAgICAgICAgICAgIERFRkFVTFRfU0VUVElOR1MsXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWREYXRhKClcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICAgfVxufVxuIl0sIm5hbWVzIjpbIlN1Z2dlc3RNb2RhbCIsIlNldHRpbmciLCJQbHVnaW5TZXR0aW5nVGFiIiwiUGx1Z2luIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLGFBQWEsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDbkMsSUFBSSxhQUFhLEdBQUcsTUFBTSxDQUFDLGNBQWM7QUFDekMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsWUFBWSxLQUFLLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3BGLFFBQVEsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQzFHLElBQUksT0FBTyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQztBQUNGO0FBQ08sU0FBUyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUNoQyxJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssVUFBVSxJQUFJLENBQUMsS0FBSyxJQUFJO0FBQzdDLFFBQVEsTUFBTSxJQUFJLFNBQVMsQ0FBQyxzQkFBc0IsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsK0JBQStCLENBQUMsQ0FBQztBQUNsRyxJQUFJLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDeEIsSUFBSSxTQUFTLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLEVBQUU7QUFDM0MsSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3pGLENBQUM7QUFvRkQ7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7QUFDaEgsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDL0QsUUFBUSxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0FBQ25HLFFBQVEsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0FBQ3RHLFFBQVEsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFO0FBQ3RILFFBQVEsSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFVBQVUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQzlFLEtBQUssQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUNEO0FBQ08sU0FBUyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRTtBQUMzQyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckgsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsT0FBTyxNQUFNLEtBQUssVUFBVSxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsV0FBVyxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM3SixJQUFJLFNBQVMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLE9BQU8sVUFBVSxDQUFDLEVBQUUsRUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3RFLElBQUksU0FBUyxJQUFJLENBQUMsRUFBRSxFQUFFO0FBQ3RCLFFBQVEsSUFBSSxDQUFDLEVBQUUsTUFBTSxJQUFJLFNBQVMsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBQ3RFLFFBQVEsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUk7QUFDdEQsWUFBWSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN6SyxZQUFZLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEQsWUFBWSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDekIsZ0JBQWdCLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU07QUFDOUMsZ0JBQWdCLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQztBQUN4RSxnQkFBZ0IsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztBQUNqRSxnQkFBZ0IsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsU0FBUztBQUNqRSxnQkFBZ0I7QUFDaEIsb0JBQW9CLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUU7QUFDaEksb0JBQW9CLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUU7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
