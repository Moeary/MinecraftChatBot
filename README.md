# MCChatGPTBot
一个在Minecraft中使用ChatGPT进行聊天的bot

## 如何安装
```
1. 安装nodejs (开发使用20.11)
2. git clone https://github.com/TLMEMO/MCChatGPTBot
3. cd ./MCChatGPTBot
4. npm install
5. 根据需要修改config.js
6. node index.js
7. 修改生成的userdb.json，如果开启了白名单，在whitelist中写上允许的玩家。
呼叫bot一次,生成角色的配置，并且将你的角色名那部分的配置里的"user"修改为"admin"来获取管理员权限。

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

chat channel
//切换频道（频道分为公共和私有，对话分别独立，在私有频道使用bot时，bot的消息不会直接返回在公屏上，而是通过/tell来私聊告诉你。在public频道时，所有人都共用同一个聊天。）

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

//以下命令限制userGroup为admin的用户使用

chat addwhitelist 用户名
//添加用户至白名单（如果你有在设置中开启）

chat removewhitelist 用户名
//将用户名从白名单中移除

chat setgroup 组的名称 用户名
//设置用户至特定的组，组目前有三种，分别为"user","admin","block"。user组可以获得机器人的使用权限，但不能使用管理员的命令组，block组将无法使用机器人的任何功能。

//另外，公共聊天频道只有管理员能进行撤销、更换角色、重新生成、开始新对话的操作。

```

rolelist中可以修改/增加系统prompt 格式为：
```json
"角色名称":{
        "description": "prompt",
        "introduction" : "简介"

    },
```

由于bot会使用私聊来私聊玩家,所以说请确保bot拥有使用 __/tell__ 的权限