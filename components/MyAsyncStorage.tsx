import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    Button,
    Alert,
    PermissionsAndroid,
    Platform, StyleSheet, FlatList, Pressable,
    ScrollView
} from 'react-native';


import AsyncStorage from '@react-native-async-storage/async-storage';
import {ylxBleOTA} from "@/hooks/useOTA";

const HEX_FILE_URL = 'https://www.cssmlj.com/Myofit6/ota/LT5009_Main_ADD1_GR5513.hex';
const CACHE_KEY = 'hex_file_content_LT5009'; // 唯一标识缓存


const CACHE_FILE_KEY = 'filename';
const CACHE_NextFILE_KEY = 'nextFilename';
const HEX_BASE_FILE_URL = 'https://www.cssmlj.com/Myofit6';
const resData = {
    "version": "1.1.4",
    "filename": "/ota/LT5009_Main_ADD1_GR5513.hex",
    "nextFilename": "/ota/LT5009_Main_ADD2_GR5513.hex",
    "filenameTotalChecksum": "00000000 00AA666E",
    "nextFilenameTotalChecksum": "00000000 00AA6E6A",
    "video1": "/video/Myofit6_Usage_instructions.mp4",
    "video2": "/video/test2.mp4",
    "video3": "/video/test3.mp4"
}

const MyAsyncStorage = () => {

    useEffect(() => {
        // loadHexContent();
    }, []);


    const [content, setContent] = useState('');

    const loadHexContent = async () => {
        try {
            // 1. 先尝试从缓存读取
            const cached1 = await AsyncStorage.getItem(CACHE_FILE_KEY);
            if (cached1 !== null) {
                console.log('Loaded from cache');
                // setContent(cached);
                // 后台静默更新（可选）
                fetchAndCacheNewVersion();
                return;
            }

            // 2. 缓存不存在，从网络加载
            console.log('Loading from network...');
            await fetchAndCacheNewVersion();
        } catch (error) {
            console.error('Error loading hex content:', error);
            setContent('Failed to load HEX file.');
        }
    };

    const fetchAndCacheNewVersion = async () => {
        try {

            let firstUrl = HEX_BASE_FILE_URL + resData[CACHE_FILE_KEY]
            let secondUrl = HEX_BASE_FILE_URL + resData[CACHE_NextFILE_KEY]
            console.log('firstUrl', firstUrl)
            console.log('secondUrl', secondUrl)

            const response1 = await fetch(firstUrl);
            const response2 = await fetch(secondUrl);
            if (!response1.ok) throw new Error(`HTTP ${response1.status}`);
            const text1 = await response1.text();
            const text2 = await response2.text();

            // 保存到缓存
            await AsyncStorage.setItem(CACHE_FILE_KEY, text1);
            await AsyncStorage.setItem(CACHE_NextFILE_KEY, text2);
            // setContent(text1);

            ylxBleOTA.initHexText(text1, (data: { totalChecksum: number[], startAddress: number, totalBty16Packets: number }) => {
                let totalChecksum = resData['filenameTotalChecksum']
                let resTotalChecksum = totalChecksum.slice(-4).toUpperCase()
                let totalChecksumHex = data.totalChecksum[0].toString(16).toUpperCase() + data.totalChecksum[1].toString(16).toUpperCase()
                AsyncStorage.setItem('updatedHexContent', text1)
                console.log('1-1 resTotalChecksum', resTotalChecksum)
                console.log('1-1 totalChecksumHex', totalChecksumHex)

                ylxBleOTA.initHexText(text2, (data: { totalChecksum: number[], startAddress: number, totalBty16Packets: number }) => {
                    let totalChecksum = resData['nextFilenameTotalChecksum']
                    let resTotalChecksum = totalChecksum.slice(-4).toUpperCase()
                    let totalChecksumHex = data.totalChecksum[0].toString(16).toUpperCase() + data.totalChecksum[1].toString(16).toUpperCase()
                    AsyncStorage.setItem('nextUpdatedHexContent', text2)
                    console.log('2-2 totalChecksumHex', totalChecksumHex)
                    console.log('2-1 resTotalChecksum', resTotalChecksum)

                   /* function startOTA(deviceId, hexContent) {
                        if (!updatedId) return
                        ylxBleOTA.startOTA(
                            {
                                deviceId,
                                serviceId,
                                writeCharId: command('3C')
                            },
                            hexContent,
                            (data) => {
                                startAddress.value = data.startAddress
                                totalChecksum.value = data.totalChecksum[0].toString(16) + ' ' + data.totalChecksum[1].toString(16)
                                totalProgress.value = data.totalBty16Packets
                                timestamp.value = Date.now()
                                setTimeout(() => {
                                    startTheUpgrade()
                                }, 0)

                            }
                        )
                    }*/
                })

            })
        } catch (error) {
            console.error('Network fetch failed:', error);
            // 如果缓存也没有，才显示错误
            if (content === '') {
                setContent('Network error and no cached version available.');
            }
        } finally {
        }
    };

    return (

        <View style={styles.screen}>

            <View style={styles.button_}>
                <Button
                    title="请求网络"
                    onPress={() => loadHexContent()}
                />
            </View>

            <ScrollView style={styles.container}>
                <Text selectable style={styles.text}>{content}</Text>
            </ScrollView>
        </View>
    )

};

export default MyAsyncStorage;

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
    container: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 50,
    },
    text: {
        fontSize: 12,
        fontFamily: 'monospace', // 更适合显示 hex 内容
        lineHeight: 18,
        color: '#000',
    },
});
