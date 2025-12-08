import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { bleManager } from '../hooks/use-ble-manager';

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
        console.log('暂不扫描:', { hasPermission, bluetoothPoweredOn, isScanning });
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
        console.log('无法扫描：权限或蓝牙状态不满足条件', { hasPermission, bluetoothPoweredOn });
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
          
          if (scannedDevice.name?.includes('Your-Device-Name')) {
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
        console.log('正在连接设备:', device.name || device.id);
        const connectedDevice = await bleManager.connectToDevice(device.id);
        console.log('设备连接成功:', connectedDevice.name || connectedDevice.id);
        
        // 可以在这里进行进一步操作，如发现服务/特征等
        // await connectedDevice.discoverAllServicesAndCharacteristics();
      } catch (error) {
        console.error('连接设备失败:', error);
      }
    };

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

  // 这个组件可以返回null，因为它主要用于蓝牙功能的初始化
  return null;
}