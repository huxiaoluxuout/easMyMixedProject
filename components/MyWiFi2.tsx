import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import WifiManager from 'react-native-wifi-reborn';

const WiFiManager = () => {
    const [wifiList, setWifiList] = useState([]);
    const [connectedWifi, setConnectedWifi] = useState('');
    const [loading, setLoading] = useState(false);

    // 检查并请求权限
    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                ]);

                if (
                    granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
                    granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
                ) {
                    console.log('权限已获取');
                    return true;
                } else {
                    Alert.alert('权限被拒绝', '需要位置权限来扫描WiFi');
                    return false;
                }
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    // 获取当前连接的WiFi
    const getConnectedWifi = async () => {
        try {
            const ssid = await WifiManager.getCurrentWifiSSID();
            setConnectedWifi(ssid);
        } catch (error) {
            console.log('未连接WiFi或获取失败');
        }
    };

    // 扫描WiFi网络
    const scanNetworks = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        setLoading(true);
        try {
            const networks = await WifiManager.loadWifiList();
            // @ts-ignore
            setWifiList(networks);
        } catch (error) {
            // @ts-ignore
            Alert.alert('扫描失败', error.message);
        } finally {
            setLoading(false);
        }
    };

    // 连接WiFi
    const connectToNetwork = (ssid) => {
        Alert.prompt(
            '连接WiFi',
            `输入密码以连接: ${ssid}`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '连接',
                    onPress: async (password) => {
                        try {
                            if (Platform.OS === 'android') {
                                await WifiManager.connectToProtectedSSID(ssid, password, false);
                            } else {
                                await WifiManager.connectToSSID(ssid, password);
                            }
                            Alert.alert('成功', '连接请求已发送');
                            setTimeout(getConnectedWifi, 3000);
                        } catch (error) {
                            Alert.alert('连接失败', error.message);
                        }
                    },
                },
            ],
            'secure-text'
        );
    };

    // 渲染WiFi项目
    const renderWifiItem = ({ item }) => (
        <TouchableOpacity
            style={styles.wifiItem}
            onPress={() => connectToNetwork(item.SSID)}
            disabled={item.SSID === connectedWifi}
        >
            <View style={styles.wifiInfo}>
                <Text style={styles.ssid}>{item.SSID || '隐藏网络'}</Text>
                <Text style={styles.details}>
                    BSSID: {item.BSSID} | 信号: {item.level}dBm
                </Text>
            </View>
            <Text style={[styles.status, item.SSID === connectedWifi && styles.connected]}>
                {item.SSID === connectedWifi ? '已连接' : '点击连接'}
            </Text>
        </TouchableOpacity>
    );

    useEffect(() => {
        getConnectedWifi();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>WiFi 管理器</Text>
                <Text style={styles.subtitle}>
                    当前连接: {connectedWifi || '未连接'}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.scanButton}
                onPress={scanNetworks}
                disabled={loading}
            >
                <Text style={styles.scanButtonText}>
                    {loading ? '扫描中...' : '扫描WiFi网络'}
                </Text>
            </TouchableOpacity>
            <FlatList
                data={wifiList}
                renderItem={renderWifiItem}
                keyExtractor={(item, index) => index.toString()}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        点击上方按钮扫描WiFi网络
                    </Text>
                }
                style={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, backgroundColor: '#fff', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
    scanButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        margin: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    scanButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    list: { flex: 1, marginHorizontal: 20 },
    wifiItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    wifiInfo: { flex: 1 },
    ssid: { fontSize: 16, fontWeight: '500' },
    details: { fontSize: 12, color: '#999', marginTop: 5 },
    status: { color: '#007AFF', fontSize: 14 },
    connected: { color: '#34C759' },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 50 },
});

export default WiFiManager;
