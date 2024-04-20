import { create } from "ipfs-http-client";
import { IsStatik } from "../utils/checkStatik.js";
import fs, { writeFileSync } from 'fs'
import { FetchConfig } from "../utils/fetchConfig.js";
import path from "path";
import Path from 'path'
import { multihashToCID } from "../utils/cid.js";
import { isOverriding } from "../utils/changes.js";
import { commitContent } from "../utils/fetchContent.js";
import { deleteAllFiles, readAllFiles } from "../utils/dirwalk.js";

function del(fileOrDir: string): void {

    if (fs.existsSync(fileOrDir)) {
        if (fs.lstatSync(fileOrDir).isDirectory()) {
            fs.readdirSync(fileOrDir).forEach((file) => {
                const curPath = path.join(fileOrDir, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    // Recursively delete directories
                    del(curPath);
                } else {
                    // Delete files
                    fs.unlinkSync(curPath);
                }
            });
            // After deleting all files, delete the directory itself
            fs.rmdirSync(fileOrDir);
        } else {
            // If it's a file, simply delete it
            fs.unlinkSync(fileOrDir);
        }
    } else {
        // console.log(`File or directory '${fileOrDir}' does not exist.`);
    }
}
function removeEmptyDirectories(directory: string): void {
    if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) {
        return;
    }

    const files = fs.readdirSync(directory);
    if (files.length === 0) {
        fs.rmdirSync(directory);
        // Recursively remove parent directories if they become empty
        removeEmptyDirectories(path.dirname(directory));
    } else {
        for (const file of files) {
            const filePath = path.join(directory, file);
            if (fs.lstatSync(filePath).isDirectory()) {
                removeEmptyDirectories(filePath);
            }
        }
    }
}

export async function List(cwd: string){
    try{
        IsStatik(cwd)
    
        // List all files
        const currentBranch = fs.readFileSync(cwd+"/.statik/HEAD").toString()
        const files = fs.readdirSync(cwd+"/.statik/heads")
        for(const file of files){
            if(file===currentBranch){
                console.log("-> "+file+" <-")
            }else{
                console.log(file)
            }
        }
    }catch(err){
        console.error(err)
    }
}

export async function Switch(cwd: string,CID: string){
    try{
        IsStatik(cwd)
        const currentBranch = fs.readFileSync(cwd+"/.statik/HEAD").toString()
        
        const currentHead = fs.readFileSync(cwd+"/.statik/heads/"+currentBranch).toString()
        // Check for staged changes
        if(fs.readFileSync(cwd+"/.statik/SNAPSHOT").toString().length){
            console.log("There are staged changes. You cannot switch to other commit without commiting it")
            return
        }
        
        else{
            const client = create({url: FetchConfig(cwd).ipfs_node_url})
            const prevcid=fs.readFileSync(cwd+"/.statik/currcid").toString()
            let prevcommitcontent:any[]=[]
            if(prevcid.length){
                 prevcommitcontent=await commitContent(prevcid,client)
                 
            }
            else{
                prevcommitcontent=await commitContent(currentHead,client)
            }
            let prevcommitcontentaddedpaths:string[]=[]
            prevcommitcontent.forEach((e:any) => {
del(e.path)
removeEmptyDirectories((e.path).split('/')[0])
            });
            fs.writeFileSync(cwd+"/.statik/currcid",CID)
            const commitId = CID
            
            // Check for unstaged changes
            const headContent = await commitContent(currentHead,client)
            console.log(commitId)
            
            // Handle the case where not unstaged but overriding
            // Solution: Prevent only if added files and deleted files are overriding
            // Check for overriding changes
            let newcommitContent
            if(CID=="head"){
                fs.writeFileSync(cwd+"/.statik/currcid",currentHead)

                newcommitContent=headContent
            }
            else{
    newcommitContent = await commitContent(commitId,client)
}
            
            // Conditionally delete files. Exempt new files under basepath
            let basepathnew
            let dir;
            basepathnew = newcommitContent[0].path.split("/");
            let isfile;
            if(newcommitContent[0].path.split("/").length==1){
dir=basepathnew[0]
isfile="1"
            }
            else{
                dir=basepathnew[0]+"/"
                isfile="0"
            }
            const directoryPath=cwd+"/"+dir


let newBranchaddedpaths:string[]=[]
newcommitContent.forEach((e:any)=>{
    newBranchaddedpaths.push(e.path)
})

           
        //    deleteFoldersAndFilesExceptStatikAndPaths(cwd,newBranchaddedpaths)
            let data
            let flag=false
            for (const obj of newcommitContent) {
                const path1 = obj.path;
                // Derive CID from multihash
                const cid = multihashToCID(obj.cid);
                const asyncitr = client.cat(cid);
                const dirname = Path.dirname(cwd + "/" + path1);
                fs.mkdirSync(dirname, { recursive: true });
                for await (const itr of asyncitr) {
                    data = Buffer.from(itr).toString();
                    console.log(data)
                    if(data){
                        fs.writeFileSync(path1, data);
                    }
                    else{
                    }
                    flag=true
                }
                if (!flag){

                
                try {
                    const directoryPath = path.join(cwd, path.dirname(path1));
                    const fileName = path.basename(path1);
            
                    // Create the directory
                    fs.mkdirSync(directoryPath, { recursive: true });
            
                    // Create the empty file
                    fs.writeFileSync(path.join(directoryPath, fileName), '');
                } catch (err) {
                    console.error(`Error creating empty file: ${err}`);
                }
            }
            flag=false;
            }
            return
        }
    }catch(err){
        console.error(err)
    }
}