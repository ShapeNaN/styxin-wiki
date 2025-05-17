<%*
const vault = app.vault;
const folderPath = tp.file.folder(true);
const folderName = folderPath.split("/").pop();
const indexPath = `${folderPath}/${folderName}.md`; // Updated from index.md

// Get all files in vault
const allFiles = vault.getFiles();

// Get all files directly inside the folder (excluding the folder note itself)
const filesInFolder = allFiles.filter(f =>
    f.parent?.path === folderPath &&
    f.extension === "md" &&
    f.basename !== folderName
);

// Get all direct subfolders
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
    const noteFile = allFiles.find(f => f.path === notePath);
    return noteFile;
}).filter(f => f !== undefined);

// Generate link markdown
const fileLinks = filesInFolder.map(f => `- [[${f.basename}]]`);

const folderIndexLinks = subfolderNotes.map(f => {
    const subName = f.parent.name;
    return `- [[${f.path}|${subName}]]`;
});

const allLinksMarkdown = [...fileLinks, ...folderIndexLinks]
    .sort((a, b) => a.localeCompare(b))
    .join("\n");

// Read the current folder note
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

// Replace or append
if (content.includes(startMarker) && content.includes(endMarker)) {
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");
    content = content.replace(regex, newSection);
} else {
    content += `\n\n${newSection}`;
}

// Write updated note
await vault.modify(indexFile, content);
new Notice(`Updated ${fileLinks.length + folderIndexLinks.length} links in ${folderName}.md`);
%>