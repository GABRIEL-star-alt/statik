import fs from 'fs'


export async function restore(cwd:string){

fs.writeFileSync(cwd+"/.statik/SNAPSHOT","")

console.log("changes unstaged")
return
}