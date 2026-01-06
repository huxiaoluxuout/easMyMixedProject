import React,{useEffect, useState} from 'react';

import {View, Button, StyleSheet,Text} from 'react-native';



import BackgroundService from 'react-native-background-actions';

const MyForegroundService = () => {

    const [num, setNum] = useState(1)



    const backgroundTask = async (taskData) => {
        const { delay } = taskData;
        while (BackgroundService.isRunning()) {
            console.log('✅ 后台任务运行中...');
            setNum((prevState)=>prevState+1)
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    };

    const startService = async () => {
        const options = {
            taskName: 'MyBackgroundTask',
            taskTitle: '后台服务运行中',
            taskDesc: '点击可返回应用',
            taskIcon: { name: 'splashscreen_logo', type: 'drawable' }, // ✅ 明确图标
            color: '#0000ff',
            channelName: '后台服务',
            channelDescription: '保持应用后台运行',
            foregroundServiceType: 'dataSync',
            parameters: { delay: 5000 },

            // 👇 强制高优先级（Android）
            importance: 4, // IMPORTANCE_HIGH (4) or IMPORTANCE_MAX (5)
        };

        try {
            await BackgroundService.start(backgroundTask, options);
            console.log('🟢 后台服务启动成功');
        } catch (err) {
            console.error('🔴 启动失败:', err);
        }
    };

    return <View style={styles.screen}>

        <View style={styles.button_}>
            <Button
                title="后台任务运行中"
                onPress={() => startService()}
            />
            <Text style={styles.text}>num:{num}</Text>
        </View>

    </View>
};

export default MyForegroundService;

const styles = StyleSheet.create({
    screen: {
        marginTop: 40,
        marginBottom: 40,
        flex: 1,

    },
    button_: {
        marginTop: 20,
        marginBottom: 20,
    },
    text:{
        fontSize:20,
        color:'red',
        textAlign:'center',
        padding:30,
    }
});
