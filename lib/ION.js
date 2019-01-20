'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.fromJSONObject = fromJSONObject;
exports.toJSONText = toJSONText;
exports.highlightION = highlightION;
var indentWidth = 4,
    lineLength = 120;

/**
 * determine whether a string should be quoted.
 * @param {string} str input string
 */
function quoteString(str) {
    return str.match(/[ @]/) ? '"' + str + '"' : str;
}

/**
 * insert prefix before warped array
 * @param {string} e element
 * @param {number} i index
 */
function arrayWarpedPrefix(e, i) {
    return (i == 0 ? "@ " : "  ") + e;
}

/**
 * insert prefix before warped object
 * @param {string} e element
 * @param {number} i element index
 */
function objectWarpedPrefix(e, i) {
    return (i == 0 ? "# " : "  ") + e;
}

/**
 * warp a series of object in a key-value pair, aligning to the key
 * @param {string} e element
 * @param {number} i index
 * @param {stirng} key the key followed by
 */
function objectWarpedKey(e, i, key) {
    var quotedKey = quoteString(key);
    return (i == 0 ? quotedKey + ": " : " ".repeat(quotedKey.length + 2)) + e;
}

/**
 * warp to next line after key in order to save more space.
 * @param {string} returnedArray array of element returned from next level
 * @param {*} key the key of current key-value pair
 */
function objectWarpedKeyNext(returnedArray, key) {
    return [key + ":"].concat(returnedArray.map(function (e) {
        return " " + e;
    }));
}

/**
 * process if an array of next level is identified.
 * @param {object} object sub-level of object.
 * @param {function} recurFunc the call-back recursive function.
 * @param {number} remLen remaining length of current line
 */
function handleArray(object, recurFunc, remLen) {
    var res = object.map(function (e) {
        return recurFunc(e, remLen - 2);
    }).flat(),
        joined = res.join(' '),
        notAtomic = res.some(function (e) {
        return e.includes("@") || e.includes("#");
    }),
        warpCond = notAtomic || joined.length > remLen;

    return warpCond ? res.map(arrayWarpedPrefix) : ["@ " + joined];
}

/**
 * 
 * @param {object} object object to be handled
 * @param {function} recurFunc 
 * @param {*} remLen 
 */
function handleObject(object, recurFunc, remLen) {

    //  First we get all keys of the object in current level. Note that all keys' value
    //  has been done by recurFunc. the resSameLine is an array of key-value pairs.
    //  if there is no # or @, then it must be either string or number, which we call it
    //  atomic.

    //  If an element is not atomic, then it must be warped.

    var keys = Object.keys(object),
        resSameLine = keys.map(function (k) {
        return { key: k, val: recurFunc(object[k], remLen - k.length) };
    }),
        notAtomic = resSameLine.map(function (e) {
        return e.val.some(function (e) {
            return e.includes("@") || e.includes("#");
        });
    }).some(function (e) {
        return e;
    });

    var joined = resSameLine.map(function (e) {
        return quoteString(e.key) + ": " + e.val[0];
    }).join(" "),
        warpSamelineCond = notAtomic || joined.length > remLen,
        warpedSameLine = resSameLine.map(function (e) {
        return e.val.map(function (v, i) {
            return objectWarpedKey(v, i, e.key);
        });
    }).flat(),
        warpNextLineCond = warpedSameLine.some(function (e) {
        return e.length > lineLength;
    }),
        resNextLine = keys.map(function (k) {
        return { key: k, val: recurFunc(object[k], remLen - 2) };
    }),
        warpedNextLine = resNextLine.map(function (e) {
        return objectWarpedKeyNext(e.val, e.key);
    }).flat();

    return warpNextLineCond ? warpedNextLine.map(objectWarpedPrefix) : warpSamelineCond ? warpedSameLine.map(objectWarpedPrefix) : ["# " + joined];
}

/**
 * fromJSONObject
 * 
 * @param {object} object object to be interpreted
 * @param {number} currCursor the current place of interpreted string
 * @param {number} nextLineCursor the position where the warped line starts
 * 
 * @returns {object} an array of string
 */
function fromJSONObjectRecursive(object, remLen) {

    switch (typeof object === 'undefined' ? 'undefined' : _typeof(object)) {
        case "string":
            return [quoteString(object)];
        case "number":

            return [object % 1 == 0 ? object.toString() : object.toFixed(3)];
        case "object":
            var res = Array.isArray(object) ? handleArray(object, fromJSONObjectRecursive, remLen) : handleObject(object, fromJSONObjectRecursive, remLen);

            return res;
    }
}

function fromJSONObject(object) {
    return fromJSONObjectRecursive(object, lineLength).join("\n");
}

function returnRightBracket(stack) {
    var pairs = { "{": "}", "[": "]", ":": "" };
    return pairs[stack[stack.length - 1].type];
}

//  The only thing that really matter is the end of indentation.
//  so this function will scan the text line by line, word by word.
//  when meet @, push stack with [, and # with { . when encounter
//  the ", find the next " and append to text with string, or anything 
//  end with space or comma.

