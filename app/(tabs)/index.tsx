import {  StyleSheet, Text, View } from 'react-native';
import MyImage from "@/components/MyImage";
export default function HomeScreen() {
  return (
      <View>
        <Text>App</Text>
        <MyImage></MyImage>
        <Text>App</Text>
      </View>
  );
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
});
