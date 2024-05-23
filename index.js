const OpenAI = require('openai');
const mineflayer = require('mineflayer');
const config = require('./config.js');
const rolelist = require('./rolelist.json');

//初始化玩家数据库
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

let argument = {
    whitelist: config.whitelist,
    publicprompt: config.publicprompt,
    host: config.host,
    port: config.port,
    username: config.username,
    auth: config.auth,
    version: config.version,
    openaiAPIURL: config.openaiAPIURL,
    openaiKey: config.openaiKey,
    openaiModel: config.openaiModel,
    max_token: config.max_token,
    max_memory: config.max_memory,
    temperature: config.temperature,
    extra_prompt: config.extra_prompt
}


const adapter = new FileSync('./userdb.json');
const db = low(adapter);

db.defaults({ "whitelist": [], "userinfo": { "serverPublicMessage": { "role": "默认", "message": [{ "role": "system", "content": argument.extra_prompt + rolelist[argument.publicprompt]["description"] }], "freeze": false } } }).write();


//触发词




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
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
//设定角色
const set_role = (role, username) => {
    db.get('userinfo')
        .get(username)
        .assign({ 'message': [{ "role": "system", "content": argument.extra_prompt + rolelist[role]["description"] }] })
        .write();
};

//设置用户组
const set_user_group = (group, username) => {
    db.get('userinfo')
        .get(username)
        .assign({ "userGroup": group })
        .write();
};
//指令设置用户组
const set_user_group_command = (username, mess_spilt) => {
    const setuser = mess_spilt[3];
    const group = mess_spilt[2];
    if (group === undefined || setuser === undefined) {
        bot_say_whisper(username, "命令有误，请检查")
        return;
    }

    is_new_user(setuser);
    const grouplist = ["user", "admin", "block"];
    if (!grouplist.some(element => group.toLowerCase().includes(element))) {
        bot_say_whisper(username, "该用户组不存在");
        return;
    }

    set_user_group(group, setuser);
    bot_say_whisper(username, `已设置玩家${setuser}的用户组为${group}`)

}

//切换频道
const switch_channel = (username) => {
    const channel = db.get(`userinfo.${username}.channel`).value();
    const set_channel = channel === "public" ? "private" : "public";
    db.get('userinfo')
        .get(username)
        .assign({ "channel": set_channel })
        .write();
    bot_say_whisper(username, `已切换频道至${set_channel}`)
};

//获取角色role

const get_role = (username) => {
    const role = db.get(`userinfo.${username}.role`).value();

    return role;
};
//获取用户频道
const get_channel = (username) => {
    const channel = db.get(`userinfo.${username}.channel`).value();

    return channel;
};
//获取消息列表
const get_messages = (username) => {
    const messages = db.get(`userinfo.${username}.message`).value();

    return messages;
};
//获取用户组
const get_user_group = (username) => {
    const user_group = db.get(`userinfo.${username}.userGroup`).value();

    return user_group.toLowerCase();
}

//是否白名单
const is_whitelist = (username) => {
    let whitelist = db.get(`whitelist`).value();
    //白名单转换大小写
    const result = whitelist.map(element => element.toLowerCase()).includes(username.toLowerCase());
    return result
};

