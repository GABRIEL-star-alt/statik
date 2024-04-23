import fs from 'fs';
export async function restore(cwd) {
    fs.writeFileSync(cwd + "/.statik/SNAPSHOT", "");
    console.log("changes unstaged");
    return;
}
//# sourceMappingURL=restore.js.map