/*
 * @Author: Advisor
 * @Email: 761324015@qq.com
 * @Module:
 * @Description:
 * @Date: 2022-01-11 18:39:47
 * @LastEditors: Advisor
 * @LastEditTime: 2022-01-11 19:55:42
 */
// 获取当前执行文件夹
const path = require('path')
const os = require('os')
const fs = require('fs-extra')
const workDir = process.cwd()
const appName = require('../package.json').name
// 用户目录
const USER_HOME = process.env.HOME || process.env.USERPROFILE
const configDir = path.join(USER_HOME, appName)
//项目配置目录
const configPath = path.join(workDir, 'xdeploy.json')
const defaultConfigPath = path.join(__dirname, '../config.json')

// 系统临时目录
const tempDir = path.join(os.tmpdir(), appName)
const targetZipPath = path.join(tempDir, 'dist.zip')

//获取配置信息
function getConfig() {
    const CONFIG = fs.readJsonSync(configPath)  // 配置
    return CONFIG
}

//读取配置生成inquirer cli选项
function genCliOptions(array = [], type = 'ssh') {
    let optionsMap = new Map()
    //过滤一遍
    let filterArr = array.filter(item => {
        return item.type === type
    })

    if (filterArr.length === 0) throw new Error(`配置文件中未配置${type}服务器!\n配置文件路径:${configPath}`)
    let cliOptions = filterArr.map(item => {
        let {alias, project} = item
        if (!alias) throw new Error('alias 不能为空!')
        let name = `${alias}(${project.path})`
        optionsMap.set(alias, item)
        return {
            name,
            value: alias
        }
    })
    return {
        optionsMap,
        cliOptions
    }
}

module.exports = {
    workDir,
    tempDir,
    defaultConfigPath,
    configDir,
    configPath,
    targetZipPath,
    getConfig,
    genCliOptions
}
