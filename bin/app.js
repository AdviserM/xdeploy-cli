#!/usr/bin/env node
const {sshDeploy, package, ftpDeploy} = require('../utils/deploy');
const {initConfig} = require("../utils/task");

(
    async function () {
        const type = process.argv[2]
        switch (type) {
            case 'init':
                //进行初始化 在当前目录下新建xdeploy.json 以及创建临时目录
                initConfig()
                break
            case '-s':
                await sshDeploy()
                break
            case '-f':
                await ftpDeploy()
                break
            case '-p':
                await package()
                break
            default:
                await sshDeploy()
                break
        }
    }
)()
