const OpenAI = require('openai');
const mineflayer = require('mineflayer');
const config = require('./config.js');
const rolelist = require('./rolelist.json');

//初始化玩家数据库
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('./userdb.json');
const db = low(adapter);

db.defaults({ userinfo: {} }).write();

//触发词


let argument = {
    host: config.host,

    port: config.port,
    username: config.username,
    auth: config.auth,
    version: config.version,
    openaiAPIURL: config.openaiAPIURL,
    openaiKey: config.openaiKey,
    openaiModel: config.openaiModel,
    max_token: config.max_token,
    temperature: config.temperature,
    extra_prompt: config.extra_prompt
}

const PlayerInfo = {
    host: argument.host, // 填写要连接的服务器地址

    port: argument.port,
    username: argument.username, // 填写你的微软账号用户名
    auth: argument.auth, // 选择微软验证
    version: argument.version,
}

let bot = mineflayer.createBot(PlayerInfo);





const openai = new OpenAI({
    apiKey: argument.openaiKey,
    baseURL: argument.openaiAPIURL,
});

const trigger = config.trigger;

const merge_string = (mess_spilt, location) => {
    if (mess_spilt.length > 2) {
        let main_message = mess_spilt.slice(location);
        mess_spilt[location] = main_message.join(" ");
    }

    return mess_spilt;
};


//睡
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//设定角色
const set_role = (role, username) => {
    db.get('userinfo')
        .get(username)
        .assign({ 'message': [{ "role": "system", "content": argument.extra_prompt + rolelist[role]["description"] }] })
        .write();
};
//获取角色role

const get_role = (username) => {
    const role = db.get(`userinfo.${username}.role`).value();

    return role;
};

//获取消息列表
const get_messages = (username) => {
    const messages = db.get(`userinfo.${username}.message`).value();

    return messages;
};

//添加消息
const add_messages = (message, username, role) => {
    let add_message = { "role": role, "content": message }
    if (role == "user") {
        add_message = { "role": role, "content": `${username}:${message}` }
    }
    // const messages = db.get(`userinfo.${username}.message`).value();
    db.get('userinfo')
        .get(username)
        .get('message')
        .push(add_message)
        .write();
};

// 删除最后的消息
function deleteMessage(username) {
    const userMessages = db.get(`userinfo.${username}.message`).value();

    if (userMessages && userMessages.length > 1) {
        // 删除最后一个元素
        userMessages.pop();
        db.set(`userinfo.${username}.message`, userMessages).write();
        return true;
    } else {
        return false;
    }
}

//bot说话
const bot_say = async (message) => {
    //字符串分割
    const maxLength = 250;
    let result = [];
    let start = 0;

    //根据\n提前换行
    while (start < message.length) {
        let end = Math.min(start + maxLength, message.length);
        let substr = message.slice(start, end);

        let newlineIndex = substr.lastIndexOf('\n');
        if (newlineIndex !== -1) {
            end = start + newlineIndex;
            substr = message.slice(start, end);
            start = end + 1;  // 跳过换行符
        } else {
            start = end;
        }

        result.push(substr);
    }
    console.log(result);
    //说话部分
    for (const part of result) {
        bot.chat(part);
        await sleep(1000);
    }

};

const help = (username) => {

    bot_say("1.关键字+ help| 获取帮助 2.关键字 +消息| 发送消息请求 3.关键字 + new +消息（可选）|新对话/新对话请求 4.关键字+role+角色名称|切换角色 5.关键字+undo|撤销这次对话 6.关键字+regen+消息（可选）|重新生成/修改后重新生成 7.关键字+rolelist|获取角色列表 8.关键字+init|初始化个人档案");
    set_freeze(username, false);

}


//检测是否新用户
const is_new_user = (username) => {
    const userExists = db.get('userinfo').has(username).value();
    if (!userExists) {
        db.get('userinfo')
            .set(username, { "role": "默认", "freeze": false })
            .write();
        set_role("默认", username);

    };
};

//手动初始化玩家数据库信息，用于出现bug的情况
const init_db = (username) => {
    db.get('userinfo')
        .set(username, { "role": "默认", "freeze": false })
        .write();
    set_role("默认", username);
    set_freeze(username, false);

    bot_say("已重置")

};

//是否冻结
const is_freeze = (username) => {
    const freeze = db.get(`userinfo.${username}.freeze`).value();
    return freeze;
};
//设置冻结状态
const set_freeze = (username, status) => {
    db.get('userinfo')
        .get(username)
        .assign({ "freeze": status })
        .write();
    console.log(status);
};

//调用API
const return_chat = async (username) => {
    try {
        let messageslist = get_messages(username);

        const completion = await openai.chat.completions.create({
            messages: messageslist,
            model: argument.openaiModel,
            max_tokens: argument.max_token,
            temperature: argument.temperature
        });

        const result = completion.choices[0].message.content;
        return result;
    }
    catch (error) {
        bot_say("出现错误，请重试");
        console.log(error);
    }
};


