<%*
const file = app.workspace.getActiveFile();
if (!file) {
  new Notice("Templater: No active file.");
  return;
}

if (file.name !== "index.md") {
  new Notice("This script only works on index.md files.");
  return;
}

const folderPath = file.parent.path;  // folder path of current file
const folderName = folderPath.split("/").pop();

const content = await app.vault.read(file);

let newContent;

if (content.startsWith("---")) {
  // Frontmatter exists
  if (/^title:/m.test(content)) {
    // Replace existing title line
    newContent = content.replace(/^title:.*$/m, `title: ${folderName}`);
  } else {
    // Add title after the opening ---
    newContent = content.replace(/^---\s*\n/, `---\ntitle: ${folderName}\n`);
  }
} else {
  // No frontmatter - add new
  newContent = `---\ntitle: ${folderName}\n---\n\n${content}`;
}

await app.vault.modify(file, newContent);
new Notice(`Title set to "${folderName}"`);
%>