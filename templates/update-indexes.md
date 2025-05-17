<%*
const vault = app.vault;
const allFiles = vault.getFiles();
const foldersSet = new Set();

// Gather all folders by splitting file paths
for (const file of allFiles) {
    const folderPath = file.parent?.path;
    if (folderPath) foldersSet.add(folderPath);
}

const folders = Array.from(foldersSet);

for (const folderPath of folders) {
    const folderName = folderPath.split("/").pop();
    const indexPath = `${folderPath}/${folderName}.md`;
    const indexFile = vault.getAbstractFileByPath(indexPath);
    if (!indexFile) continue; // skip folders with no index file

    // Get files directly in the folder (excluding index)
    const filesInFolder = allFiles.filter(f =>
        f.parent?.path === folderPath &&
        f.extension === "md" &&
        f.basename !== folderName
    );

    // Find first-level subfolders of folderPath
    const directSubfolders = [...new Set(
        allFiles
            .filter(f => f.parent?.path?.startsWith(folderPath + "/"))
            .map(f => {
                const rel = f.parent.path.slice(folderPath.length + 1);
                return rel.split("/")[0];
            })
    )];

    // Get subfolder index files
    const subfolderIndexes = directSubfolders.map(subfolderName => {
        return allFiles.find(f =>
            f.parent?.path === folderPath + "/" + subfolderName &&
            f.basename === subfolderName
        );
    }).filter(f => f !== undefined);

    // Combine
    const allLinks = [
        ...filesInFolder.map(f => f.basename),
        ...subfolderIndexes.map(f => f.basename)
    ].sort((a, b) => a.localeCompare(b));

    // Read and update content
    let content = await vault.read(indexFile);
    const startMarker = "<!-- LINKS START -->";
    const endMarker = "<!-- LINKS END -->";
    const newLinksMarkdown = allLinks.map(name => `- [[${name}]]`).join("\n");
    const newSection = `${startMarker}\n${newLinksMarkdown}\n${endMarker}`;

    if (content.includes(startMarker) && content.includes(endMarker)) {
        const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");
        content = content.replace(regex, newSection);
    } else {
        content += `\n\n${newSection}`;
    }

    await vault.modify(indexFile, content);
}

new Notice(`Updated indexes in ${folders.length} folders.`);
%>