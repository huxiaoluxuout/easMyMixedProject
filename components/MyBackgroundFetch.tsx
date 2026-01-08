import React,{useEffect,useRef , useState} from 'react';

import {View, Button, StyleSheet, Text, Platform} from 'react-native';


import BackgroundFetch from 'react-native-background-fetch';


import {log} from "@/hooks/logger";


const MyBackgroundFetch = () => {

    const [num, setNum] = useState(1)
    const numRef = useRef(num); // 创建一个 ref
    let numValue = 0
    // 定义你的后台任务回调函数
    const backgroundFetchCallback = async (taskId) => {
        console.log('[BackgroundFetch] 开始执行任务:', taskId);

        try {
            // 在这里执行你的后台任务逻辑
            // 例如：同步数据
            // const response = await fetch('YOUR_API_ENDPOINT');
            // const data = await response.json();
            // 更新本地存储等...

            console.log('[BackgroundFetch] 任务完成:', taskId);

        } catch (error) {
            console.error('[BackgroundFetch] 任务执行失败:', taskId, error);
        } finally {
            // 必须调用此方法来通知系统任务已完成
            // 这对于释放系统资源和安排下一次任务至关重要
            BackgroundFetch.finish(taskId);
        }
    };
    // 每次 num 更新时，同步更新 ref.current
    useEffect(() => {
        numRef.current = num;

    }, [num]);

// 配置 BackgroundFetch
    const configureBackgroundFetch = async () => {
        try {
            await BackgroundFetch.configure(
                {
                    minimumFetchInterval: 5, // 最小间隔，单位为秒 (例如 15 分钟)
                    // stopOnTerminate: false,  // (Android) 应用被终止后是否继续运行 (需要特殊配置)
                    // enableHeadless: true,    // (Android) 启用 Headless 任务 (在应用未启动时运行 JS)
                    // forceAlarmManager: true, // (Android) 强制使用 AlarmManager
                    // requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY, // (Android) 任务运行所需的网络类型
                    // timeout: 30000, // (Android) 任务超时时间 (毫秒)
                },
                backgroundFetchCallback, // 成功时调用的回调
                (error) => { // 失败时调用的回调
                    console.error('[BackgroundFetch] 配置失败:', error);
                }
            );

            console.log('[BackgroundFetch] 配置成功');
            // 启动后台任务监听
            await BackgroundFetch.start();

            console.log('[BackgroundFetch] 已启动');
            setInterval(()=>{
                setNum((prevState)=>prevState+1)
                numValue++
                log.debug('这是调试信息',numRef.current,numValue);
            },2000)
        } catch (error) {
            console.error('[BackgroundFetch] 启动失败:', error);
        }
    };

// 在应用启动时进行配置
// 例如，在 App 组件的 useEffect 或 componentDidMount 中调用
// useEffect(() => {
//   configureBackgroundFetch();
// }, []);

// 可选：在应用卸载或特定时机停止
// const cleanup = async () => {
//   await BackgroundFetch.stop(); // 停止所有后台任务
// };

// 也可以调度一次性或周期性自定义任务
// BackgroundFetch.scheduleTask({
//   taskId: 'com.transistorsoft.customtask',
//   delay: 60 * 60 * 1000, // 1小时后执行
//   periodic: true, // 是否为周期性任务
//   forceAlarmManager: true, // (Android) 强制使用 AlarmManager
// }).then(() => {
//   console.log('自定义任务已调度');
// }).catch((error) => {
//   console.error('调度自定义任务失败:', error);
// });
    return <View style={styles.screen}>

        <View style={styles.button_}>
            <Button
                title="BackgroundFetch"
                onPress={() => configureBackgroundFetch()}
            />
            <Text style={styles.text}>num:{num}</Text>
        </View>


    </View>
};

export default MyBackgroundFetch;

const styles = StyleSheet.create({
    screen: {
        marginTop: 20,
        marginBottom: 20,
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