//  对于向JSON的转换，由于头部的@, [, #等都给出清晰的提示，因此重要的是判断
//  结束缩进时是从哪一层退出。
function toJSONText(text) {

    var lines = text.split("\n").filter(function (e) {
        return !e.match(/^\s*$/);
    });

    var resultText = "",
        stack = [],
        currIndent = 0;

    for (var i = 0; i < lines.length; i++) {

        var lineIndent = lines[i].search(/\S|$/);
        while (stack.length > 0 && stack[stack.length - 1].indent >= lineIndent) {
            resultText += returnRightBracket(stack);
            stack.pop();
        }

        currIndent = 0;
        var currLineRem = lines[i];

        while (currLineRem.length > 0) {
            switch (currLineRem[0]) {
                case " ":
                    // a space, might be a delimiter (comma)

                    if (stack[stack.length - 1].comma) resultText += ", ";else stack[stack.length - 1].comma = true;

                    currIndent += currLineRem.search(/\S|$/);
                    currLineRem = currLineRem.trim();
                    break;

                case "@":
                    // beginning of an arary
                    resultText += "[";stack.push({ type: "[", indent: currIndent, comma: false });
                    currIndent += 1;
                    currLineRem = currLineRem.slice(1);
                    break;

                case "#":
                    // beginning of an object
                    resultText += "{";stack.push({ type: "{", indent: currIndent, comma: false });
                    currIndent += 1;
                    currLineRem = currLineRem.slice(1);
                    break;

                case ":":
                    resultText += ":";stack.push({ type: ":", indent: currIndent });
                    currIndent += 1;
                    currLineRem = currLineRem.slice(1);
                    break;

                case '"':
                    // beginning of a quoted string. Notably, we don't accept
                    // a single quotation mark appearing on a single line.

                    var quoted = currLineRem.match(/"(?:\\"|[^"])*"/);
                    if (!quoted) throw "Quoted string missing at Line: " + i;

                    if (stack.length > 0 && stack[stack.length - 1].type == ":") stack.pop();
                    currIndent += quoted[0].length;
                    resultText += currLineRem.slice(0, quoted[0].length);
                    currLineRem = currLineRem.slice(quoted[0].length);
                    break;

                default:
                    // means we meet a simple string, that a string doesn't
                    // contains space, and quotation marks on both ends.
                    // however, it's okay to contain a single quotation mark
                    // in the middle of the string.
                    // console.log("gotcha");
                    var simple = currLineRem.match(/[^\s:]*/);
                    if (!simple) throw "Simple string got some problem at Line: " + 1;
                    if (stack.length > 0 && stack[stack.length - 1].type == ":") {
                        stack.pop();
                    }

                    currIndent += simple[0].length;

                    var result = currLineRem.slice(0, simple[0].length),
                        parsed = parseFloat(result);

                    resultText += !parsed && parsed != 0 ? '"' + result + '"' : parsed;

                    currLineRem = currLineRem.slice(simple[0].length);
                    break;

            }
        }
    }

    while (stack.length > 0 && stack[stack.length - 1].indent >= 0) {
        resultText += returnRightBracket(stack);
        stack.pop();
    }

    return resultText;
}

function highlightION(text) {
    return text.split('\n').map(function (t) {
        return t.replace(/(\S+\s*)(?=:)/g, '<b>$1</b>').replace(/([#@:])/g, '<b style="color:#d33682;">$1</b>');
    }).join('\n');
}

function test() {
    var cases = {
        "simpleString": "asd",
        "simpleNumber": 3.1415926,
        "simpleList": ["a", "b", "c"],
        "simpleNestedList": ["a", ["inner-a", "inner-b"], "c"],
        "longerNestedList": ["a", ["inner-a which contains longer string that can't hold by single line", "inner-b which contains longer string that can't hold by single line as well"], "c"],
        "tripleNestedList": ["a", ["inner-a", ["inner-b"]], "c"],
        "arrayWithObject": ["a", ["inner-a", { "inner-b": "asd" }], "c"],
        "simpleObject": { a: 1, b: 2, c: 3 },
        "nestedObject": { a: 1, b: { n1: 1, n2: 2 }, c: 3 },
        "tripleNestedObject": { a: 1, b: { n1: 1, n3: { n2: 2 } }, c: 3 },
        "objectWithArray": { a: 1, b: { n1: 1, n3: ["inner-a which contains longer string that can't hold by single line", "inner-b which contains longer string that can't hold by single line as well"] }, c: 3 }
        // "objectWithLongLey": {"this is really a long key, and wait for a line wrap":["and literally a really really long value to the key", "and anothe rvalue"],
        //                         "this is another long key":"and literally a long value to the key"}
    };

    for (var i in cases) {
        console.log("\n");
        console.log("Case : ", i, "\n");
        var x = fromJSON(cases[i]);
        console.log(highlightION(x));
        // console.log(toJSON(x));
    }
}
//# sourceMappingURL=ION.js.map