//添加消息
const add_messages = (message, username, role) => {
    let add_message = { "role": role, "content": message }
    if (role === "user") {
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
const delete_meesage = (username) => {
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

//添加白名单
const add_whitelist = (username, mess_spilt) => {
    const setuser = mess_spilt[2];
    if (setuser === undefined) {
        bot_say_whisper(username, `请输入添加至白名单的用户名`);
        return;
    }

    if (!is_whitelist(setuser)) {
        db.get('whitelist')
            .push(setuser)
            .write();
        bot_say_whisper(username, `已添加${setuser}至白名单`);
    } else {
        bot_say_whisper(username, `${setuser}已在白名单`);

    }
};
// 白名单中删除用户
function remove_whitelist(username, mess_spilt) {
    const setuser = mess_spilt[2];

    if (setuser === undefined) {
        bot_say_whisper(username, `请输入添加至白名单的用户名`);
        return;
    }

    if (is_whitelist(setuser)) {
        db.get('whitelist')
            .pull(setuser)
            .write();
        bot_say_whisper(username, `已从白名单移除${setuser}`);

    } else {
        bot_say_whisper(username, `${setuser}已经不在白名单`);
    }
};

//bot说话
const bot_say = async (message) => {
    //字符串分割
    let result = [];
    let current_chunk = '';
    let currentsize = 230;

    for (let i = 0; i < message.length; i++) {
        if (message[i] === '\n') {
            if (current_chunk.length > 0) {
                result.push(current_chunk);
                current_chunk = '';
            }
        } else {
            current_chunk += message[i];
            if (current_chunk.length === currentsize) {
                result.push(current_chunk);
                current_chunk = '';
            }
        }
    }

    if (current_chunk.length > 0) {
        result.push(current_chunk);
    }
    //说话部分
    for (const part of result) {
        bot.chat(part);
        await sleep(1000);
    }

};

//私聊
const bot_say_whisper = async (username, message) => {
    //字符串分割
    let result = [];
    let current_chunk = '';
    let currentsize = 230;

    for (let i = 0; i < message.length; i++) {
        if (message[i] === '\n') {
            if (current_chunk.length > 0) {
                result.push(current_chunk);
                current_chunk = '';
            }
        } else {
            current_chunk += message[i];
            if (current_chunk.length === currentsize) {
                result.push(current_chunk);
                current_chunk = '';
            }
        }
    }

    if (current_chunk.length > 0) {
        result.push(current_chunk);
    }
    //说话部分
    for (const part of result) {
        bot.whisper(username, part);
        await sleep(1000);
    }

};


const help = (username) => {

    bot_say_whisper(username, "请参阅插件的README:https://github.com/TLMEMO/MCChatGPTBot")

}


//检测是否新用户
const is_new_user = (username) => {
    const userExists = db.get('userinfo').has(username).value();
    if (!userExists) {
        db.get('userinfo')
            .set(username, { "role": "默认", "channel": "private", "freeze": false })
            .write();
        set_user_group("user", username);
        set_role("默认", username);
    };
};

//手动初始化玩家数据库信息，用于出现bug的情况,不重置用户组
const init_db = (username) => {
    db.get('userinfo')
        .get(username)
        .assign({ "role": "默认", "channel": "private", "freeze": false })
        .write();
    set_role("默认", username);
    bot_say("已重置");

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
};

//计算记忆是否超过规定长度
const check_memory = (username) => {
    const maxLength = argument.max_memory;

    const messages = db.get(`userinfo.${username}.message`).value();
    let totalLength = messages.reduce((total_length, message) => total_length + message.content.length, 0);
    // console.log(totalLength)


    while (totalLength > maxLength && messages.length > 2) {

        const lengthToRemove = messages[1].content.length + messages[2].content.length;
        totalLength -= lengthToRemove;
        // 删除一次问答
        messages.splice(1, 2);

    }
    db.set(`userinfo.${username}.message`, messages).write();


}

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
        add_messages(get_chat, username, "assistant");

        if (username != "serverPublicMessage") {
            bot_say_whisper(username, get_chat);
        }
        else {
            bot_say(get_chat);
        }

    }

    else {
        if (username != "serverPublicMessage") {
            bot_say_whisper(username, `已开始新一轮对话`);
        }
        else {
            bot_say(`已开始新一轮对话`);
        }
    }
    set_freeze(username, false);

};
//聊天
const chat = async (mess_spilt, username) => {

    //对于大于2个空格的消息，自动合并到1
    mess_spilt = merge_string(mess_spilt, 1)

    add_messages(mess_spilt[1], username, "user");

    const get_chat = await return_chat(username);
    add_messages(get_chat, username, "assistant");

    if (username != "serverPublicMessage") {
        bot_say_whisper(username, get_chat);
    }
    else {
        bot_say(get_chat);
    }

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
        if (username === "serverPublicMessage") {
            bot_say(`成功将公共消息的角色设定为${role}`)

        }
        else {
            bot_say_whisper(username, `成功将角色设定为${role}`)

        }
    }
    else {
        if (username === "serverPublicMessage") {
            bot_say("修改角色格式错误，请检查")

        }
        else {
            bot_say_whisper(username, "修改角色格式错误，请检查")

        }
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
        bot_say_whisper(username, result[i]);
        await sleep(1000);
    }

};

