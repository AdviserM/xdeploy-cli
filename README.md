### 前端部署工具 xdeploy-cli

#### 描述

这是一个能够帮助前端工程师快速将项目部署的cli小工具。

包含的功能有在当前目录下全自动打压缩包,全自动连接ftp或者ssh将文件上传到服务器中,并支持线上文件备份

#### 安装

```shell
npm install -g xdeploy-cli
```

#### 配置文件

在项目目录下执行 ```xdeploy init``` 创建xdeploy.json

```json
// xdeploy.json
{
  "local": {
    "outputDir": "dist",   //build输出文件夹
    "buildCommand": "yarn build", //项目打包命令
    "zipDefaultName": "压缩包默认名称",  //压缩包默认名称 打压缩包时需要
    "outputZipDir": "package"  //想要存储压缩包文件夹名称
  },
  "server": [
    {
      "alias": "xx系统:公司测试机",  // 服务器标识 可自定义 
      "type": "ssh",  //部署方式 可选值 ssh ftp 必填
      "ssh": {					//ssh配置
        "host": "xxx.baidu.com", //必填
        "port": "8527",    //选填 默认为22
        "username": "ubuntu", //必填
        "password": "xxx", //password 与 privateKey 选填 推荐使用 privateKey
        "privateKey": ""  //ssh 私钥所在路径
      },
      "ftp": {   //ftp配置
        "host": "xxx.baidu.com",//必填
        "port": "21",  //选填 默认为21
        "user": "ubuntu",  //必填
        "password": "ubuntu",  //必填
        "connTimeout": 60000,  //必填
        "pasvTimeout": 60000,//必填
        "keepalive": 60000//必填
      },
      "project": {
        "backup": false,  //是否备份 为true时 在服务器部署路径下会生成一个backup文件夹.并将原文件压缩 仅针对ssh
        "path": "/www/wwwroot/html/baidu", //线上部署路径 
        "rmExclude": ["backup","ie","config"] //清空线上文件时跳过哪些文件 仅针对ssh
      }
    }
  ]
}

```



#### 使用方式

在项目目录下执行 ```xdeploy init``` 创建xdeploy.json。

+ **压缩项目** 在当前目录下生成项目压缩包

​	执行```xdeploy -p```,此时程序会根据xdeploy.json中buildCommand进行打包并将dist文件夹的内容压缩到package目录下,生成一个带有打包时间的压缩包

+ **部署到服务器**

​	``xdeploy -s`` 以ssh方式部署 

​	```xdeploy -f``` 以ftp方式部署 

​	程序会将项目build之后,根据配置,连接服务器,并上传到project.path文件夹 注意,此操作会清空project.path文件夹下的所有内容





