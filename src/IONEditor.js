import {fromJSONObject, toJSONText, highlightION} from "ion2";

function insertTextAtCursor(el, text) {
    var val = el.value, endIndex, range, doc = el.ownerDocument;
    if (typeof el.selectionStart == "number"
            && typeof el.selectionEnd == "number") {
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

export default class IONEditor{

    constructor(container){

        this.textStyle = {
            "background": "transparent",
            "z-index": 2,
            "height": "auto",
            "resize": "none",
            "-webkit-text-fill-color": "transparent",
            "outline" : "none"
        };

        this.textCodeStyle = {
            "position": "absolute",
            "top": '0px',
            "left": 0,
            "width": '550px',
            "font-family" : '"Inconsolata", "TheSansMono Office", "FiraSans Mono, monospace"',
            "font-size":"12px",
            "letter-spacing": "-0.05em",
            "line-height": "150%",
            "padding":"10px",
            "resize": "none",
            "border" : "none",
            "border-radius": "5px",
            "overflow-x": "scroll",
            "overflow-y": "scroll"
        }

        this.edit = document.createElement('textarea');
        this.edit.setAttribute("id", "textedit");
        this.edit.setAttribute("spellcheck", "false");
        this.edit.setAttribute('class', 'editor');
    
        for (let prop in this.textStyle) this.edit.style[prop] = this.textStyle[prop];
        for (let prop in this.textCodeStyle) this.edit.style[prop] = this.textCodeStyle[prop];

        container.appendChild(this.edit);

        this.preStyle = {
            "white-space": "pre-wrap",
            "word-wrap": "break-word"
        }
        
        this.codeStyle = {
            "background": "#fdf6e3",
            "z-index": 1
        }
        

        let pre   = document.createElement('pre');
        this.disp = document.createElement('code');
        this.disp.setAttribute("id", "textdisp");
        this.disp.setAttribute('class', 'editor editor-display');
        pre.appendChild(this.disp);
        container.appendChild(pre);

        for (let prop in this.preStyle) pre.style[prop] = this.preStyle[prop];
        for (let prop in this.textCodeStyle) this.disp.style[prop] = this.textCodeStyle[prop];
        for (let prop in this.codeStyle) this.disp.style[prop] = this.codeStyle[prop];


        this.init();
    }

    init(){

        let lineLength = 120;

        window.addEventListener("keydown", function(e){

            if (e.key === "Tab"){
                e.preventDefault();
                this.edit.value.split("\n")
                insertTextAtCursor(this.edit, "  ");

            }if(e.key==="Enter" && e.ctrlKey && e.shiftKey){
                let JSONText  = toJSONText(this.edit.value),
                    JSONobj   = JSON.parse(JSONText),
                    finalText = fromJSONObject(JSONobj, lineLength);
                this.edit.value = finalText;
                this.edit.focus();

                e.target.dispatchEvent(new CustomEvent('interpret', { bubbles: true, detail: JSONobj }));

            } else if(e.key==="Enter" && e.ctrlKey){
                // this.strokeBase.submit(this.input.value);
            }
        
        }.bind(this));

        this.edit.addEventListener("input", function(e){

            console.log("yaya");
            this.edit.style.height = this.edit.scrollHeight;
            var  content = this.edit.value;
            this.disp.innerHTML = highlightION(content, "", "color:#d33682;")+"\n ";
    
        }.bind(this));

        this.edit.innerText = "@ ";
        this.disp.innerHTML = highlightION("@ ", "", "color:#d33682;")+"\n ";
        this.edit.focus();
    }

    highlight(){

    }

    update(text){
        this.edit.value = text;
        this.highlight();
    }
}
