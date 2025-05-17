<%*
const vault = app.vault;
const folderPath = tp.file.folder(true);
const folderName = folderPath.split("/").pop();
const indexPath = `${folderPath}/index.md`;

// Get all files in vault
const allFiles = vault.getFiles();

// Get all files directly inside the folder (excluding the index file itself)
const filesInFolder = allFiles.filter(f =>
    f.parent?.path === folderPath &&
    f.extension === "md" &&
    f.basename !== "index"
);

// Get all direct subfolders by looking at parent folders of files
const directSubfolders = [...new Set(
    allFiles
        .filter(f => f.parent?.path?.startsWith(folderPath + "/"))
        .map(f => {
            const rel = f.parent.path.slice(folderPath.length + 1);
            return rel.split("/")[0];
        })
)];

// Get index.md files of direct subfolders
const subfolderIndexes = directSubfolders.map(subfolderName => {
    return allFiles.find(f =>
        f.parent?.path === `${folderPath}/${subfolderName}` &&
        f.basename === "index"
    );
}).filter(f => f !== undefined);

// Generate link markdown
const fileLinks = filesInFolder.map(f => `- [[${f.basename}]]`);

const folderIndexLinks = subfolderIndexes.map(f => {
    const folderName = f.parent.name;
    const linkPath = `${f.parent.path}/index`;
    return `- [[${linkPath}|${folderName}]]`;
});

const allLinksMarkdown = [...fileLinks, ...folderIndexLinks]
    .sort((a, b) => a.localeCompare(b))
    .join("\n");

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

const newSection = `${startMarker}\n${allLinksMarkdown}\n${endMarker}`;

// Replace existing section or append
if (content.includes(startMarker) && content.includes(endMarker)) {
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");
    content = content.replace(regex, newSection);
} else {
    content += `\n\n${newSection}`;
}

// Write updated content back to index file
await vault.modify(indexFile, content);

new Notice(`Updated ${fileLinks.length + folderIndexLinks.length} links in index.md`);
%>
