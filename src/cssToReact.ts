import {
    getQuotes,
    splitPreMiddlePost,
    splitEntry,
    joinLine,
    joinConditional
} from "./helpers";

function dashToCamelCase(text: string): string {
    return text.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

/**
 * Convert from css to react style
 */
export function cssToReact(text: string): string {
    const [prefix, middle, postfix] = splitPreMiddlePost(text, ";");

    console.log("### middle", middle);

    const QUOTES = getQuotes();
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
                right = ` ${QUOTES}${right.trim()}${QUOTES}`;
            }

            return joinLine(left, right);
        })
        .join(",");

    return joinConditional([prefix, converted, postfix]);
}
