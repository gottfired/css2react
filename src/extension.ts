import * as vscode from "vscode";
import { reactToCss } from "./reactToCss";
import { cssToReact } from "./cssToReact";
import { splitEntry, camelCaseToDash } from "./helpers";

// TODO:
// - Check if variables can be converted to ${variable} syntax
// - TODO handle CSS containg quotes

// How to test: Simply run debug from VSCode
// How to publish: run vsce publish -p PERSONAL_ACCESS_TOKEN from here: https://gottfired.visualstudio.com/_details/security/tokens
// When generating token select full access AND ORGANIZATION "ALL ACCESSIBLE ACCOUNTS"

/**
 * Try to determine if text is CSS or React inline style
 */
function isCss(text: string): boolean {
    // Split into lines
    const lines = text.split(/\r?\n/);

    // Only consider lines with a ":", others are not considered styles
    const entries = lines.filter(line => line.indexOf(":") >= 0);
    if (entries.length === 0) {
        return false;
    }

    for (let entry of entries) {
        // Check if there is a camel case or kebap case key
        const [left, right] = splitEntry(entry);

        if (left.indexOf("-") >= 0) {
            // Contains a dash -> it's css
            return true;
        }

        if (camelCaseToDash(left).indexOf("-") >= 0) {
            // This was camel case -> it's react
            return false;
        }

        if (right.trim().slice(-1) === ";") {
            // Last character in line is ; -> assume it's css
            return true;
        }

        if (right.trim().slice(-1) === ",") {
            // Last character in line is , -> assume it's react
            return false;
        }
    }

    return true;
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
    console.log("activate css2react");

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand(
        "extension.css2react",
        () => {
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
        }
    );

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
