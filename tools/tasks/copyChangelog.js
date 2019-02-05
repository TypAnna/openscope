const fs = require('fs');
const showdown = require('showdown');
const colors = require('ansi-colors');
const fancyLog = require('fancy-log');
const OPTIONS = require('../options');

/**
 * Loads the changelog markdown into a string, and then returns it.
 *
 * @method loadChangelogMarkdown
 * @returns {String} the raw markdown of the changelog
 */
function loadChangelogMarkdown() {
    const sourceFile = OPTIONS.FILE.CHANGELOG_SOURCE;
    const sourceMarkdown = fs.readFileSync(sourceFile, { encoding: 'utf8' });

    return sourceMarkdown;
}

/**
 * Encapsulates the `makeHtml(String)` function provided by showdown.
 *
 * @method parseMarkdown
 * @param {String} markdown 
 * @returns {String} parsed html
 */
function parseMarkdown(markdown) {
    const converter = new showdown.Converter({ simpleLineBreaks: true });

    return converter.makeHtml(markdown);
}

/**
 * Gets the first `h1` HTML element in the stringified HTML.
 *
 * @method getHtmlElement
 * @param {String} totalHtml
 * @returns {String} the HTML section
 */
function getHtmlElement(totalHtml) {
    const searchKey = '<h1';
    // The second element, because the first should be a null string
    const foundHtml = totalHtml.split(searchKey)[1];

    return searchKey + foundHtml;
}

/**
 * Writes the changelog string to the destination file.
 *
 * @method writeOutput
 * @param {String} stringToWrite
 */
function writeOutput(stringToWrite) {
    const destFile = OPTIONS.FILE.CHANGELOG_DEST;
    const outputJSON = JSON.stringify({
        changelog: stringToWrite
    });

    fs.writeFile(destFile, outputJSON, err => {
        if (err) {
            fancyLog(colors.red('--- Failed to write the changelog to public/assets'));
            Promise.reject(err);
        }
    });
}

/**
 * Gets the changelog at `${root}/CHANGELOG.md`, converts the markdown
 * to HTML, gets the most recent entry, and then writes the stringified
 * HTML to a JSON file at `public/assets/changelog.json`.
 *
 * @method copyChangelog
 * @returns Promise resolution
 */
function copyChangelog() {
    const markdown = loadChangelogMarkdown();
    const html = parseMarkdown(markdown);
    const changelogString = getHtmlElement(html);

    writeOutput(changelogString);

    fancyLog(colors.green('--- Writing changelog to public/assets/changelog.json'));

    return Promise.resolve();
}

module.exports = copyChangelog;
