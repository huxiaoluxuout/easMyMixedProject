import React, {useState,useEffect} from 'react';
import {Button, View, StyleSheet,Text} from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import {log} from "@/hooks/logger";


const LOCATION_TASK_NAME = 'background-location-task';


const requestPermissions = async () => {
    const {status: foregroundStatus} = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus === 'granted') {
        const {status: backgroundStatus} = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus === 'granted') {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.Balanced,
            });
        }
    }
};

// 定义单个位置信息的类型（与之前相同）
type Coordinates = {
    accuracy: number;
    altitude: number;
    altitudeAccuracy: number;
    heading: number;
    latitude: number;
    longitude: number;
    speed: number;
};

type LocationInfo = {
    coords: Coordinates;
    mocked: boolean;
    timestamp: number; // 时间戳，通常为毫秒数
};

// 定义一个位置信息数组的类型
type LocationArray = LocationInfo[];

// 或者，直接在定义数组时使用
type MyComponentProps = {
    locations: LocationInfo[]; // 这里 'locations' 是一个 LocationInfo 对象的数组
};

// --- 使用示例 ---

// 1. 声明一个数组变量
const myLocationHistory: LocationInfo[] = [
    {
        coords: {
            accuracy: 100,
            altitude: 29.100000381469727,
            altitudeAccuracy: 100,
            heading: 0,
            latitude: 31.7743732,
            longitude: 117.225014,
            speed: 0,
        },
        mocked: false,
        timestamp: 1767855819240,
    },

    {
        coords: {
            accuracy: 50,
            altitude: 30.5,
            altitudeAccuracy: 80,
            heading: 90,
            latitude: 32.0,
            longitude: 118.0,
            speed: 2.5,
        },
        mocked: true,
        timestamp: 1767855920000,
    },
];
const MyExpoTaskManager = () => {
    /*  const {locations,setLocations}= useState<LocationInfo[]>()

      reuture (<View style={styles.container}>
          <Button onPress={requestPermissions} title="Enable background location" />
          {locations.map((location, index) => (
              <div key={location.timestamp || index}> {/!* 使用 timestamp 作为 key 更好，但需要确保其唯一性 *!/}
                  <p>Latitude: {location.coords.latitude}</p>
                  <p>Longitude: {location.coords.longitude}</p>
                  <p>Timestamp: {new Date(location.timestamp).toISOString()}</p>
                  <p>Mocked: {location.mocked ? 'Yes' : 'No'}</p>
                  <hr />
              </div>
          ))}
      </View>)*/
     // const [locations, setLocations] = useState<LocationInfo[]>(myLocationHistory);
     // const [num, setNum] = useState(1);
     // let cont = 1;
    // setNum(prevState =>  prevState + 1);
    // cont++
    // log.error('num',num)
    // log.warn('cont',cont)

    return (
        <View style={styles.container}>
            <Button onPress={requestPermissions} title="Enable background location"/>
            {/*<Text>{num}</Text>*/}
        </View>
    )
}

TaskManager.defineTask(LOCATION_TASK_NAME, ({data, error}) => {
    if (error) {
        // Error occurred - check `error.message` for more details.
        console.log('error',error);

        return;
    }
    if (data) {
        const {locations} = data;
        console.log('locations',locations);
        // do something with the locations captured in the background
    }
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default MyExpoTaskManager;
