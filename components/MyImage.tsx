import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

const blurhash =
    '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

 function MyImage() {
  return (
      <View style={styles.container}>
        <Image
            style={styles.image}
            source="https://api-hmugo-web.itheima.net/pyg/banner1.png"
            placeholder={{ blurhash }}
            contentFit="cover"
            transition={1000}
        />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    // flex: 1,
    height:400,
    width: '100%',
    backgroundColor: '#0553',
  },
});
export default MyImage
