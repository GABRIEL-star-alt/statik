import { create, globSource } from "ipfs-http-client";
import { IsStatik } from "../utils/checkStatik.js";
import fs from 'fs';
import { FetchConfig } from "../utils/fetchConfig.js";
import path from "path";
function removeFirstTwoCharacters(str) {
    return str.substring(2);
}
function concatenateFilePaths(a, b) {
    const aParts = a.split('/');
    const bParts = b.split('/');
    if (a[a.length - 1] == "/") {
        bParts.forEach((e, i) => {
            if (i != 0) {
                a = a + e + '/';
            }
        });
        return a.slice(0, -1);
    }
    else {
        a = a + '/';
        bParts.forEach((e, i) => {
            if (i != 0) {
                a = a + e + '/';
            }
        });
        return a.slice(0, -1);
    }
}
function getAllFilePathsInCWD(directoryPath, basePath = '') {
    const files = [];
    // Read all files and directories in the given directory
    const items = fs.readdirSync(directoryPath);
    items.forEach(item => {
        const itemPath = path.join(directoryPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            // If it's a directory, and it's not the ".statik" directory, recursively call the function
            if (item !== '.statik') {
                const subFiles = getAllFilePathsInCWD(itemPath, path.join(basePath, item));
                files.push(...subFiles);
            }
        }
        else {
            // If it's a file, add its relative path to the list
            files.push(path.join(basePath, item));
        }
    });
    return files.map(input => input.replace(/\\/g, "/"));
}
export async function Add(cwd, paths) {
    try {
        IsStatik(cwd);
        if (!paths.length) {
            console.log("No file path specified!");
            console.log("Hint: statik help");
            return;
        }
        const client = create({ url: FetchConfig(cwd).ipfs_node_url });
        const branch = fs.readFileSync(cwd + "/.statik/HEAD").toString();
        const prevCommit = fs.readFileSync(cwd + "/.statik/heads/" + branch).toString();
        if (!prevCommit.length) {
            let snapshot = [];
            if (paths.length == 1 && paths[0] == ".") {
                for (const path of getAllFilePathsInCWD(cwd)) {
                    for await (const result of client.addAll(globSource(path, { recursive: true }))) {
                        result.path = concatenateFilePaths(path, result.path);
                        if (fs.statSync(cwd + "/" + result.path).isDirectory())
                            continue;
                        snapshot.push(result);
                    }
                }
            }
            else {
                for (const path of paths) {
                    for await (const result of client.addAll(globSource(path, { recursive: true }))) {
                        result.path = concatenateFilePaths(path, result.path);
                        if (fs.statSync(cwd + "/" + result.path).isDirectory())
                            continue;
                        snapshot.push(result);
                    }
                }
            }
            const result = await client.add(JSON.stringify(snapshot));
            fs.writeFileSync(cwd + "/.statik/SNAPSHOT", result.path);
            console.log("Files staged to IPFS with cid: " + result.path);
        }
        else {
            let asyncitr = client.cat(prevCommit);
            let prevSnapshot = "";
            for await (const itr of asyncitr) {
                const data = Buffer.from(itr).toString();
                prevSnapshot = JSON.parse(data).snapshot;
            }
            let prevContent = [];
            asyncitr = client.cat(prevSnapshot);
            for await (const itr of asyncitr) {
                const data = Buffer.from(itr).toString();
                prevContent = JSON.parse(data);
            }
            // Not optimized
            let newContent = [];
            if (paths.length == 1 && paths[0] == ".") {
                for (const path of getAllFilePathsInCWD(cwd)) {
                    for await (const result of client.addAll(globSource(path, { recursive: true }))) {
                        result.path = concatenateFilePaths(path, result.path);
                        if (fs.statSync(cwd + "/" + result.path).isDirectory())
                            continue;
                        newContent.push(result);
                    }
                }
            }
            else {
                for (const path of paths) {
                    for await (const result of client.addAll(globSource(path, { recursive: true }))) {
                        result.path = concatenateFilePaths(path, result.path);
                        if (fs.statSync(cwd + "/" + result.path).isDirectory())
                            continue;
                        newContent.push(result);
                    }
                }
            }
            let newContentaddedpaths = [];
            newContent.forEach((e) => {
                newContentaddedpaths.push(e.path);
            });
            prevContent.forEach((e) => {
                let flag = false;
                if (fs.existsSync(e.path)) {
                    flag = false;
                }
                else {
                    flag = true;
                }
                if (!newContentaddedpaths.includes(e.path) && !flag) {
                    newContent.push(e);
                }
            });
            const result = await client.add(JSON.stringify(newContent));
            if (result.path == prevSnapshot) {
                console.log("There are no changes to add");
                return;
            }
            fs.writeFileSync(cwd + "/.statik/SNAPSHOT", result.path);
            console.log("Files staged to IPFS with cid: " + result.path);
        }
        process.exit(0);
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
}
//# sourceMappingURL=stage.js.map