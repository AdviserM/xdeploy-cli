/*
 * @Author: Advisor
 * @Email: 761324015@qq.com
 * @Module:
 * @Description:
 * @Date: 2022-01-11 18:52:42
 * @LastEditors: Advisor
 * @LastEditTime: 2022-01-11 19:38:30
 */


const path = require('path')
const fs = require('fs-extra')
const { workDir, configPath} = require('./variable')

/*
    判断当前工作目录下是否有package.jsons项目文件存在
*/
function hasPackageJson() {
    let pkgPath = path.join(workDir, 'package.json')
    if (!fs.existsSync(pkgPath)) throw new Error('当前目录下无package.json文件!')

}
function hasConfigJson() {
    if (!fs.existsSync(configPath)) throw new Error('当前目录下无xdeploy.json配置文件!请运行xdeploy init 创建一份!')
}


/*
    判断远程配置中是否是在根路径
*/
function checkPath(path = "") {
    if(!path) throw new Error('远程路径配置有误,不可为空路径!')
    let deniedArray = ['/']
    if (deniedArray.includes(path)) throw new Error('远程路径配置有误,不可为根路径!')
}

const cloneDeep = require('loadsh/cloneDeep')
// 判断SSH配置是否正确 并返回SSH配置
function checkSSHConfig(config) {
    let sshConfig = cloneDeep(config)
    let { ssh,project } = sshConfig

    let {password, privateKey} = ssh
    let validatorRules = {
        host: { required: true, message: 'SSH配置有误 host是必需的!' },
        username: { required: true, message: 'SSH配置有误 username是必需的!' },
    }

    Object.keys(validatorRules).forEach(key => {
        let item = validatorRules[key]
        let { message } = item
        let value = ssh[key]
        if (!value) {
            throw new Error(message)
        }
    })

    if (privateKey) {
        delete ssh.password
    } else if(password) {
        delete ssh.privateKey
    }else {
        throw new Error('password与privateKey至少有一项不为空!')
    }

    if(!ssh.port) {
        ssh.port = '22'
    }

    checkPath(project.path)

    return sshConfig
}

// 判断FTP配置是否正确 并返回FTP配置
function checkFTPConfig(config) {
    let ftpConfig = cloneDeep(config)
    let { project,ftp } = ftpConfig
    let validatorRules = {
        host: { required: true, message: 'FTP配置有误 host是必需的!' },
        user: { required: true, message: 'FTP配置有误 user是必需的!' },
        password: { required: true, message: 'FTP配置有误 password是必需的!' },
    }
    Object.keys(validatorRules).forEach(key => {
        let item = validatorRules[key]
        let { message } = item
        let value = ftp[key]
        if (!value) {
            throw new Error(message)
        }
    })
    checkPath(project.path)
    // 端口号默认为21
    if(!ftp.port) {
        ftp.port = '21'
    }
    return ftpConfig
}
module.exports = {
    hasPackageJson,
    hasConfigJson,
    checkSSHConfig,
    checkFTPConfig
}
