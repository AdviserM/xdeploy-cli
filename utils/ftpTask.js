/**
 * @file: ftpTask.js
 * @module:
 * @description: ftp版本task
 * @author: advisor
 * @email: 761324015@qq.com
 * @date: 2022/1/14 9:09
 */

const FTP = require('promise-ftp');
const {errorLog, successLog, loadingStart, warningLog} = require("./beautify");
const fs = require('fs-extra')
const Path = require("path");

//连接FTP
async function connectFTP(CONFIG) {
    let loading = loadingStart('正在连接FTP服务器...')
    try {
        let ftp = new FTP();
        let msg = await ftp.connect(CONFIG)
        loading.stop()
        successLog(`+ FTP连接成功!来自服务器的消息:${msg}`)
        return ftp
    } catch (e) {
        warningLog(e)
        loading.stop()
        throw new Error('- FTP连接失败!')
    }
}

//上传项目文件
async function runUpload(ftp, local, target) {
    let count = 0
    let flodCount = 0
    // let loading = loadingStart('正在上传项目文件...')
    try {
        async function readFile(path, target) {
            let files = fs.readdirSync(path)
            if (files instanceof Array && files.length > 0) {
                for (let item of files) {
                    let filePath = Path.join(path, item)
                    let fileStat = fs.statSync(filePath)
                    if (fileStat.isDirectory()) {
                        // 是 文件夹 继续递归读取 并在远程创建文件夹
                        await ftp.cwd(target)
                        await ftp.mkdir(`${item}`)
                        successLog(`已创建:${target}/${item} 文件夹`)
                        ++flodCount
                        await readFile(filePath, `${target}/${item}`)
                    } else {
                        // 是文件,上传文件
                        await ftp.cwd(target)
                        // warningLog(`正在上传:${target}/${item}`)
                        await ftp.put(filePath, `${item}`)
                        ++count
                        successLog(`已上传:${target}/${item}`)
                    }
                }
            }
        }
        await readFile(local, target)
        // loading.stop()
        successLog(`+ 已创建${flodCount}个文件夹 已上传${count}个文件`)
    } catch (e) {
        warningLog(e)
        // loading.stop()
        throw new Error('项目文件上传失败!')
    }
}

//清空项目文件
async function cleanOldFile(ftp, target) {
    let loading = loadingStart('正在清空项目旧文件!')
    try {
        await ftp.cwd(target)
        let fileList = await ftp.list(target)
        for (let i = 0; i < fileList.length; i++) {
            let item = fileList[i]
            let {type, name} = item
            switch (type) {
                case "-" :
                    await ftp.delete(name)
                    break
                case "d" :
                    await ftp.rmdir(name, true)
                    break
            }
        }
        loading.stop()
        successLog('+ 项目旧文件清空成功!')
    } catch (e) {
        loading.stop()
        warningLog(e)
        throw new Error('- 项目旧文件清空失败!')
    }
}


module.exports = {
    connectFTP,
    runUpload,
    cleanOldFile
}

