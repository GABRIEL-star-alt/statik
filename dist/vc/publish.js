import { create, globSource } from "ipfs-http-client";
import { IsStatik } from "../utils/checkStatik.js";
import fs from 'fs';
import { FetchConfig } from "../utils/fetchConfig.js";
import pkg from "figlet";
const { text } = pkg;
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
        console.log(a);
        return a.slice(0, -1);
    }
}
export async function publish(cwd, path) {
    IsStatik(cwd);
    var cid;
    const options = {
        resolve: true,
        lifetime: '10s',
        ttl: '10s',
        key: 'self',
        allowOffline: true
        // MIMEType:[text,CSS]
    };
    const client = create({ url: FetchConfig(cwd).ipfs_node_url });
    const arr = [];
    try {
        const f = path;
        client.addAll(globSource(path, { recursive: true }));
        for await (const result of client.addAll(globSource(path, { recursive: true }))) {
            result.path = concatenateFilePaths(path, result.path);
            if (result.path == f) {
                console.log(result.cid);
                client.name.publish(result.cid, options).then(value => {
                    console.log(`https://ipfs.io/ipns/${value.name}`);
                });
                break;
            }
            if (fs.statSync(cwd + "/" + result.path).isDirectory())
                continue;
            arr.push(result);
        }
        // fs.readFile("index.html", (error, data) => {
        //     if(error) throw error;
        //     client.add(data).then((res) => {
        //         client.name.publish(res.path).then(value => {
        //             console.log(`https://ipfs.io/ipns/${value.name}`);
        //         })
        //     });
        // });
    }
    catch (error) {
    }
    return;
}
//# sourceMappingURL=publish.js.map