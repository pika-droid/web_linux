/**
 * Safe HTML Sanitizer
 * Parses HTML with native DOMParser and recursively sanitizes tags and attributes.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Use DOMParser to parse the HTML string
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Whitelist of safe formatting tags
  const allowedTags = new Set([
    'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'span', 'div'
  ]);

  // Recursively clean DOM nodes
  const cleanNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      return doc.createTextNode(node.nodeValue || '');
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();

      // Completely drop malicious active elements
      if (
        tagName === 'script' ||
        tagName === 'iframe' ||
        tagName === 'object' ||
        tagName === 'embed' ||
        tagName === 'style'
      ) {
        return null;
      }

      // If tag is not whitelisted, strip the tag but keep its children
      if (!allowedTags.has(tagName)) {
        const frag = doc.createDocumentFragment();
        el.childNodes.forEach((child) => {
          const cleanChild = cleanNode(child);
          if (cleanChild) frag.appendChild(cleanChild);
        });
        return frag;
      }

      // Whitelisted tag: create a new clean element
      const cleanEl = doc.createElement(tagName);

      // Only copy safe class attributes
      if (el.hasAttribute('class')) {
        cleanEl.setAttribute('class', el.getAttribute('class') || '');
      }

      // Copy style attribute only if it doesn't contain active content injection
      if (el.hasAttribute('style')) {
        const styleVal = el.getAttribute('style') || '';
        if (!/expression|url|behavior/i.test(styleVal)) {
          cleanEl.setAttribute('style', styleVal);
        }
      }

      // Recursively clean and append children
      el.childNodes.forEach((child) => {
        const cleanChild = cleanNode(child);
        if (cleanChild) cleanEl.appendChild(cleanChild);
      });

      return cleanEl;
    }

    return null;
  };

  const cleanFrag = doc.createDocumentFragment();
  doc.body.childNodes.forEach((child) => {
    const cleanChild = cleanNode(child);
    if (cleanChild) cleanFrag.appendChild(cleanChild);
  });

  const tempDiv = doc.createElement('div');
  tempDiv.appendChild(cleanFrag);
  return tempDiv.innerHTML;
}