//撤销
const undo = (username) => {
    //删除用户和机器的发言
    let result = delete_meesage(username);
    result = delete_meesage(username);
    if (username != "serverPublicMessage") {
        if (result === true) {
            bot_say_whisper(username, `成功撤销 @${username}`);
        }
        else {
            bot_say_whisper(username, `无法继续撤销`);
        };
    }
    else {
        if (result === true) {
            bot_say(`成功撤销公共对话`);
        }
        else {
            bot_say(`无法继续撤销公共对话`);
        };
    }
    set_freeze(username, false);

};

//重新生成
const regen = async (mess_spilt, username) => {
    const userMessages = db.get(`userinfo.${username}.message`).value();

    if (userMessages && userMessages.length > 1) {

        //附带内容的重新生成
        if (mess_spilt[2] != undefined) {
            delete_meesage(username);
            delete_meesage(username);
            //对于大于2个空格的消息，自动合并到位置2
            mess_spilt = merge_string(mess_spilt, 2)
            add_messages(mess_spilt[2], username, "user");

            const get_chat = await return_chat(username);
            add_messages(get_chat, username, "assistant");

            if (username === "serverPublicMessage") {
                bot_say(get_chat);
            }
            else {
                bot_say_whisper(username, get_chat);

            }
        }
        else {
            delete_meesage(username);
            const get_chat = await return_chat(username);
            add_messages(get_chat, username, "assistant");

            if (username === "serverPublicMessage") {
                bot_say(get_chat);
            }
            else {
                bot_say_whisper(username, get_chat);

            }

        }

    }
    else {
        if (username === "serverPublicMessage") {
            bot_say("该对话不支持重新生成。")

        }
        else {
            bot_say_whisper(username, "该对话不支持重新生成。")

        }
    }
    set_freeze(username, false);

};

//处理玩家信息字符串
const process_message = (message) => {
    let list_message = message.trim().split(" ");


    return list_message;
};

//分支功能
const caculate_nether_coordinate = (mess_spilt) => {
    //参数检查
    const centerX = +mess_spilt[2];
    const centerZ = +mess_spilt[3];
    const currentX = +mess_spilt[4];
    const currentY = +mess_spilt[5];
    const currentZ = +mess_spilt[6];
    const isSkyblock = mess_spilt[7];
    if(centerX ==undefined ||centerZ ==undefined|| currentX ==undefined ||currentY ==undefined ||currentZ ==undefined ||isSkyblock ==undefined)
{        bot_say("参数输入错误，请重试。格式：bot启动词 caneco 岛中心坐标X 岛中心坐标Z 当前坐标X 当前坐标Y 当前坐标Z 是否为空岛（true/false\)");
        return;}
    try
    // 边界检查
    {

        if (currentY > 320 || currentY < -64) {
            bot_say("Y值必须在-64到320之间");
            return;
        }
        if (Math.abs(currentX - centerX) > 4096 || Math.abs(currentZ - centerZ) > 4096) {
            bot_say("当前X和当前Z不能超过岛屿中心点正负4096的位置");
            return;
        }

        const offsetX = currentX - centerX;
        const offsetZ = currentZ - centerZ;

        const netherX = Math.floor((isSkyblock === "true") ? centerX + offsetX : centerX + offsetX / 8);
        const netherY = currentY;
        const netherZ = Math.floor((isSkyblock === "true") ? centerZ + offsetZ : centerZ + offsetZ / 8);

        bot_say('对应地狱坐标为 X=' + netherX + ', Y=' + netherY + ', Z=' + netherZ);
    }

    catch (e) {
        bot_say("参数输入错误，请重试。格式：bot启动词 caneco 岛中心坐标X 岛中心坐标Z 当前坐标X 当前坐标Y 当前坐标Z 是否为空岛（true/false\)");
    }
}

