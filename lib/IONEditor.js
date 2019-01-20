"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ion = require("ion2");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function insertTextAtCursor(el, text) {
    var val = el.value,
        endIndex,
        range,
        doc = el.ownerDocument;
    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        endIndex = el.selectionEnd;
        el.value = val.slice(0, endIndex) + text + val.slice(endIndex);
        el.selectionStart = el.selectionEnd = endIndex + text.length;
    } else if (doc.selection != "undefined" && doc.selection.createRange) {
        el.focus();
        range = doc.selection.createRange();
        range.collapse(false);
        range.text = text;
        range.select();
    }
}

var IONEditor = function () {
    function IONEditor(container) {
        _classCallCheck(this, IONEditor);

        this.textStyle = {
            "background": "transparent",
            "z-index": 2,
            "height": "auto",
            "resize": "none",
            "-webkit-text-fill-color": "transparent",
            "outline": "none"
        };

        this.textCodeStyle = {
            "position": "absolute",
            "top": '0px',
            "left": 0,
            "width": '550px',
            "font-family": '"Inconsolata", "TheSansMono Office", "FiraSans Mono, monospace"',
            "font-size": "12px",
            "letter-spacing": "-0.05em",
            "line-height": "150%",
            "padding": "10px",
            "resize": "none",
            "border": "none",
            "border-radius": "5px",
            "overflow-x": "scroll",
            "overflow-y": "scroll"
        };

        this.edit = document.createElement('textarea');
        this.edit.setAttribute("id", "textedit");
        this.edit.setAttribute("spellcheck", "false");
        this.edit.setAttribute('class', 'editor');

        for (var prop in this.textStyle) {
            this.edit.style[prop] = this.textStyle[prop];
        }for (var _prop in this.textCodeStyle) {
            this.edit.style[_prop] = this.textCodeStyle[_prop];
        }container.appendChild(this.edit);

        this.preStyle = {
            "white-space": "pre-wrap",
            "word-wrap": "break-word"
        };

        this.codeStyle = {
            "background": "#fdf6e3",
            "z-index": 1
        };

        var pre = document.createElement('pre');
        this.disp = document.createElement('code');
        this.disp.setAttribute("id", "textdisp");
        this.disp.setAttribute('class', 'editor editor-display');
        pre.appendChild(this.disp);
        container.appendChild(pre);

        for (var _prop2 in this.preStyle) {
            pre.style[_prop2] = this.preStyle[_prop2];
        }for (var _prop3 in this.textCodeStyle) {
            this.disp.style[_prop3] = this.textCodeStyle[_prop3];
        }for (var _prop4 in this.codeStyle) {
            this.disp.style[_prop4] = this.codeStyle[_prop4];
        }this.init();
    }

    _createClass(IONEditor, [{
        key: "init",
        value: function init() {

            var lineLength = 120;

            window.addEventListener("keydown", function (e) {

                if (e.key === "Tab") {
                    e.preventDefault();
                    this.edit.value.split("\n");
                    insertTextAtCursor(this.edit, "  ");
                }if (e.key === "Enter" && e.ctrlKey && e.shiftKey) {
                    var JSONText = (0, _ion.toJSONText)(this.edit.value),
                        JSONobj = JSON.parse(JSONText),
                        finalText = (0, _ion.fromJSONObject)(JSONobj, lineLength);
                    this.edit.value = finalText;
                    this.edit.focus();

                    e.target.dispatchEvent(new CustomEvent('interpret', { bubbles: true, detail: JSONobj }));
                } else if (e.key === "Enter" && e.ctrlKey) {
                    // this.strokeBase.submit(this.input.value);
                }
            }.bind(this));

            this.edit.addEventListener("input", function (e) {

                console.log("yaya");
                this.edit.style.height = this.edit.scrollHeight;
                var content = this.edit.value;
                this.disp.innerHTML = (0, _ion.highlightION)(content, "", "color:#d33682;") + "\n ";
            }.bind(this));

            this.edit.innerText = "@ ";
            this.disp.innerHTML = (0, _ion.highlightION)("@ ", "", "color:#d33682;") + "\n ";
            this.edit.focus();
        }
    }, {
        key: "highlight",
        value: function highlight() {}
    }, {
        key: "update",
        value: function update(text) {
            this.edit.value = text;
            this.highlight();
        }
    }]);

    return IONEditor;
}();

exports.default = IONEditor;
//# sourceMappingURL=IONEditor.js.map