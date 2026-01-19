import WifiManager from 'react-native-wifi-reborn';
import {StyleSheet, View, Text, Button, PermissionsAndroid, Platform, FlatList, TouchableOpacity, Alert, Pressable} from "react-native";
import React, {useEffect, useState} from "react";


// 创建可导出的函数组件
export default function MyWifi(SSID: string) {

    const [wifiList, setWifiList] = useState([])

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
            const bssid = await WifiManager.getBSSID();
            console.log('BSSID:', bssid);
            const ip = await WifiManager.getIP();
            console.log('IP地址:', ip);
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
            const list = await WifiManager.loadWifiList();
            console.log('扫描到的WiFi网络:', list);
            setWifiList(list)

            // wifiList 是一个数组，包含以下信息：
            // SSID、BSSID、频率、强度等
            list.forEach((wifiItem, index) => {
                console.log(`${index + 1}. ${wifiItem.SSID} - 信号强度: ${wifiItem.level}dBm`);
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

    const sortedList = [...wifiList].sort((a, b) => b.level - a.level);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedWifi, setSelectedWifi] = useState(null);
    const [password, setPassword] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    // Helper to check if 5G based on frequency (roughly > 5000MHz)
    const is5G = (freq) => freq > 5000;

    // Helper for signal color
    const getSignalColor = (level) => {
        if (level > -50) return '#4CAF50'; // Green (Excellent)
        if (level > -70) return '#FF9800'; // Orange (Good)
        return '#F44336';                  // Red (Weak)
    };

    // 处理点击事件的函数
    const onWifiClick = (wifiItem) => {
        // 这里获取到了点击的具体 WiFi 对象
        console.log('用户点击了:', wifiItem.SSID);
        console.log('完整信息:', wifiItem);

        // 演示：弹窗显示信息
        Alert.alert(
            'WiFi 选择',
            `你要连接到 "${wifiItem.SSID}" 吗?\n信号强度: ${wifiItem.level} dBm`,
            [
                {text: '取消', style: 'cancel'},
                {
                    text: '连接',
                    onPress: () => contentWifi(wifiItem)
                }
            ]
        );
    };
    // const contentWifi = (wifiItem) => {
    //     console.log('执行连接逻辑...---', wifiItem.BSSID)
    // }
    // 1. 点击列表项的处理逻辑
    const contentWifi = (wifiItem) => {
        console.log('执行连接逻辑...---', wifiItem.BSSID)

        // 检查加密方式 (简单判断)
        const capabilities = wifiItem.capabilities || '';
        const isOpen = !capabilities.includes('WPA') && !capabilities.includes('WEP') && !capabilities.includes('EAP');

        if (isOpen) {
            // 如果是开放网络，直接尝试连接
            handleConnect(wifiItem.SSID, '');
        } else {
            // 如果是加密网络，保存选中的WiFi并打开密码弹窗
            setSelectedWifi(wifiItem);
            setPassword(''); // 清空之前的密码
            setModalVisible(true);
            handleConnect(wifiItem.BSSID,'BF123456')

        }
    };

    // 2. 核心连接逻辑
    const handleConnect = async (ssid, pwd) => {
        setIsConnecting(true);
        setModalVisible(false); // 关闭弹窗

        console.log(`正在连接到: ${ssid}`);

        try {
            // 大部分现代路由器是 WPA/WPA2，所以 isWep 通常为 false
            const isWep = false;

            if (pwd.length > 0) {
                // 修复点：添加第四个参数 false
                await WifiManager.connectToProtectedSSID(ssid, pwd, isWep, false);
            } else {
                // 开放网络通常不需要改
                await WifiManager.connectToSSID(ssid);
            }

            Alert.alert('连接成功', `已连接到 ${ssid}`);

        } catch (error) {
            console.log('连接失败', error);
            Alert.alert('连接失败', '请检查密码或重试\n' + (error.message || error));
        } finally {
            setIsConnecting(false);
        }


    };
    const renderItem = ({item, index}) => (
        <TouchableOpacity style={styles.itemContainer}
                          onPress={() => onWifiClick(item)} // 3. 传入当前 item
                          activeOpacity={0.6} // 点击时的透明度效果
        >
            <View style={styles.leftColumn}>
                <View style={styles.ssidRow}>
                    <Text style={styles.index}>{index + 1}.</Text>
                    <Text style={styles.ssid}>{item.SSID || '(Hidden SSID)'}</Text>

                    {/* 5G Tag */}
                    {is5G(item.frequency) && (
                        <View style={styles.tag5g}>
                            <Text style={styles.tagText}>5G</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.bssid}>MAC: {item.BSSID}</Text>
            </View>

            <View style={styles.rightColumn}>
                <Text style={[styles.signalLevel, {color: getSignalColor(item.level)}]}>
                    {item.level} dBm
                </Text>
                <Text style={styles.frequency}>{item.frequency} MHz</Text>
            </View>
        </TouchableOpacity>
    );
    return (<>

        <View style={styles.screen}>

            <FlatList
                data={sortedList}
                renderItem={renderItem}
                keyExtractor={(item) => item.BSSID} // Critical: BSSID is the unique ID
                contentContainerStyle={{padding: 16}}
            />

            <View style={styles.button}>
                <Button
                    onPress={() => getCurrentWifi()}
                    title="获取"
                />

            </View>

            <View style={styles.button}>

                <Button
                    onPress={() => scanWifiNetworks()}
                    title="扫描"
                />
            </View>

            <View style={styles.button}>

                <Button
                    onPress={() => checkWifiEnabled()}
                    title="开/关"
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
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    listContent: {
        padding: 16,
    },
    itemContainer: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 10,
        borderRadius: 8,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Elevation for Android
        elevation: 3,
    },
    ssidText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    signalText: {
        fontSize: 14,
        color: '#666',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },

    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
        borderRadius: 8,
        elevation: 2, // Android shadow
    },
    leftColumn: {flex: 1},
    ssidRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 4},
    index: {color: '#999', marginRight: 8, fontSize: 12},
    ssid: {fontSize: 16, fontWeight: 'bold', color: '#333'},
    tag5g: {
        backgroundColor: '#E3F2FD',
        marginLeft: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tagText: {color: '#2196F3', fontSize: 10, fontWeight: 'bold'},
    bssid: {fontSize: 12, color: '#888'},
    rightColumn: {alignItems: 'flex-end', minWidth: 70},
    signalLevel: {fontSize: 16, fontWeight: 'bold'},
    frequency: {fontSize: 11, color: '#aaa', marginTop: 2},
});