//对信息进行处理

const command = async (mess_spilt, username) => {



    set_freeze(username, true);

    if (mess_spilt[1] != undefined) {
        const read_command = mess_spilt[1].toLowerCase();

        //系统指令优先级最高
        switch (read_command) {
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
        };


        //无匹配命令，视为自由对话
        chat(mess_spilt, username);
        return;


    }

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

            //用户使用权限检测
            if (argument.whitelist === true) {
                // 使用白名单
                if (is_whitelist(username) != true) {
                    bot_say_whisper(username, "你没有bot的使用许可");
                    return;
                }
            }
            else {
                //使用黑名单
                if (get_user_group(username) === "block") {
                    bot_say_whisper(username, "你没有bot的使用许可");
                    return;
                }
            }
            //喊名字的输出
            if (mess_spilt.length === 1) {
                bot_say("喂，我在");
                set_freeze(username, false);

                return;
            };
            //无视公共和私聊的指令
            const read_command = mess_spilt[1].toLowerCase();

            switch (read_command) {
                case "init":
                    //手动初始化
                    init_db(username);
                    return;
                case "channel":
                    //切换频道
                    switch_channel(username);
                    return;
                case "help":
                    //帮助
                    help(username);
                    return;
                case "rolelist":
                    //获取角色
                    role_list(username);
                    return;
                case "caneco":
                    //计算地狱坐标
                    caculate_nether_coordinate(mess_spilt)
                    return;
            }


            //管理员命令检查
            function admin_check(custom_fun) {
                return function (username, ...args) {

                    if (get_user_group(username) !== "admin") {
                        bot_say_whisper(username, "你没有权限执行该命令");
                        return;
                    }
                    custom_fun(...args);

                };
            }
            //管理员命令设置组

            if (read_command === "setgroup") {
                const setgroup = admin_check(set_user_group_command);
                setgroup(username, username, mess_spilt);
                return;
            }
            //添加白名单
            if (read_command === "addwhitelist") {
                const addwl = admin_check(add_whitelist);
                addwl(username, username, mess_spilt);
                return;
            }
            //删除白名单
            if (read_command === "removewhitelist") {
                const rmwl = admin_check(remove_whitelist);
                rmwl(username, username, mess_spilt);
                return;
            }


            const admin_command_public = ["new", "regen", "undo", "role"];
            const admin_command_private = [];

            // 执行其他命令
            if (get_channel(username) === "public") {



                if (is_freeze("serverPublicMessage") === false) {
                    //是否是管理员指令
                    if (get_user_group(username) != "admin") {
                        if (admin_command_public.some(element => mess_spilt[1].toLowerCase().includes(element))) {
                            bot_say_whisper(username, "你没有权限执行该命令");
                            return;
                        }
                    };

                    set_freeze("serverPublicMessage", true);
                    if (read_command != "undo") {
                        check_memory("serverPublicMessage");

                    }

                    command(mess_spilt, "serverPublicMessage");

                }
                else {
                    bot_say(`@${username} 已有正在生成的对话，请稍后再试`)

                };
            }
            else {
                //私聊模式
                if (is_freeze(username) === false) {
                    set_freeze(username, true);
                    if (read_command != "undo") {
                        check_memory(username);

                    }
                    command(mess_spilt, username);

                }
                else {
                    bot_say_whisper(username, `你的提交过于频繁，请稍后再试`)
                };
            };


        }
    }
    console.log(username, message);

});

// 本来我是要让Bot获取用户私聊来达到私密对话的效果，由于我测试用的服务端bot私聊的消息会在chat被获取到，而不是在whisper中，故消息处理全只能公开处理了
// bot.on('whisper', (username, message) => { 

//   }) 

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
        bot = restartBot(bot);

    }
    console.log(reason);
});

// 监听未处理的异常和拒绝
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    bot = restartBot(bot);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    bot = restartBot(bot);
});