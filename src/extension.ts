'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// TODO:
// - Allow selection to contain non CSS parts
// - Check if variables can be converted to ${variable} syntax




function dashToCamelCase(text: string): string {
    return text.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

function camelCaseToDash(text: string): string {
    return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Splite a line like "minWidth: bla ? 10 : 20" into
 * ["minWidth", "bla ? 10 : 20"]
 */
function splitEntry(entry: string): Array<string> {
    let [left, ...rest] = entry.split(":");
    let right = rest.join(":");
    return [left, right];
}

/**
 * Try to determine if text is CSS or React inline style
 */
function isCss(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed.indexOf(",") >= 0 ||
        trimmed.indexOf("'") >= 0 ||
        trimmed.indexOf('"') >= 0) {
        return false;
    }

    // Split into lines
    const lines = text.split(/\r?\n/);
    const entries = lines.filter(line => line.indexOf(":") >= 0);
    if (entries.length === 0) {
        return false;
    }

    // Check if there is a camel case key
    const [left, right] = splitEntry(entries[0]);
    if (left.indexOf("-") >= 0) {
        return true;
    }

    if (camelCaseToDash(left).indexOf("-") >= 0) {
        return false;
    }

    return true;
}

/**
 * Join left and right to final style entry
 */
function joinLine(left: string, right: string) {
    if (left.trim().length > 0 && right.trim().length > 0) {
        return left + ":" + right;
    } else {
        return "";
    }
}

/**
 * Split selection into part before the actual style entries, the style entries 
 * and the stuff after. So users don't have to be that specific with their selection
 */
function splitPreMiddlePost(text: string, separator: string): Array<string> {
    const lines = text.split(/\r?\n/);
    const prefixLines = [];
    const middleLines = [];
    const postfixLines = [];
    lines.forEach((line, index) => {
        if (middleLines.length === 0) {
            // A style line must contain : and , or ; except for the last one in inline styles
            if (line.indexOf(":") < 0 ||
                (index < line.length - 1 && line.indexOf(separator) < 0 && separator === ",")) {
                prefixLines.push(line);
            } else {
                middleLines.push(line);
            }
        } else if (postfixLines.length === 0) {
            if (line.indexOf(":") >= 0) {
                middleLines.push(line);
            } else {
                postfixLines.push(line);
            }
        } else {
            postfixLines.push(line);
        }
    });

    const prefix = prefixLines.join("\n");
    const middle = middleLines.join("\n");
    const postfix = postfixLines.join("\n");

    // console.log("prefix", prefix);
    // console.log("middle", middle);
    // console.log("postfix", postfix);

    return [prefix, middle, postfix];
}


function joinConditional(strings: Array<string>): string {
    const result = strings.filter(s => s != null && s.length > 0);
    return result.join("\n");
}


/**
 * Convert from css to react style
 */
function cssToReact(text: string): string {

    const [prefix, middle, postfix] = splitPreMiddlePost(text, ";");

    const entries = middle.split(";");
    const converted = entries
        .map(entry => {
            let [left, right] = splitEntry(entry);

            left = dashToCamelCase(left);

            // Remove px postfix
            if (right.trim().endsWith("px")) {
                right = right.slice(0, -2);
            }

            // Add quotes on right if not a number
            if (isNaN(Number(right))) {
                right = ` "${right.trim()}"`
            }

            return joinLine(left, right);
        })
        .join(",");

    return joinConditional([prefix, converted, postfix]);
}


/**
 * Right trim a string
 */
function rtrim(text: string): string {
    return text.replace(/~+$/, '');
}

/**
 * Check if unitless CSS property. See here: https://react-cn.github.io/react/tips/style-props-value-px.html
 */
function isUnitlessProperty(property: string): boolean {
    return ["animationIterationCount",
        "boxFlex",
        "boxFlexGroup",
        "boxOrdinalGroup",
        "columnCount",
        "fillOpacity",
        "flex",
        "flexGrow",
        "flexPositive",
        "flexShrink",
        "flexNegative",
        "flexOrder",
        "fontWeight",
        "lineClamp",
        "lineHeight",
        "opacity",
        "order",
        "orphans",
        "stopOpacity",
        "strokeDashoffset",
        "strokeOpacity",
        "strokeWidth",
        "tabSize",
        "widows",
        "zIndex",
        "zoom"].indexOf(property.trim()) !== -1;
}



/**
 * Convert from react to css style
 */
function reactToCss(text: string): string {
    const [prefix, middle, postfix] = splitPreMiddlePost(text, ",");

    const entries = middle.split(",");
    let converted = entries
        .map(entry => {
            // Remove all quotes
            const globalQuoteRegex = /"|'/g;
            return entry.replace(globalQuoteRegex, "");
        })
        .map(entry => {
            let [left, right] = splitEntry(entry);

            // Add default px. MUST be done before camel case conversion
            if (!isNaN(Number(right)) &&
                !isUnitlessProperty(left)) {
                right = rtrim(right) + "px"
            }

            left = camelCaseToDash(left);

            return joinLine(left, right);
        })
        .join(";");

    // Append ; if last inline style line didn't contain a ,
    if (converted[converted.length - 1] !== ";") {
        converted += ";";
    }

    return joinConditional([prefix, converted, postfix]);
}

/**
 * Entry point for conversion
 */
function convert(text: string): string {
    if (isCss(text)) {
        console.log("cssToReact");
        return cssToReact(text);
    } else {
        console.log("reactToCss");
        return reactToCss(text);
    }
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "css2react" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.css2react', () => {
        // The code you place here will be executed every time your command is executed

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            // No open text editor
            return;
        }

        // Get text from selection
        var selection = editor.selection;
        var text = editor.document.getText(selection);

        // Replace selection with converted text
        editor.edit(builder => {
            builder.replace(selection, convert(text));
        });
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}