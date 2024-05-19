module.exports = {
    host: '127.0.0.1', // 填写服务器地址
    
    port: 25565, //服务器端口
    username: '', // 如果使用正版登录填写你的邮箱

    auth: 'microsoft', // 选择微软验证
    version: '1.20.4', //游戏版本
    openaiAPIURL : "https://api.openai.com/v1",//OpenAIAPi地址
    openaiKey : "", //Key
    openaiModel : "gpt-3.5-turbo", //选用的模型
    max_token : 2000, //最大token
    temperature : 0.7, //温度
    trigger : 'chat', //触发机器人功能的关键字，只检测开头至第一个空格的文字，会自动转换成小写
    extra_prompt: '你正在minecraft游戏中进行角色扮演,所以说请不要使用markdown格式来返回消息。下面是你要扮演的角色信息。' //额外提示词，会加在每个系统提示词前面
};