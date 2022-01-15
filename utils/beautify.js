/*
 * @Author: Advisor
 * @Email: 761324015@qq.com
 * @Module:
 * @Description: 美化cli
 * @Date: 2022-01-11 19:01:07
 * @LastEditors: Advisor
 * @LastEditTime: 2022-01-12 20:48:48
 */
const chalk = require('chalk')  //命令行颜色
const ora = require('ora')      // 加载流程动画

const infoLog = (txt) => {
    console.log(chalk.blueBright(txt))
}

const warningLog = (txt) => {
    console.log(chalk.yellowBright(txt))
}

const errorLog = (txt) => {
    console.log(chalk.redBright(txt))
}

const successLog = (txt) => {
    console.log(chalk.greenBright(txt))
}

const loading = new ora({
    color:'cyan',
    spinner:{
        "interval": 100,
        "frames": [
            "∙∙∙",
            "●∙∙",
            "∙●∙",
            "∙∙●",
            "∙∙∙"
        ]
    }
})

const loadingStart= (txt) => {
    return loading.start(chalk.cyanBright(txt))
}


module.exports = {
    loadingStart,
    infoLog,
    warningLog,
    errorLog,
    successLog
}


