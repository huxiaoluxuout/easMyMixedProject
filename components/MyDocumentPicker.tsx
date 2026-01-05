import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    Button,
    Alert,
    PermissionsAndroid,
    Platform, StyleSheet, FlatList, Pressable,
} from 'react-native';
import {pick, types} from '@react-native-documents/picker'

const MyDocumentPicker = () => {
    async function permissions() {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission denied');
                return;
            }
        }
    }

    useEffect(() => {

    }, []);


    const [dataList, setDataList] = useState([]);
    const [num, setNum] = useState(1);

    // 定义 Item 组件的 Props 类型
    interface ItemProps {
        name: string
        nativeType: string
        uri: string
        size: number
        id: number | string
    }

    const Item: React.FC<ItemProps> = ({name, nativeType, uri, size}) => {
        // const {name, nativeType, uri, size} = items
        const handlePress = () => {
            // console.log('按下', {name, nativeType, uri, size});
        };

        return (
            <Pressable
                onPress={handlePress}
            >
                {({pressed}) => (
                    <View style={styles.item}>
                        <Text style={styles.title}>:{name}</Text>
                        <Text style={styles.title}>:{nativeType}</Text>
                        {/*<Text style={styles.title}>uri:{uri}</Text>*/}
                        <Text style={styles.title}>size:{size}</Text>
                    </View>
                )}
            </Pressable>
        );
    };


    return (

        <View style={styles.screen}>
            <View style={styles.button_}>
                <Button
                    title="open file"
                    onPress={async () => {
                        console.log('=== Starting pick ===', num);
                        setNum(num + 1)
                        try {
                            // await new Promise(resolve => setTimeout(resolve, 1000));
                            const [result] = await pick({
                                mode: 'import',
                                type: [types.pdf, types.docx],
                            })

                            console.log(dataList.length, 'result', result.name)
                            // console.log('result2:',{...result, id: Math.random()})
                            // @ts-ignore
                            // setDataList([{...result, id: Math.random()}])
                            setDataList(prev => [...prev, {...result, id: Math.random()}]);
                        } catch (err) {
                            // see error handling
                            console.log('err', err)
                        }
                    }}
                />
            </View>
            <View style={styles.listContainer}>
                <Text style={styles.title}>Total Items: {dataList.length}</Text>
                <FlatList
                    data={dataList}
                    renderItem={({item}) => <Item {...item}/>}
                    keyExtractor={item => item?.id.toString()}
                />
            </View>

        </View>
    )

};

export default MyDocumentPicker;

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
