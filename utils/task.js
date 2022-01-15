/*
 * @Author: Advisor
 * @Email: 761324015@qq.com
 * @Module:
 * @Description:
 * @Date: 2022-01-11 18:32:26
 * @LastEditors: Advisor
 * @LastEditTime: 2022-01-11 20:04:21
 */
const {NodeSSH} = require('node-ssh')
const compressing = require('compressing')
const shell = require('shelljs')
const dayjs = require('dayjs')
const pump = require('pump')
const {hasPackageJson} = require("./validator");
const {
    tempDir,
    targetZipPath,
    workDir,
    defaultConfigPath,
    configPath,
} = require('./variable')

const fs = require('fs-extra')

const {
    loadingStart,
    infoLog,
    warningLog,
    errorLog,
    successLog
} = require('./beautify')

const Path = require("path");

// 确保 tempDir 存在
function ensureTempDir() {
    fs.ensureDirSync(tempDir)
}

//初始化配置以及临时文件夹
function initConfig() {
    try {
        ensureTempDir()
        hasPackageJson()
        if (!fs.existsSync(configPath)) {
            // 如果不存在 就复制一份到当前目录下
            fs.copySync(defaultConfigPath, configPath)
            successLog('当前目录已生成xdeploy.json示例配置文件!')
        }else {
            warningLog('当前目录存在xdeploy.json配置文件,无需再次生成!')
        }
    }catch (e) {
        errorLog(e)
    }
    process.exit()
}


// 连接服务器
async function connectSSH(config = {}) {
    let loading = loadingStart('正在连接服务器...')
    try {
        const SSH = new NodeSSH()
        await SSH.connect(config)
        loading.stop()
        successLog('+ SSH服务器连接成功!')
        return SSH
    } catch (error) {
        loading.stop()
        warningLog(error)
        throw new Error('- SSH服务器连接失败!')
    }
}

// 执行打包命令
async function runBuild(buildCommand) {
    let loading = loadingStart('正在进行项目Build,请稍候...')
    await shell.cd(workDir)
    const res = await shell.exec(buildCommand, {silent: true}) //执行shell 打包命令
    loading.stop()
    if (res.code === 0) {
        successLog('+ 项目Build成功!')
    } else {
        warningLog(res)
        throw new Error('- 项目Build失败!')
    }
}

// 执行远程命令
async function runCommand(SSH, config, command) {
    return SSH.exec(command, [], {cwd: config.path})
}


// 远程备份命令
async function runBackup(SSH, config) {
    let loading = loadingStart('正在备份原文件!')
    try {
        let name = `./backup/backup-${dayjs().format('YYYYMMDD_HHmm')}.tar.gz`
        let result = await runCommand(SSH, config, `ls | egrep -v '(backup|ie|dist)'`)
        if (result) {
            //先确保backup文件夹存在
            try {
                await runCommand(SSH, config, 'ls backup')
            } catch (e) {
                await runCommand(SSH, config, 'mkdir backup')
            }
            let command = `tar -zcvf ${name} \`ls | egrep -v '(backup|ie|dist)'\``
            await runCommand(SSH, config, command)
            loading.stop()
            successLog('+ 线上项目备份成功!')
        } else {
            loading.stop()
            infoLog('+ 线上项目暂无文件,无需备份!')
        }
    } catch (e) {
        loading.stop()
        warningLog(e)
        throw new Error('- 线上项目备份失败!')
    }
}

// 上传压缩包文件
async function runUpload(SSH, config) {
    let loading = loadingStart('正在上传压缩包!')
    try {
        await SSH.putFiles([{local: targetZipPath, remote: config.path + '/dist.zip'}])
        loading.stop()
        successLog('+ 压缩包上传成功!')
    } catch (e) {
        warningLog(e)
        throw new Error('- 压缩包上传失败!')
    }
}

// 远程解压命令
async function runUnzip(SSH, config) {
    let loading = loadingStart('正在解压文件!')
    try {
        await runCommand(SSH, config, 'unzip -O CP936 ./dist.zip') //解压
        // await runCommand(SSH, config, `mv -f ./dist/*  ./`)
        // await runCommand(SSH, config, `rm -rf ./dist`)
        await runCommand(SSH, config, `rm -rf dist.zip`)
        loading.stop()
        successLog('+ 项目解压成功!')
    } catch (e) {
        loading.stop()
        warningLog(e)
        throw new Error('- 项目解压失败!')
    }
}


// 清空旧文件 可排除
async function cleanOldFile(SSH, config) {
    let loading = loadingStart('正在清空旧文件!')
    try {
        let rmExclude = config.rmExclude.join('|')
        let command = `rm -rf \`ls | egrep -v '(${rmExclude})'\``
        await runCommand(SSH, config, command)
        loading.stop()
        successLog('+ 旧文件清空成功!')
    } catch (e) {
        loading.stop()
        errorLog(e)
        throw new Error('- 旧文件清空失败!')
    }
}




async function commonZip(zipPath, targetZipPath) {
    return new Promise((resolve, reject) => {
        let files = fs.readdirSync(zipPath)
        if (files instanceof Array && files.length > 0) {
            const zipStream = new compressing.zip.Stream();
            for (let item of files) {
                let filePath = Path.join(zipPath, item)
                //将文件添加到流中
                zipStream.addEntry(filePath);
            }
            const destStream = fs.createWriteStream(targetZipPath);
            pump(zipStream, destStream, function (err) {
                if (err) {
                    reject(err)
                }
                resolve()
            })
        } else {
            reject(new Error(`${zipPath}目录下无文件!`))
        }
    })
}

// 将文件夹打压缩包
async function runZip(zipPath) {
    let loading = loadingStart('正在将项目文件压缩到系统临时文件夹中...')
    try {
        // 若原来有文件 需删除
        if (fs.existsSync(targetZipPath)) {
            fs.removeSync(targetZipPath)
        }
        await commonZip(zipPath,targetZipPath)
        loading.stop()
        successLog('+ 项目压缩成功!')
    } catch (error) {
        // console.log(error)
        warningLog(error)
        loading.stop()
        throw new Error('- 项目压缩失败!')
    }
}




// 将文件夹打压缩包放在项目package目录下
async function runPackageZip(zipPath, targetZipPath) {
    let loading = loadingStart('正在将项目文件压缩当前目录下的package文件夹中...')
    try {
        //读取目录下的文件 不需要dist文件夹
        await commonZip(zipPath, targetZipPath)
        loading.stop()
        successLog(`+ 项目压缩成功! 路径在:${targetZipPath}`)
    } catch (error) {
        warningLog(error)
        loading.stop()
        throw new Error('项目压缩失败!')
    }
}


module.exports = {
    runZip,
    connectSSH,
    runCommand,
    runPackageZip,
    runUnzip,
    runBackup,
    cleanOldFile,
    runUpload,
    runBuild,
    initConfig,
    ensureTempDir
}
