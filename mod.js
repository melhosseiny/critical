import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.12.24/mod.js";

console.log(Deno.args);

const index = await Deno.readTextFile(Deno.args[1]);
const dom_parser = new DOMParser();
const doc = dom_parser.parseFromString(index, 'text/html');
const links = Array.from(doc.querySelectorAll("link"));

const inline_css = async (href) => {
  const inline = await (await fetch(new URL(href, "http://localhost:8000").href)).text();
  const min = await esbuild.transform(inline, { loader: 'css', minify: true });
  return min.code;
}

const replace_link_with_inline_css = async (link) => {
  const href = link.getAttribute("href");
  const inline = await inline_css(href);
  const styleEl = doc.createElement("style");
  styleEl.appendChild(doc.createTextNode(inline));
  link.replaceWith(styleEl);
}

const css_links = links.filter(link => link.getAttribute("rel") === "stylesheet");
for (const link of css_links) {
  await replace_link_with_inline_css(link);
}

const html = `<!DOCTYPE html>
${doc.childNodes[1].outerHTML}`;

await Deno.writeTextFile("index_inline.html", html);

esbuild.stop()
