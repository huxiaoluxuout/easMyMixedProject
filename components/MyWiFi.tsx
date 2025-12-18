import WifiManager from 'react-native-wifi-reborn';
import {StyleSheet, View, Text, Button, PermissionsAndroid, Platform, FlatList} from "react-native";
import React, {useEffect, useState} from "react";


// 创建可导出的函数组件
export default function MyWifi(SSID: string) {

    const [wifi, setWifi] = useState('')
    const [bssid, setBssid] = useState('')
    const [ip, setIp] = useState('')
    // 检查WiFi是否启用
    const checkWifiEnabled = async () => {
        try {
            const isEnabled = await WifiManager.isEnabled();
            console.log('WiFi是否启用:', isEnabled);

            if (!isEnabled) {
                // 在Android上可以尝试启用WiFi
                await WifiManager.setEnabled(true);
            }
        } catch (error) {
            console.error('检查WiFi状态失败:', error);
        }
    };
    // 获取当前连接的WiFi信息
    const getCurrentWifi = async () => {
        try {
            const wifi = await WifiManager.getCurrentWifiSSID();
            console.log('当前WiFi名称:', wifi);
            setWifi(wifi)
            const bssid = await WifiManager.getBSSID();
            console.log('BSSID:', bssid);
            setBssid(bssid)

            const ip = await WifiManager.getIP();
            console.log('IP地址:', ip);
            setIp(ip)
        } catch (error) {
            console.error('获取WiFi信息失败:', error);
        }
    };
    //  扫描WiFi网络
    const scanWifiNetworks = async () => {
        // Android需要先请求位置权限
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: '位置权限请求',
                    message: '需要位置权限来扫描WiFi网络',
                    buttonNeutral: '稍后询问',
                    buttonNegative: '取消',
                    buttonPositive: '确定',
                }
            );

            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                console.log('位置权限被拒绝');
                return;
            }
        }

        try {
            const wifiList = await WifiManager.loadWifiList();
            console.log('扫描到的WiFi网络:', wifiList);

            // wifiList 是一个数组，包含以下信息：
            // SSID、BSSID、频率、强度等
            wifiList.forEach((wifi, index) => {
                console.log(`${index + 1}. ${wifi.SSID} - 信号强度: ${wifi.level}dBm`);
            });


        } catch (error) {
            console.error('扫描失败:', error);
        }
    };


    // 断开WiFi连接
    const disconnectFromWifi = async () => {
        try {
            await WifiManager.disconnect();
            console.log('已断开WiFi连接');
        } catch (error) {
            console.error('断开连接失败:', error);
        }
    };

    // 在组件内部使用useEffect监听蓝牙状态
    useEffect(() => {
        scanWifiNetworks()
    }, []);


    return (<>

        <View style={styles.screen}>
            <Text>MyWifi: {wifi}</Text>
            <Text>bssid: {bssid}</Text>
            <Text>ip: {ip}</Text>
            {}
            <View style={styles.button}>
                <Button
                    onPress={() => getCurrentWifi()}
                    title="getCurrentWifi"
                />

            </View>

            <View style={styles.button}>

                <Button
                    onPress={() => scanWifiNetworks()}
                    title="scanWifiNetworks"
                />
            </View>

            <View style={styles.button}>

                <Button
                    onPress={() => checkWifiEnabled()}
                    title="checkWifiEnabled"
                />
            </View>

           {/* <View style={styles.button}>

                <Button
                    onPress={() => disconnectFromWifi()}
                    title="disconnectFromWifi"
                />
            </View>*/}

        </View>

    </>);
    // 这个组件可以返回null，因为它主要用于蓝牙功能的初始化
    // return null;
}

const styles = StyleSheet.create({

    screen: {
        marginTop: 40,
        marginBottom: 40,
    },
    button: {
        marginTop: 40,
        // marginBottom: 40,
    }
});

