<%*
/* 𝗧𝗲𝗺𝗽𝗹𝗮𝘁𝗲𝗿:  Add/replace `title:` with filename minus leading underscore */

const file = app.workspace.getActiveFile();
if (!file) {
  new Notice("Templater: No active file.");
  return;
}

const fileName  = file.basename;          // e.g. _Projects
const cleanName = fileName.replace(/^_/, "");

const content = await app.vault.read(file);

let newContent;
if (content.startsWith("---")) {
  // Front‑matter exists
  if (/^title:/m.test(content)) {
    newContent = content.replace(/^title:.*$/m, `title: ${cleanName}`);
  } else {
    newContent = content.replace(/^---\s*\n/, `---\ntitle: ${cleanName}\n`);
  }
} else {
  // No front‑matter yet
  newContent = `---\ntitle: ${cleanName}\n---\n\n${content}`;
}

await app.vault.modify(file, newContent);
new Notice(`Title set to “${cleanName}”`);
%>