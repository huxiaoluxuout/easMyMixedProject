import React, {useEffect, useState} from 'react';
import {
    PermissionsAndroid,
    Platform,
    View,
    Button,
    StyleSheet,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable, Alert
} from 'react-native';
import {Characteristic, Device} from 'react-native-ble-plx';
import {bleManager} from '@/hooks/use-ble-manager';
import {BLESender, chunkHexToBase64, verifyChunking} from "@/hooks/chunkHexToBase64";

// Android动态权限申请
async function requestAndroidPermissions() {
    if (Platform.OS !== 'android') return true;

    if (Platform.Version >= 31) {
        // Android 12及以上
        const grants = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

        const hasScanPermission = grants['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED;
        const hasConnectPermission = grants['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;

        console.log('蓝牙权限状态:', {
            scan: hasScanPermission,
            connect: hasConnectPermission
        });

        return hasScanPermission && hasConnectPermission;
    } else {
        // Android 11及以下
        // 注意：在新版本的React Native中，BLUETOOTH和BLUETOOTH_ADMIN权限常量已被移除
        // 对于Android 11及以下版本，我们只需要请求位置权限
        const grants = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        // 检查权限授予情况
        const hasLocationPermission = grants['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;
        // 对于旧版本Android，假设蓝牙权限默认可用（系统会自动授予）
        const hasBluetoothPermission = true;
        const hasBluetoothAdminPermission = true;

        console.log('蓝牙权限状态:', {
            bluetooth: hasBluetoothPermission,
            bluetoothAdmin: hasBluetoothAdminPermission,
            location: hasLocationPermission
        });

        return hasBluetoothPermission && hasBluetoothAdminPermission && hasLocationPermission;
    }
}

// 创建可导出的函数组件
export default function MyBle() {
    const [deviceId, setDeviceId] = useState('')

    // 使用 Map 来存储设备，Key 是 ID，Value 是 Device 对象
// 这样做可以自动去重：相同的 ID 会直接覆盖旧数据
// 1. 只保留 Map 作为唯一真实数据源
    const [deviceMap, setDeviceMap] = useState<Map<string, Device>>(new Map());

    // 2. 【架构修正】每次渲染时，自动根据 Map 生成最新的 List
    // 这种写法保证了 List 永远与 Map 同步，且不会有闭包问题
    // 使用 useMemo 优化性能，防止非必要计算
    const devicesList = React.useMemo(() => {
        return Array.from(deviceMap.values());
    }, [deviceMap]);


    const connectToDeviceTo = (device: Device) => {
        console.log('device', device)
        connectToDevice(device)
    }
    // 连接设备的函数
    const connectToDevice = async (device: Device) => {
        try {

            console.log('正在连接设备:', device.name, device.id);
            const connectedDevice = await bleManager.connectToDevice(device.id);
            console.log('设备连接成功:', connectedDevice.name, connectedDevice.id);
            setDeviceId(device.id);
            bleManager.stopDeviceScan();

            // 添加连接状态监听
            connectedDevice.onDisconnected((error, device) => {
                console.log('设备连接断开', error ? `原因: ${error.message}` : '');
            });
            // 可以在这里进行进一步操作，如发现服务/特征等
            const Characteristics = await connectedDevice.discoverAllServicesAndCharacteristics();
            console.log('Characteristics:', Characteristics);

            // 获取特定服务的所有特征
            // const targetServiceUUID = "646687FB-033F-9393-6CA2-0E9401ADEB32";
            const targetServiceUUID = "0000FFF0-0000-1000-8000-00805F9B34FB";
            const characteristics = await connectedDevice.characteristicsForService(targetServiceUUID);

            if (characteristics.length === 0) {
                console.warn(`服务 ${targetServiceUUID} 没有找到任何特征`);
            } else {
                console.log(`服务 ${targetServiceUUID} 的特征列表:`);

                // 详细输出每个特征的信息
                characteristics.forEach((characteristic, index) => {
                    console.log(`\n特征 ${index + 1}:`);
                    console.log(`  UUID: ${characteristic.uuid}`);
                    console.log(`  属性: ${getCharacteristicProperties(characteristic)}`);
                    console.log(`  可读: ${characteristic.isReadable}`);
                    console.log(`  可写(需响应): ${characteristic.isWritableWithResponse}`);
                    console.log(`  可写(无需响应): ${characteristic.isWritableWithoutResponse}`);
                    console.log(`  可通知: ${characteristic.isNotifiable}`);
                    console.log(`  可指示: ${characteristic.isIndicatable}`);

                    if (characteristic.isReadable) {
                        console.log('执行读取操作...');
                        characteristic.read().then(value => {
                            console.log('读取结果:', value);
                            // @ts-ignore
                            console.log('读取结果-十六进制:', base64ToHex(value.value))

                        })
                    }
                    if (characteristic.isNotifiable) {
                        characteristic.monitor((error, char) => {
                            if (error) console.error('监听错误:', error);
                            else {
                                // console.log('收到通知:', char)
                                // @ts-ignore
                                console.log('十六进制:', base64ToHex(char.value))
                                const now = new Date();
                                const hours = String(now.getHours()).padStart(2, '0');
                                const minutes = String(now.getMinutes()).padStart(2, '0');
                                const seconds = String(now.getSeconds()).padStart(2, '0');
                                const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
                                console.log(`时间: ${hours}:${minutes}:${seconds}.${milliseconds}`);

                                // 收到通知: {"deviceID": "D6:00:00:11:07:26", "id": 14, "isIndicatable": false, "isNotifiable": true, "isNotifying": true, "isReadable": false, "isWritableWithResponse": false, "isWritableWithoutResponse": false, "serviceID": 10, "serviceUUID": "0000fff0-0000-1000-8000-00805f9b34fb", "uuid": "0000fff5-0000-1000-8000-00805f9b34fb", "value": "qlVCU6HxvlWq"}
                            }
                        });
                    }
                });

                // 根据特征属性筛选特定类型的特征
                const readableChars = characteristics.filter(c => c.isReadable);
                const notifiableChars = characteristics.filter(c => c.isNotifiable);

                console.log(`\n可读特征: ${readableChars.length} 个`);
                console.log(`可通知特征: ${notifiableChars.length} 个`);

            }

        } catch (error) {
            console.error('连接设备失败:', error);
        }
    };

    // 辅助函数：获取特征属性描述
    function getCharacteristicProperties(char: Characteristic) {
        const props = [];
        if (char.isReadable) props.push('READ');
        if (char.isWritableWithResponse) props.push('WRITE_WITH_RESPONSE');
        if (char.isWritableWithoutResponse) props.push('WRITE_WITHOUT_RESPONSE');
        if (char.isNotifiable) props.push('NOTIFY');
        if (char.isIndicatable) props.push('INDICATE');
        return props.join(' | ');
    }


    // 首先，定义一个 Device 的类型接口
    interface Device {
        id: string;
        localName?: string; // 使用 ? 表示可选属性
    }


    const wSend = [
        {
            hexData: 'AA 55 42 52 A1 4E 55 AA',
            description: '读取设备开关机状态'
        },
        {
            hexData: 'AA 55 42 52 A2 4D 55 AA',
            description: '有无风扇 有无电量显示'
        },
        {
            hexData: 'AA 55 42 52 AF 01 55 AA',
            description: '设备锁功能'
        },
        {
            hexData: 'AA 55 42 52 A6 49 55 AA',
            description: '读取设备电量'
        },
        {
            hexData: 'AA 55 42 52 AA 45 55 AA',
            description: '设备信息'
        },
        {
            hexData: 'AA 55 42 52 AE 41 55 AA',
            description: '模式开关指令'
        }
    ]

    function onPressLearnMore() {
        console.log('deviceId', deviceId)
        // const hexData = 'AA554257A1014A55AA';
        // const base64DataToWrite = hexToBase64(hexData);
        // console.log('Base64数据:', base64DataToWrite); // 输出应为：qlVCV6EBSpWq
        /* bleManager.writeCharacteristicWithResponseForDevice(
             deviceId,
             '0000FFF0-0000-1000-8000-00805F9B34FB',
             '0000FFF2-0000-1000-8000-00805F9B34FB',
             base64DataToWrite // 传入Base64字符串
         )*/
        wSend.forEach(item => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

            console.log(`时间：${hours}:${minutes}:${seconds}.${milliseconds}`);
            const base64DataToWrite = hexToBase64(item.hexData);
            // console.log('item.hexData', item.hexData, 'description:', item.description)
            bleManager.writeCharacteristicWithResponseForDevice(deviceId,
                '0000FFF0-0000-1000-8000-00805F9B34FB',
                '0000FFF2-0000-1000-8000-00805F9B34FB', base64DataToWrite)
        })


    }

    // 测试用例
    async function testChunking(hexData: string) {
        const testData = hexData;

        console.log('=== 开始测试 ===');

        // 1. 验证数据转换
        console.log('\n1. 验证数据完整性:');
        const isValid = verifyChunking(testData, 20);
        console.log('数据完整性验证:', isValid ? '✅ 通过' : '❌ 失败');

        // 2. 生成分包
        console.log('\n2. 生成分包数据:');
        const packets = chunkHexToBase64(testData, 20, false);

        console.log(`\n共 ${packets.length} 个包:`);
        packets.forEach((packet, index) => {
            console.log(`包 ${index + 1}: ${packet.substring(0, 30)}...`);
        });

        // 3. 发送测试
        console.log('\n3. 发送测试:');
        return packets;
    }


    /**
     * 使用示例
     */
    async function onPressWrite() {
        console.log('开始写入工作参数...');

        // 确保设备已连接
        // 创建发送器
        const sender = new BLESender(
            bleManager,
            deviceId,
            '0000FFF0-0000-1000-8000-00805F9B34FB',
            '0000FFF2-0000-1000-8000-00805F9B34FB'
        );
        try {


            // 你的数据
            const hexData = 'AA 55 42 57 A8 08 00 16 0A 00 05 00 78 7F 02 00 16 00 00 05 00 A0 73 00 00 00 00 00 05 00 A0 00 00 00 00 00 00 05 00 A0 00 00 00 00 00 00 05 00 A0 00 33 55 AA';

            await testChunking(hexData)
            // 发送分包数据
            await sender.sendChunkedData(hexData, {
                chunkSize: 20,
                delayMs: 10,  // 增加延迟确保设备能处理
                withResponse: true,
                progressCallback: (current: number, total: number) => {
                    const percent = Math.round((current / total) * 100);
                    console.log(`进度: ${percent}% (${current}/${total})`);
                }
            });
            const base64DataToWrite = hexToBase64(hexData);
            bleManager.writeCharacteristicWithResponseForDevice(deviceId,
                '0000FFF0-0000-1000-8000-00805F9B34FB',
                '0000FFF2-0000-1000-8000-00805F9B34FB', base64DataToWrite)

            /*  const base64DataToWrite = hexToBase64(hexData);
              const now = new Date();
              const hours = String(now.getHours()).padStart(2, '0');
              const minutes = String(now.getMinutes()).padStart(2, '0');
              const seconds = String(now.getSeconds()).padStart(2, '0');
              const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

              console.log(`时间：${hours}:${minutes}:${seconds}.${milliseconds}`);
              bleManager.writeCharacteristicWithResponseForDevice( deviceId,
                  '0000FFF0-0000-1000-8000-00805F9B34FB',
                  '0000FFF2-0000-1000-8000-00805F9B34FB',base64DataToWrite)*/
            /*  return
              // 先发送一个测试包
              console.log('发送测试包...');
              await writer.writeLargeData('AA 55 42 52 AA 45 55 AA', (current, total) => {
                  console.log(`进度: ${Math.round((current / total) * 100)}%`);
              });

              // 等待设备响应
              await writer.delay(50);

              // 发送完整数据
              console.log('发送完整数据...');
              await writer.writeLargeData(hexData, (current, total) => {
                  console.log(`进度: ${Math.round((current / total) * 100)}%`);
              });

              console.log('✅ 数据发送完成！');*/

        } catch (error) {
            console.error('❌ 发送失败:', error);
        }
    }


    async function setBLEMTU() {
        // 3. 协商MTU（关键步骤！）
        // 监听设备更新（可能包含MTU信息）
        bleManager.onStateChange((state) => {
            console.log(`BLE状态变化: ${state}`);
        }, true);
        setTimeout(async () => {
            const newMTU = await requestBLEMTU(deviceId, 64);
            console.log(`🎯 协商后MTU: ${JSON.stringify(newMTU)}`);
        }, 5000);

    }

    /**
     * 请求更大的MTU值
     */
    async function requestBLEMTU(deviceId: string, requestedMTU = 23) {
        console.log(`📡 请求MTU: ${requestedMTU}`);

        try {
            // 方法1: 使用requestMTUForDevice（推荐）
            const actualMTU = await bleManager.requestMTUForDevice(
                deviceId,
                requestedMTU
            );

            console.log(`✅ MTU协商成功: ${JSON.stringify(actualMTU)}`);
            return actualMTU;

        } catch (error) {
            console.warn(`⚠️ MTU协商失败: ${error.message}`);

        }
    }

    // 在组件内部使用useEffect监听蓝牙状态
    useEffect(() => {
        let isScanning = false;
        let hasPermission = false;
        let bluetoothPoweredOn = false;
        // 检查是否可以开始扫描的函数
        const checkAndStartScan = () => {
            if (hasPermission && bluetoothPoweredOn && !isScanning) {
                console.log('开始扫描设备...');
                startScan();
            } else {
                console.log('暂不扫描:', {hasPermission, bluetoothPoweredOn, isScanning});
            }
        };

        // 首先请求权限
        const requestPermissions = async () => {
            hasPermission = await requestAndroidPermissions();
            if (hasPermission) {
                console.log('权限已获取，可以开始使用蓝牙');
                checkAndStartScan(); // 权限获取后检查是否可以开始扫描
            } else {
                console.log('权限未获取，无法使用蓝牙功能');
                // 可以在这里添加重新请求权限的逻辑或提示用户
            }
        };

        // 开始扫描的函数
        const startScan = () => {
            if (!hasPermission || !bluetoothPoweredOn) {
                console.log('无法扫描：权限或蓝牙状态不满足条件', {hasPermission, bluetoothPoweredOn});
                return;
            }

            try {
                isScanning = true;
                bleManager.startDeviceScan(null, null, (error, scannedDevice) => {
                    if (error) {
                        console.error('扫描出错:', error);
                        cleanupScan();
                        return;
                    }

                    // 确保scannedDevice不为null或undefined
                    if (!scannedDevice) {
                        console.error('扫描到无效设备');
                        return;
                    }

                    // 检查设备名称或广播数据，筛选目标设备
                    // const deviceName = scannedDevice.name || '未知设备';
                    // const deviceId = scannedDevice.id || '未知ID';
                    // console.log('发现设备:', scannedDevice);

                    const targetIds = new Set([
                        '32:02:00:12:10:26',
                        '00:00:02:9F:63:01',
                        'B4:01:00:12:10:26',
                        'F7:37:16:33:5D:F8',
                        'F0:57:17:33:2F:F7'
                    ]);
                    if (!scannedDevice || !scannedDevice.name) {
                        // 可以在这里加一个简单的过滤，比如只看有名字的设备
                        return;
                    }


                    setDeviceMap(prevMap => {
                        // 必须创建新 Map 引用，否则 React 认为数据没变不更新
                        const newMap = new Map(prevMap);
                        newMap.set(scannedDevice.id, scannedDevice);
                        return newMap;
                    });

                });
            } catch (error) {
                console.error('启动扫描失败:', error);
                cleanupScan();
            }
        };

        // ---------------


        // 清理扫描的函数
        const cleanupScan = () => {
            if (isScanning) {
                isScanning = false;
                try {
                    bleManager.stopDeviceScan();
                    console.log('扫描已停止');
                } catch (error) {
                    console.error('停止扫描失败:', error);
                }
            }
        };

        // 初始化流程
        requestPermissions();

        // 监听蓝牙状态 (特别是iOS初始化)
        const subscription = bleManager.onStateChange((state) => {
            console.log('蓝牙状态变化:', state);
            bluetoothPoweredOn = (state === 'PoweredOn');

            if (state === 'PoweredOn') {
                console.log('蓝牙已开启，可以开始扫描');
                checkAndStartScan(); // 蓝牙开启后检查是否可以开始扫描
            } else {
                console.log('蓝牙未开启，当前状态:', state);
                // 如果蓝牙关闭，停止扫描
                cleanupScan();
            }
        }, true); // 第二个参数为true表示立即触发当前状态的回调

        return () => {
            subscription.remove(); // 组件卸载时移除监听
            cleanupScan(); // 组件卸载时停止扫描
        };
    }, []);

    useEffect(() => {
        console.log('UI已更新，当前设备列表:', devicesList);
    }, [devicesList]);
    // 处理点击事件的函数
    const onClick = (wifiItem) => {
        console.log('完整信息:', wifiItem);
        // 演示：弹窗显示信息
        Alert.alert(
            '蓝牙 '+(wifiItem.name||'未知设备'),
            `你要连接到 "${wifiItem.id}" 吗?\n信号强度: ${wifiItem.rssi} dBm`,
            [
                {text: '取消', style: 'cancel'},
                {
                    text: '连接',
                    onPress: () => {
                        console.log('连接')
                        connectToDeviceTo(wifiItem)
                    }
                }
            ]
        );
    };

    const getSignalColor = (level) => {
        // if (level > -50) return '#4CAF50'; // Green (Excellent)
        // if (level > -70) return '#FF9800'; // Orange (Good)
        return '#F44336';                  // Red (Weak)
    };

    const renderItem = ({item, index}) => (
        <TouchableOpacity style={styles.itemContainer}
                          onPress={() => onClick(item)} // 3. 传入当前 item
                          activeOpacity={0.6} // 点击时的透明度效果
        >
            <View style={styles.leftColumn}>
                <View style={styles.ssidRow}>
                    <Text style={styles.index}>{index + 1}.</Text>
                    <Text style={styles.name}>{item.name || '未知设备'}</Text>

                </View>
                <Text style={styles.id}>MAC: {item.id}</Text>
            </View>

            <View style={styles.rightColumn}>
                <Text style={[styles.signalLevel, {color: getSignalColor(item.level)}]}>
                    {item.rssi} dBm
                </Text>
            </View>
            <View style={styles.rightColumn}>
                <Text style={styles.frequency}>{item.manufacturerData}</Text>
            </View>
        </TouchableOpacity>
    );

    return (<>

        <View style={styles.screen}>

            {/*<View style={styles.button}>
                <Button
                    onPress={() => onPressLearnMore('AA554257A1014A55AA')}
                    title="开机"
                />
            </View>
            <View style={styles.button}>
                <Button
                    onPress={() => onPressLearnMore('AA 55 42 57 A1 00 4B 55 AA')}
                    title="关机"
                />
            </View>
            <View style={styles.button}>
                <Button
                    onPress={() => onPressLearnMore('AA 55 42 57 A8 01 00 08 00 07 68 07 68 7F 01 00 08 00 07 68 07 68 00 01 00 08 00 07 68 07 68 00 01 00 08 00 07 68 07 68 00 01 00 08 00 07 68 07 68 00 34 55 AA')}
                    title="写工作参数"
                />
            </View>
            <View style={styles.button}>
                <Button
                    onPress={() => onPressLearnMore('AA 55 42 52 A1 4E 55 AA')}
                    title="开关机状态"
                />
            </View>*/}

            <View style={styles.listContainer}>

                <FlatList
                    data={devicesList}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{padding: 16, paddingBottom: 100}} // 底部留白防止被遮挡

                    // 添加这个属性：当列表为空时显示
                    ListEmptyComponent={
                        <View style={{marginTop: 50, alignItems: 'center'}}>
                            <Text style={{color: '#999'}}>
                                {devicesList.length === 0 ? "正在扫描设备..." : "暂无数据"}
                            </Text>
                            <Text>当前列表长度: {devicesList.length}</Text>
                        </View>
                    }
                />
            </View>
            {/*<View style={styles.button}>
                <Button
                    onPress={() => onPressLearnMore()}
                    title="读取参数"
                />
            </View>
            <View style={styles.button}>
                <Button
                    onPress={() => onPressWrite()}
                    title="写工作参数"
                />
            </View>
            <View style={styles.button}>
                <Button
                    onPress={() => setBLEMTU()}
                    title="协商后MTU"
                />
            </View>*/}
        </View>

    </>);
    // 这个组件可以返回null，因为它主要用于蓝牙功能的初始化
    // return null;
}

const styles = StyleSheet.create({
    // 1. 最外层容器：必须撑开整个屏幕
    screen: {
        flex: 1,  // <--- 关键！加上这个，让 screen 占满屏幕高度
        marginTop: 40,
        marginBottom: 40,
    },
    listContainer: {
        flex: 1,
        padding: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'red',
        marginBottom: 10,
    },
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
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
        justifyContent: 'space-between',
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


// 将十六进制字符串转换为 Base64 字符串
function hexToBase64(hexString: string) {
    // 移除可能存在的空格
    hexString = hexString.replace(/\s/g, '');
    // 确保是偶数长度
    if (hexString.length % 2 !== 0) {
        throw new Error('Invalid hex string.');
    }
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
        bytes.push(parseInt(hexString.substr(i, 2), 16));
    }
    const byteArray = new Uint8Array(bytes);
    // 对于 React Native 环境，可能需要使用 btoa 或 Buffer 的 polyfill
    // 这里使用 btoa，注意长字符串处理
    // @ts-ignore
    const binaryString = String.fromCharCode.apply(null, byteArray);
    return btoa(binaryString);
}

function base64ToHex(base64: string) {
    // 1. 将Base64字符串解码为二进制字符串
    const binaryString = atob(base64);

    // 2. 将每个字符的字符码转为十六进制
    let hex = '';
    for (let i = 0; i < binaryString.length; i++) {
        const byte = binaryString.charCodeAt(i);
        // 确保是两位十六进制，不足则补0
        hex += byte.toString(16).padStart(2, '0');
    }

    // 3. 返回十六进制字符串（可选项：转换为大写，每两个字符加空格）
    return hex.toUpperCase(); // 结果: "123456"
    // 或者 return hex.toUpperCase().replace(/(.{2})/g, '$1 ').trim(); // 结果: "12 34 56"
}
