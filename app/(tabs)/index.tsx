import MyWifi from "@/components/MyWiFi";

import MyBle from "@/components/MyBle";
import MyImage from "@/components/MyImage";
import VisionCamera from "@/components/VisionCamera";
import MyDocumentPicker from "@/components/MyDocumentPicker";
import MyAsyncStorage from "@/components/MyAsyncStorage";
import MyForegroundService from "@/components/MyForegroundService";

import {PaperProvider} from 'react-native-paper';

import {useState} from 'react';
import DeviceInfo from 'react-native-device-info';

import {Alert, Button, StyleSheet, Text, View,} from 'react-native';
import MyReactNativePaper from "@/components/MyReactNativePaper";


export default function HomeScreen() {
// 获取并打印设备型号（如 "Redmi Note 13", "iPhone15,2"）
    const printDeviceModel = async () => {
        const model = DeviceInfo.getModel(); // 同步方法
        const modelName = await DeviceInfo.getDeviceName(); // 异步，返回用户设置的设备名（如“小明的 iPhone”）
        const brand = DeviceInfo.getBrand(); // 如 "Xiaomi", "Apple", "samsung"

        console.log('📱 手机品牌:', brand);
        console.log('📱 手机型号 (model):', model);
        console.log('📱 设备名称 (user-defined):', modelName);

        // 示例输出（红米 Note 13）:
        // 手机品牌: Xiaomi
        // 手机型号: Redmi Note 13
        // 设备名称: XiaoLu's Phone
    };

    return (
        // <VisionCamera></VisionCamera>
        <PaperProvider>
            {/*<View style={styles.screen}>*/}
            {/*    <Text style={styles.title}>App</Text>*/}

                <MyReactNativePaper></MyReactNativePaper>
                {/*<View>
                    <Button
                        title="手机型号"
                        onPress={() => printDeviceModel()}
                    />
                </View>*/}

                {/*<MyAsyncStorage></MyAsyncStorage>*/}
                {/*<MyForegroundService></MyForegroundService>*/}
                {/*<MyDocumentPicker></MyDocumentPicker>*/}

                {/*<MyImage></MyImage>*/}

                {/*<MyBle></MyBle>*/}
                {/*<MyWifi></MyWifi>*/}


            {/*</View>*/}
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    screen: {
        marginTop: 40,
        marginBottom: 40,
        flex: 1,

    },
    title_box: {
        marginTop: 40,
        paddingHorizontal: 40,
    },
    title: {
        fontSize: 16,
        color: 'red',
        fontWeight: 'bold',
        marginBottom: 20
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        color: 'red'
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
});
