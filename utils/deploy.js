/*
 * @Author: Advisor
 * @Email: 761324015@qq.com
 * @Module:
 * @Description:
 * @Date: 2022-01-11 18:25:20
 * @LastEditors: Advisor
 * @LastEditTime: 2022-01-12 20:51:23
 */
const {
    connectSSH,
    ensureTempDir,
    runBuild,
    runPackageZip,
    runZip,
    runUpload,
    cleanOldFile,
    runBackup,
    runUnzip
} = require('./task')
const fs = require('fs-extra')
const {errorLog, successLog, warningLog} = require('./beautify')
const {hasPackageJson, checkSSHConfig, checkFTPConfig, hasConfigJson} = require('./validator')
const {getConfig, genCliOptions, workDir} = require('./variable')
const inquirer = require('inquirer')
const path = require("path");
const showBanner = require("node-banner");
const chalk = require('chalk')  //命令行颜色

function mkChoice(choices) {
    return new Promise(resolve => {
        inquirer.prompt([{type: 'list', message: chalk.white('请选择发布环境'), name: 'env', choices}])
            .then(answers => {
                resolve(answers)
            })
    })
}

//SSH 方式部署
async function sshDeploy() {
    try {
        await showBanner('DEPLOYBYSSH', '∙ 前端自动部署工具(SSH) -作者:github@AdviserM')
        // 检查当前文件夹下是否有项目文件
        hasPackageJson()
        hasConfigJson()
        // 确保临时文件夹存在
        ensureTempDir()
        // 读取配置
        let {server,local} = getConfig()
        let {outputDir,buildCommand} = local
        let {optionsMap, cliOptions} = genCliOptions(server, 'ssh')
        // 启动选择器 选择发布环境
        let {env} = await mkChoice(cliOptions)
        //开始计时
        console.time(chalk.yellow("SSH部署耗时"));
        // 检查配置文件
        let {ssh, project} = checkSSHConfig(optionsMap.get(env))
        // 连接服务器
        const SSH = await connectSSH(ssh)
        // 进行项目Build
        await runBuild(buildCommand)
        // 进行zip压缩 压缩到临时文件夹
        const zipPath = path.join(workDir, outputDir)
        await runZip(zipPath)
        // 如果要备份
        if (project.backup) {
            await runBackup(SSH, project)
        }
        // 清空线上原有的文件
        await cleanOldFile(SSH, project)
        // 上传到服务器中
        await runUpload(SSH, project)
        // 线上解压
        await runUnzip(SSH, project)
        successLog('+ 项目部署成功!')
        console.timeEnd(chalk.yellow("SSH部署耗时"));
        process.exit()
    } catch (e) {
        let message = e.message
        errorLog(message)
        process.exit()
    }
}


let readline = require("readline");
const dayjs = require("dayjs");
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function readlineSync(question = chalk.cyanBright("请输入压缩包名:")) {
    return new Promise((resolve, reject) => {
        rl.question(question, function (answer) {
            rl.close();
            resolve(answer);
        });
    });
}

async function package() {
    try {
        await showBanner('PACKAGE', '∙ 前端自动打包工具-作者:github@AdviserM')
        // 检查当前文件夹下是否有项目文件
        hasPackageJson()
        hasConfigJson()
        //获取用户输入文件名
        let {zipDefaultName,outputDir,outputZipDir,buildCommand} = getConfig().local
        let packageName = await readlineSync(chalk.cyanBright(`请输入压缩包名(默认:${zipDefaultName}):`))
        packageName =  packageName || zipDefaultName
        const zipName = `${packageName}-${dayjs().format('YYYYMMDD_HHmm')}.zip`
        console.time(chalk.yellow("打包耗时"));
        warningLog(`∙ 压缩包名:${zipName}`)
        // 进行打包
        await runBuild(buildCommand)
        //确保当前目录下有输出zip文件夹
        const targetPath = path.join(workDir, outputZipDir)
        if (fs.existsSync(targetPath)) fs.removeSync(targetPath)
        fs.ensureDirSync(targetPath)
        // 进行压缩
        const zipPath = path.join(workDir, outputDir)
        const targetZipPath = path.join(workDir, `${outputZipDir}/${zipName}`)
        await runPackageZip(zipPath, targetZipPath)
        console.timeEnd(chalk.yellow("打包耗时"));
        process.exit()
    } catch (e) {
        let message = e.message
        errorLog(message)
        process.exit()
    }
}

const FTPTask = require('./ftpTask')

//FTP方式部署
async function ftpDeploy() {
    try {
        await showBanner('DEPLOYBYFTP', '∙ 前端自动部署工具(FTP) -作者:github@AdviserM')
        //检查当前文件夹下是否有项目文件
        hasPackageJson()
        hasConfigJson()
        //确保临时文件夹存在
        ensureTempDir()
        //读取配置
        let {server,local} = getConfig()
        let {outputDir,buildCommand} = local
        let {optionsMap, cliOptions} = genCliOptions(server, 'ftp')
        // 启动选择器 选择发布环境
        let {env} = await mkChoice(cliOptions)
        console.time(chalk.yellow("FTP部署耗时"));
        // 检查配置文件
        let {ftp, project} = checkFTPConfig(optionsMap.get(env))
        // 连接服务器
        const FTP = await FTPTask.connectFTP(ftp)
        // 进行打包
        await runBuild(buildCommand)
        // 清空原有的文件
        await FTPTask.cleanOldFile(FTP, project.path)
        // 上传到服务器中
        const localPath = path.join(workDir, outputDir)
        await FTPTask.runUpload(FTP, localPath, project.path)
        successLog('+ 项目部署成功!')
        console.timeEnd(chalk.yellow("FTP部署耗时"));
        process.exit()
    } catch (e) {
        let message = e.message
        errorLog(message)
        process.exit()
    }
}

module.exports = {
    package,
    sshDeploy,
    ftpDeploy
}


