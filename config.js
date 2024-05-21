module.exports = {
    whitelist: false, //白名单模式，设置为true则只有用户在userdb.json中的whitelist中才可以使用该Bot
    publicprompt: "默认",//设置公共聊天的默认prompt，请填写rolelist里存在的prompt名字，如果要自定义prompt，请先在rolelist里根据格式添加对应的prompt
    host: '127.0.0.1', // 填写要连接的服务器地址
    port: 25565, //服务器端口
    username: '', // 如果使用正版登录填写你的邮箱
    auth: 'microsoft', // 选择微软验证
    version: '1.20.4', //游戏版本
    openaiAPIURL : "https://api.openai.com/v1",
    openaiKey : "", //填写APIkey
    openaiModel : "gpt-3.5-turbo",
    max_token : 200, //最大返回token
    max_memory : 4096 ,//最大记忆字节数，超过这个字节，记忆将被剪裁。由于各个模型的分词器不同，就不写计算token的了，用字节代替了。注意模型支持的最大上下文token，这个值不要设置的太大,但由于同时计算了system prompt的值，所以说不能太小（比系统prompt长度小）。
    temperature : 0.7,  //温度
    trigger : "chat", //触发机器人功能的关键字，只检测开头至第一个空格的文字，会自动转换成小写
    extra_prompt: '你正在minecraft游戏中进行角色扮演,所以说请不要使用markdown格式来返回消息。下面是你要扮演的角色信息。'  //额外提示词，会加在每个系统提示词前面
};