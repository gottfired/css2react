import {
    getQuotes,
    splitPreMiddlePost,
    splitEntry,
    joinLine,
    joinConditional,
    camelCaseToDash
} from "./helpers";

/**
 * Right trim a string
 */
function rtrim(text: string): string {
    return text.replace(/~+$/, "");
}

/**
 * Check if unitless CSS property. See here: https://react-cn.github.io/react/tips/style-props-value-px.html
 */
function isUnitlessProperty(property: string): boolean {
    return (
        [
            "animationIterationCount",
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
            "zoom"
        ].indexOf(property.trim()) !== -1
    );
}

/**
 * Split react style at commas, but not inside stuff like "rgba(a,r,g,b)"
 * Taken from here: https://stackoverflow.com/a/31955570/677910
 * @param text
 */
function splitReact(str: string) {
    const QUOTES = getQuotes();
    return str.split(",").reduce(
        (accum, curr) => {
            if (accum.isConcatting) {
                accum.soFar[accum.soFar.length - 1] += "," + curr;
            } else {
                accum.soFar.push(curr);
            }

            if (curr.split(QUOTES).length % 2 == 0) {
                accum.isConcatting = !accum.isConcatting;
            }

            return accum;
        },
        { soFar: [], isConcatting: false }
    ).soFar;
}

/**
 * Convert from react to css style
 */
export function reactToCss(text: string): string {
    const [prefix, middle, postfix] = splitPreMiddlePost(text, ",");

    console.log("middle", middle);

    const entries = splitReact(middle); // middle.split(",");

    console.log("entries", entries);

    let converted = entries
        .map(entry => {
            // Remove all quotes
            const globalQuoteRegex = /"|'/g;
            return entry.replace(globalQuoteRegex, "");
        })
        .map(entry => {
            let [left, right] = splitEntry(entry);

            // Add default px. MUST be done before camel case conversion
            if (!isNaN(Number(right)) && !isUnitlessProperty(left)) {
                right = rtrim(right) + "px";
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