// 新聊天
const new_chat = async (mess_spilt, username) => {
    let role = get_role(username)
    //写入角色
    set_role(role, username);

    if (mess_spilt[2] != undefined) {
        //对于大于2个空格的消息，自动合并到位置2
        mess_spilt = merge_string(mess_spilt, 2)


        add_messages(mess_spilt[2], username, "user");
        const get_chat = await return_chat(username);
        bot_say(get_chat);
        add_messages(get_chat, username, "assistant");

    }

    else {

        bot_say(`@${username},已开始新一轮对话`);
    }
    set_freeze(username, false);

};
//聊天
const chat = async (mess_spilt, username) => {

    //对于大于2个空格的消息，自动合并到1
    mess_spilt = merge_string(mess_spilt, 1)

    add_messages(mess_spilt[1], username, "user");

    const get_chat = await return_chat(username);
    bot_say(get_chat);
    add_messages(get_chat, username, "assistant");
    set_freeze(username, false);

};

//切换角色
const change_role = (mess_spilt, username) => {
    let role = mess_spilt[2];
    if (role != undefined && rolelist[role] != undefined) {
        set_role(role, username);
        db.get('userinfo')
            .get(username)
            .assign({ "role": role })
            .write();
        bot_say(`@${username}成功将角色设定为${role}`)
    }
    else {
        bot_say("格式错误，请检查")
    }
    set_freeze(username, false);

};

//角色列表
const role_list = async (username) => {

    let keys = Object.keys(rolelist); // 获取对象的所有键
    let result = []; // 最终结果数组
    let strings = ""; // 当前拼接字符串

    keys.forEach((key, index) => {
        if (strings.length + key.length + (strings ? 1 : 0) > 200) {
            // 如果当前字符串加上新键和分隔符的长度超过 200，则将当前字符串添加到结果中
            result.push(strings);
            strings = key; // 重置当前字符串为当前键
        } else {
            // 如果当前字符串不为空，则添加分隔符
            if (strings) {
                strings += '|';
            }
            strings += key; // 将当前键加到当前字符串中
        }
    });

    // 将最后一个字符串添加到结果中
    if (strings) {
        result.push(strings);
    }

    for (let i = 0; i < result.length; i++) {
        bot_say(result[i]);
        await sleep(1000);
    }
    set_freeze(username, false);

};

//撤销
const undo = (username) => {
    //删除用户和机器的发言
    let result = deleteMessage(username);
    result = deleteMessage(username);
    if (result == true) {
        bot_say(`成功撤销 @${username}`);

    }
    else {
        bot_say(`无法继续撤销 @${username}`);

    };
    set_freeze(username, false);

};

//重新生成
const regen = async (mess_spilt, username) => {
    const userMessages = db.get(`userinfo.${username}.message`).value();

    if (userMessages && userMessages.length > 1) {

        //附带内容的重新生成
        if (mess_spilt[2] != undefined) {
            deleteMessage(username);
            deleteMessage(username);
            //对于大于2个空格的消息，自动合并到位置2
            mess_spilt = merge_string(mess_spilt, 2)
            add_messages(mess_spilt[2], username, "user");

            const get_chat = await return_chat(username);
            bot_say(get_chat);
            add_messages(get_chat, username, "assistant");
        }
        else {
            deleteMessage(username);
            const get_chat = await return_chat(username);
            bot_say(get_chat);
            add_messages(get_chat, username, "assistant");

        }

    }
    else {
        bot_say("该对话不支持重新生成。")
    }
    set_freeze(username, false);

};

//处理玩家信息字符串
const process_message = (message) => {
    let list_message = message.trim().split(" ");


    return list_message;
};


//对信息进行处理

const command = async (mess_spilt, username) => {
    //冻起来
    set_freeze(username, true);

    console.log(mess_spilt);
    if (mess_spilt[1] != undefined) {
        //系统指令优先级最高
        switch (mess_spilt[1]) {
            //新对话
            case "new":
                new_chat(mess_spilt, username);
                return;
            //撤销对话
            case "undo":
                undo(username);
                return;
            //重新生成对话
            case "regen":
                regen(mess_spilt, username);
                return;
            //切换角色
            case "role":
                change_role(mess_spilt, username);
                return;
            //帮助
            case "help":
                help(username);
                return;
            case "rolelist":
                role_list(username);
                return
        };


        //无匹配命令，视为自由对话
        chat(mess_spilt, username);
        return;


    }
    //喊名字的输出
    if (mess_spilt.length == 1) {
        bot_say("喂，我在");
        set_freeze(username, false);

        return;
    };
};
//监测玩家聊天

bot.on('chat', (username, message) => {
    //处理字符串
    let mess_spilt = process_message(message)
    if (username !== bot.username) {
        //匹配第一关键字
        if (mess_spilt[0].toLowerCase().includes(trigger.toLowerCase())) {
            //检测是否为新用户
            is_new_user(username);
            // 执行命令

            if (mess_spilt[1] == "init") {
                init_db(username);

            }
            else if (is_freeze(username) == false) {
                command(mess_spilt, username);

            }
            else {
                bot_say(`@${username} 你的提交过于频繁，请稍后再试`)

            };
        }
    }
    console.log(username, mess_spilt[0].toLowerCase());

});


const restartBot = async () => {
        await sleep(5000);
        return mineflayer.createBot(PlayerInfo);
};

// 重启bot
const NeedReload = false;

bot.on('kicked', (reason, loggedIn) => {
    if (loggedIn) {
        NeedReload = true;
    }
});

bot.on('end', (reason) => {
    if (NeedReload) {
        bot =restartBot(bot);
        
    }
    console.log(reason);
});

// 监听未处理的异常和拒绝
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
        bot =restartBot(bot);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
        bot =restartBot(bot);
});