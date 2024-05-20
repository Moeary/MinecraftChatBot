# MCChatGPTBot
一个在Minecraft中使用ChatGPT进行聊天的bot

## 如何安装
```
1. 安装nodejs
2. git clone https://github.com/TLMEMO/MCChatGPTBot
3. cd ./MCChatGPTBot
4. npm install
5. 根据需要修改config.js
6. node index.js

```

## 如何使用

根据你在config.js里的对trigger的设定来使用该bot，比如设定trigger为chat时。

在聊天栏输入：
```
chat help 
//获取游戏内插件帮助

chat 消息
 //发送消息请求

chat new 消息（可选）
//新对话/新对话请求 比如chat new 你好

chat role 角色名称
//切换角色

chat undo
//撤销这次对话 

chat regen 消息（可选）
//重新生成/修改后重新生成 

chat rolelist
//获取角色列表 

chat init
//初始化个人档案
```

rolelist中可以修改/增加系统prompt 格式为：
```json
"角色名称":{
        "description": "prompt",
        "introduction" : "简介"

    },
```
