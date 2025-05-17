module.exports = async () => {
  if (!app || !app.vault || !tp.file || !tp.file.path) {
    new Notice("Vault or file context not ready, aborting script.");
    return;
  }

  await new Promise(r => setTimeout(r, 200));
  const vault = app.vault;
  const allFiles = vault.getFiles();

  // Get unique folders
  const foldersSet = new Set(allFiles.map(f => f.parent?.path).filter(Boolean));

  for (const folderPath of foldersSet) {
    const folderName = folderPath.split("/").pop();
    const indexPath = `${folderPath}/index.md`;
    let indexFile = vault.getAbstractFileByPath(indexPath);
    let content = "";

    if (!indexFile) {
      content = `---\naliases: [${folderName}]\n---\n\n# ${folderName}\n\n<!-- LINKS START -->\n<!-- LINKS END -->\n`;
      await vault.create(indexPath, content);
      indexFile = vault.getAbstractFileByPath(indexPath);
    } else {
      content = await vault.read(indexFile);

      // Extract frontmatter block
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      let fmText = fmMatch ? fmMatch[1] : "";
      let aliasesLine = fmText.split('\n').find(line => line.trim().startsWith('aliases:'));

      if (aliasesLine) {
        // Extract aliases array string, e.g. aliases: [foo, bar]
        let aliasesStr = aliasesLine.split(':')[1].trim();
        // Remove brackets and spaces
        let aliases = aliasesStr.replace(/[\[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean);
        if (!aliases.includes(folderName)) aliases.push(folderName);
        // Rebuild aliases line
        const newAliasesLine = `aliases: [${aliases.join(', ')}]`;
        // Replace old aliases line
        fmText = fmText.replace(aliasesLine, newAliasesLine);
      } else {
        // No aliases line: add one at top
        fmText = `aliases: [${folderName}]\n` + fmText;
      }

      // Rebuild frontmatter
      const newFrontmatter = `---\n${fmText}\n---`;

      if (fmMatch) {
        // Replace frontmatter in content
        content = content.replace(/^---\n[\s\S]*?\n---/, newFrontmatter);
      } else {
        // Add frontmatter to top
        content = newFrontmatter + '\n\n' + content;
      }
    }

    // Now update the links section as you did before:
    // Get files in folder excluding index.md
    const filesInFolder = allFiles.filter(f =>
      f.parent?.path === folderPath &&
      f.extension === "md" &&
      f.basename !== "index"
    );

    // Get direct subfolders
    const directSubfolders = [...new Set(
      allFiles
        .filter(f => f.parent?.path?.startsWith(folderPath + "/"))
        .map(f => {
          const rel = f.parent.path.slice(folderPath.length + 1);
          return rel.split("/")[0];
        })
    )];

    // Get subfolder index.md files
    const subfolderIndexes = directSubfolders.map(subfolderName => {
      return allFiles.find(f =>
        f.parent?.path === `${folderPath}/${subfolderName}` &&
        f.basename === "index"
      );
    }).filter(Boolean);

    // Prepare markdown links
    const fileLinks = filesInFolder.map(f => `- [[${f.basename}]]`);
    const folderIndexLinks = subfolderIndexes.map(f => {
      const subfolderName = f.parent.name;
      return `- [[${subfolderName}]]`;
    });

    const allLinksMarkdown = [...fileLinks, ...folderIndexLinks].sort().join("\n");

    const startMarker = "<!-- LINKS START -->";
    const endMarker = "<!-- LINKS END -->";
    const newSection = `${startMarker}\n${allLinksMarkdown}\n${endMarker}`;

    if (content.includes(startMarker) && content.includes(endMarker)) {
      const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");
      content = content.replace(regex, newSection);
    } else {
      content += `\n\n${newSection}`;
    }

    await vault.modify(indexFile, content);
  }

  new Notice(`Updated indexes in ${foldersSet.size} folders.`);
};
