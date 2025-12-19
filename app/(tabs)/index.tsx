import {Alert, Button, StyleSheet, Text, View} from 'react-native';
import MyWifi from "@/components/MyWiFi";

import MyBle from "@/components/MyBle";
import MyImage from "@/components/MyImage";
import VisionCamera from "@/components/VisionCamera";


export default function HomeScreen() {

  return (
      // <VisionCamera></VisionCamera>

      <View style={styles.title_box}>
        <Text style={styles.title}>App</Text>

         {/*<MyImage></MyImage>*/}

        <MyBle></MyBle>
        {/*<MyWifi></MyWifi>*/}


      </View>
  );
}

const styles = StyleSheet.create({
  title_box:{
    marginTop: 40,
    paddingHorizontal: 40,
  },
  title:{
    fontSize: 16,
    color:'red',
    fontWeight:'bold',
    marginBottom:20
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    color:'red'
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
