// update‑folder‑notes.js
// Run from vault root:  node update-folder-notes.js

console.log("Current working directory:", process.cwd());

const fs   = require("fs");
const path = require("path");

const VAULT_ROOT = process.cwd();
const CONTENT_DIR = path.join(VAULT_ROOT, "content");

const START = "<!-- LINKS START -->";
const END   = "<!-- LINKS END -->";

function isMD(p)       { return p.toLowerCase().endsWith(".md"); }
function mdLink(p)     { return p.replace(/\\/g, "/"); }

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    entry.isDirectory() ? walk(full, cb) : cb(full);
  }
}

function processFolder(folderPath) {
  const folderName = path.basename(folderPath);
  const notePath = path.join(folderPath, `${folderName}.md`);
  if (!fs.existsSync(notePath)) return;                       // no folder note → skip

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  // local files (direct children, md, not the folder note)
  const localLinks = entries
    .filter(e => e.isFile() && isMD(e.name) && e.name !== `${folderName}.md`)
    .map(e => `- [[${mdLink(path.relative(VAULT_ROOT, path.join(folderPath, e.name)))}]]`);

  // direct subfolders’ notes
  const subLinks = entries
    .filter(e => e.isDirectory())
    .map(dir => {
      const subNote = path.join(folderPath, dir.name, `${dir.name}.md`);
      return fs.existsSync(subNote)
        ? `- [[${mdLink(path.relative(VAULT_ROOT, subNote))}|${dir.name}]]`
        : null;
    })
    .filter(Boolean);

  const block = `${START}\n${[...localLinks, ...subLinks].sort().join("\n")}\n${END}`;

  let content = fs.readFileSync(notePath, "utf8");
  if (content.includes(START) && content.includes(END)) {
    const re = new RegExp(`${START}[\\s\\S]*?${END}`, "m");
    content = content.replace(re, block);
  } else {
    content += `\n\n${block}`;
  }
  fs.writeFileSync(notePath, content, "utf8");
  console.log("✔︎ updated", mdLink(path.relative(VAULT_ROOT, notePath)));
}

// ---- main ----
walk(CONTENT_DIR, p => {
  // for each .md we encounter, we only act when it’s X/X.md; so just look at its folder
  if (isMD(p)) {
    const parent = path.dirname(p);
    processFolder(parent);
  }
});

console.log("\nAll folder notes processed.");
