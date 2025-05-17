---
title:
---
<%*
const vault = app.vault;
const folderPath = tp.file.folder(true);
const folderName = folderPath.split("/").pop();
const indexPath = `${folderPath}/${folderName}.md`; // Folder note file

// Helper: remove leading 'content/' and strip '.md'
function mdLink(p) {
    return p
        .replace(/^content\//, "")
        .replace(/\.md$/, "");
}

// Get all files in vault
const allFiles = vault.getFiles();

// Get all files directly inside the folder (excluding the folder note itself)
const filesInFolder = allFiles.filter(f =>
    f.parent?.path === folderPath &&
    f.extension === "md" &&
    f.basename !== folderName
);

// Get all direct subfolders inside this folder
const directSubfolders = [...new Set(
    allFiles
        .filter(f => f.path.startsWith(folderPath + "/") && f.parent?.path !== folderPath)
        .map(f => {
            const relativePath = f.path.slice(folderPath.length + 1);
            return relativePath.split("/")[0];
        })
)];

// Get folder notes of subfolders
const subfolderNotes = directSubfolders.map(subfolderName => {
    const subfolderPath = `${folderPath}/${subfolderName}`;
    const notePath = `${subfolderPath}/${subfolderName}.md`;
    return allFiles.find(f => f.path === notePath);
}).filter(f => f !== undefined);

// Build file links with relative path and display just basename
const fileLinks = filesInFolder.map(f => {
    const relativePath = mdLink(f.path);
    const displayName = f.basename;
    return `- [[${relativePath}|${displayName}]]`;
});

// Build folder note links with relative path and folder name as display
const folderIndexLinks = subfolderNotes.map(f => {
    const relativePath = mdLink(f.path);
    const displayName = f.parent.name;
    return `- [[${relativePath}|${displayName}]]`;
});

// Combine and sort links
const allLinksMarkdown = [...fileLinks, ...folderIndexLinks]
    .sort((a, b) => a.localeCompare(b))
    .join("\n");

// Read the current folder note content
let indexFile = vault.getAbstractFileByPath(indexPath);
if (!indexFile) {
    new Notice(`Folder note missing: ${indexPath}`);
    return;
}
let content = await vault.read(indexFile);

// Section markers
const startMarker = "<!-- LINKS START -->";
const endMarker = "<!-- LINKS END -->";
const newSection = `${startMarker}\n${allLinksMarkdown}\n${endMarker}`;

// Replace or append the links section
if (content.includes(startMarker) && content.includes(endMarker)) {
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");
    content = content.replace(regex, newSection);
} else {
    content += `\n\n${newSection}`;
}

// Write updated note content
await vault.modify(indexFile, content);
new Notice(`Updated ${fileLinks.length + folderIndexLinks.length} links in ${folderName}.md`);
%>