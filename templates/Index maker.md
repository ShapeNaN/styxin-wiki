<%*
const vault = app.vault;
const folderPath = tp.file.folder(true);
const folderName = folderPath.split("/").pop();
const indexPath = `${folderPath}/${folderName}.md`;

// Get all files in vault
const allFiles = vault.getFiles();

// Get all files directly inside the folder (excluding the index file itself)
const filesInFolder = allFiles.filter(f =>
    f.parent?.path === folderPath &&
    f.extension === "md" &&
    f.basename !== folderName
);

// Get all direct subfolders by looking at parent folders of files
const directSubfolders = [...new Set(
    allFiles
        .filter(f => f.parent?.path?.startsWith(folderPath + "/"))
        .map(f => {
            // get first-level subfolder relative to folderPath
            const rel = f.parent.path.slice(folderPath.length + 1);
            return rel.split("/")[0];
        })
)];

// Now get index files of those subfolders
const subfolderIndexes = directSubfolders.map(subfolderName => {
    return allFiles.find(f =>
        f.parent?.path === folderPath + "/" + subfolderName &&
        f.basename === subfolderName
    );
}).filter(f => f !== undefined);

// Combine regular files and subfolder index files
const allLinks = [
    ...filesInFolder.map(f => f.basename),
    ...subfolderIndexes.map(f => f.basename)
].sort((a, b) => a.localeCompare(b));

// Read existing index file content or empty string
let indexFile = vault.getAbstractFileByPath(indexPath);
let content = "";
if (indexFile) {
    content = await vault.read(indexFile);
} else {
    new Notice(`Index file does not exist: ${indexPath}`);
    return;
}

// Define markers to replace links section
const startMarker = "<!-- LINKS START -->";
const endMarker = "<!-- LINKS END -->";

const newLinksMarkdown = allLinks.map(name => `- [[${name}]]`).join("\n");
const newSection = `${startMarker}\n${newLinksMarkdown}\n${endMarker}`;

// Replace existing section or append
if (content.includes(startMarker) && content.includes(endMarker)) {
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");
    content = content.replace(regex, newSection);
} else {
    content += `\n\n${newSection}`;
}

// Write updated content back to index file
await vault.modify(indexFile, content);

new Notice(`Updated ${allLinks.length} links in ${folderName}.md`);
%>