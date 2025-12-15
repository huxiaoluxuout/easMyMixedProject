import {useEffect,useState} from 'react';
import {PermissionsAndroid, Platform, View, Button, StyleSheet} from 'react-native';
import {Characteristic, Device} from 'react-native-ble-plx';
import {bleManager} from '../hooks/use-ble-manager';

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

    const [deviceId,setDeviceId] = useState('')

    function onPressLearnMore(hexData: string ) {
        console.log('deviceId',deviceId)
        // const hexData = 'AA554257A1014A55AA';
        const base64DataToWrite = hexToBase64(hexData);
        console.log('Base64数据:', base64DataToWrite); // 输出应为：qlVCV6EBSpWq
        bleManager.writeCharacteristicWithResponseForDevice(
            deviceId,
            '0000FFF0-0000-1000-8000-00805F9B34FB',
            '0000FFF2-0000-1000-8000-00805F9B34FB',
            base64DataToWrite // 传入Base64字符串
        )

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
                    const deviceName = scannedDevice.name || '未知设备';
                    const deviceId = scannedDevice.id || '未知ID';
                    console.log('发现设备:', deviceName, deviceId);

                    // if (scannedDevice.name?.includes('LT5009NEW')) {
                    if (scannedDevice.name?.includes('Scent_d60000')) {
                        console.log('找到目标设备:', deviceName, deviceId);
                        cleanupScan();
                        // 在这里可以触发连接设备的函数
                        connectToDevice(scannedDevice);
                    }
                });
            } catch (error) {
                console.error('启动扫描失败:', error);
                cleanupScan();
            }
        };

        // 连接设备的函数
        const connectToDevice = async (device: Device) => {
            try {

                console.log('正在连接设备:', device.name, device.id);
                const connectedDevice = await bleManager.connectToDevice(device.id);
                console.log('设备连接成功:', connectedDevice.name, connectedDevice.id);
                setDeviceId(device.id);
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
                                    console.log('收到通知:', char)
                                    // @ts-ignore
                                    console.log('十六进制:', base64ToHex(char.value))
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


    return (<>

        <View style={styles.button}>

            <View style={styles.button}>
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
            </View> <View style={styles.button}>
                <Button
                    onPress={() => onPressLearnMore('AA 55 42 57 A8 01 00 08 00 07 68 07 68 7F 01 00 08 00 07 68 07 68 00 01 00 08 00 07 68 07 68 00 01 00 08 00 07 68 07 68 00 01 00 08 00 07 68 07 68 00 34 55 AA')}
                    title="写工作参数"
                />
            </View>

        </View>

    </>);
    // 这个组件可以返回null，因为它主要用于蓝牙功能的初始化

    // return null;
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
    button: {
        marginTop: 40,
        marginBottom: 40,
    }
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

// 你的数据（去掉空格）
/*const hexData = 'AA554257A1014A55AA';
const base64DataToWrite = hexToBase64(hexData);
console.log('Base64数据:', base64DataToWrite); // 输出应为：qlVCV6EBSpWq*/


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

// 使用示例
const base64Str = 'EjRW';
const hexResult = base64ToHex(base64Str);
console.log('使用示例', hexResult); // 输出: 123456
