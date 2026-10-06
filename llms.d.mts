/**
 * @typedef {object} LlmsLink
 * @property {string} title
 * @property {string} url
 * @property {string} [description]
 */
/**
 * @typedef {object} LlmsSection
 * @property {string} heading
 * @property {LlmsLink[]} links
 */
/**
 * The llms.txt skeleton (llmstxt.org): title, a blockquote summary, optional intro paragraphs, then H2 sections of link lists.
 * A link's title is Markdown link text, so `[` and `]` are escaped; everything else is kept as written, because the titles are
 * prose and the sites' own files carry quotes and ampersands in them. A section with no links is dropped rather than left a
 * bare heading.
 *
 * @param {{ title: string, summary: string, intro?: string[], sections: LlmsSection[] }} doc
 * @returns {string}
 */
export function llmsDocument(doc: {
    title: string;
    summary: string;
    intro?: string[];
    sections: LlmsSection[];
}): string;
/** @param {LlmsLink} link */
export function llmsLink(link: LlmsLink): string;
export type LlmsLink = {
    title: string;
    url: string;
    description?: string;
};
export type LlmsSection = {
    heading: string;
    links: LlmsLink[];
};
