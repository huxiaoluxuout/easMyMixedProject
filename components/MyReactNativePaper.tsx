import React, {JSX, useEffect, useState} from 'react';

import {View, Button, StyleSheet, Image} from 'react-native';
import {
    PaperProvider, Button as PaperButton,
    Card, Paragraph, Title, Badge,
    Banner, Checkbox, Divider,
    HelperText, TextInput,
    Icon, MD3Colors, Menu,
    IconButton, Tooltip,
    TouchableRipple,
    Text
} from 'react-native-paper';

const MyReactNativePaper =  (): React.ReactNode  => {

    const [visible, setVisible] = useState(true);

    const [text, setText] = useState('');

    const onChangeText = (value) => setText(value);

    const hasErrors = () => {
        return !text.includes('@');
    };


    const openMenu = () => setVisible(true);

    const closeMenu = () => setVisible(false);


    return <View style={styles.screen}>

        <TouchableRipple style={styles.screen}
                         borderless={true}
                         onPress={() =>{}}
                         rippleColor="rgba(0, 0, 0, .32)">
            <Text>Press anywhere</Text>
        </TouchableRipple>
        {/*   <Card>
                    <Card.Content>
                        <Title>欢迎使用 React Native Paper</Title>
                        <Paragraph>这是一个基于 Material Design 的 UI 库。</Paragraph>
                    </Card.Content>
                    <Card.Actions>
                        <PaperButton
                            buttonColor={'red'} textColor={'white'} mode={'contained'}
                            rippleColor={'blue'} disabled={ true}
                            onPress={() => console.log('点击了')}>确认</PaperButton>
                    </Card.Actions>
                </Card>*/}
        {/*<Badge size={20}>3</Badge>*/}
        {/*<Divider bold={true} horizontalInset={true}  />
                <Banner
                    visible={visible}
                    actions={[
                        {
                            label: 'Fix it',
                            onPress: () => setVisible(false),
                        },
                        {
                            label: 'Learn more',
                            onPress: () => setVisible(false),
                        },
                    ]}
                    icon={({size}) => (
                        <Image
                            source={{
                                uri: 'https://avatars3.githubusercontent.com/u/17571969?s=400&v=4',
                            }}
                            style={{
                                width: size,
                                height: size,
                            }}
                        />
                    )}>
                    There was a problem processing a transaction on your credit card.
                </Banner>
                <Checkbox.Item label="xItem" status="checked" position="trailing" hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}/>
                <Divider bold={false} horizontalInset={true}  />*/}
        {/* <TextInput label="Email" value={text} onChangeText={onChangeText} />
                <HelperText type="error" visible={hasErrors()}>
                    Email address is invalid!
                </HelperText>
                <Divider bold={false} horizontalInset={true}  />*/}

       {/* <Icon
            source="camera"
            color={MD3Colors.error20}
            size={20}
        />
        <View
            style={{
                paddingTop: 50,
                flexDirection: 'row',
                justifyContent: 'center',
            }}>
            <Menu
                visible={visible}
                mode='flat'
                onDismiss={closeMenu}
                anchor={<Button onPress={() => openMenu()} title='Show menu'></Button>}>
                <Menu.Item onPress={() => {
                }} title="Item 1"/>
                <Menu.Item onPress={() => {
                }} title="Item 2"/>
                <Divider/>
                <Menu.Item onPress={() => {
                }} title="Item 3"/>
            </Menu>
        </View>
        <Tooltip title="Selected Camera">
            <IconButton icon="camera" selected size={24} onPress={() => {}}/>
        </Tooltip>
*/}
    </View>
};

export default MyReactNativePaper;

const styles = StyleSheet.create({
    screen: {
        marginTop: 40,
        marginBottom: 40,
        flex: 1,
        // backgroundColor:'red'

    },
    button_: {
        marginTop: 20,
        marginBottom: 20,
    },
    text: {
        fontSize: 20,
        color: 'red',
        textAlign: 'center',
        padding: 30,
    }
});
