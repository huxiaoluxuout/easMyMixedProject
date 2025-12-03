import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

function VisionCamera() {
  // 1. 相机设备状态管理
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  
  // 获取前后摄像头设备
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  
  // 根据当前选择的位置获取设备
  const device = cameraPosition === 'back' ? backDevice : frontDevice;
  
  // 2. 获取权限状态
  const { hasPermission, requestPermission } = useCameraPermission();
  // 媒体库权限状态
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<MediaLibrary.PermissionStatus | null>(null);

  useEffect(() => {
    // 请求媒体库权限
    (async () => {
      try {
        const permission = await MediaLibrary.requestPermissionsAsync();
        setMediaLibraryPermission(permission.status);
        
        if (permission.status !== 'granted') {
          console.log('媒体库权限被拒绝');
        }
      } catch (error) {
        console.error('请求媒体库权限失败:', error);
        Alert.alert('权限请求失败', '无法请求媒体库权限，请手动在设置中开启');
      }
    })();
  }, []);
  
  const camera = useRef<Camera>(null);
  
  // 用于存储拍摄的照片路径
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  // 图片加载状态
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    // 检查并请求权限
    if (!hasPermission) {
      (async () => {
        try {
          const result = await requestPermission();
          console.log('相机权限请求结果:', result);
        } catch (error) {
          console.error('请求相机权限失败:', error);
          Alert.alert('权限请求失败', '无法请求相机权限，请手动在设置中开启');
        }
      })();
    }
  }, [hasPermission, requestPermission]);

  // 渲染权限请求界面
  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>需要相机权限才能使用相机功能</Text>
        <Button title="重新请求权限" onPress={() => requestPermission()} />
      </View>
    );
  }
  
  // 渲染设备未找到界面
  if (device == null) {
    return (
      <View style={styles.deviceNotFoundContainer}>
        <Text style={styles.deviceNotFoundText}>未找到相机设备</Text>
        <Text style={styles.deviceNotFoundSubText}>请确保设备有可用相机</Text>
        <Button 
          title="重试" 
          onPress={() => {
            // 切换摄像头位置来触发重新获取设备
            setCameraPosition(prev => prev === 'back' ? 'front' : 'back');
          }} 
        />
      </View>
    );
  }

  // 3. 拍照功能
  const takePhoto = async () => {
    if (camera.current) {
      try {
        // 检查设备是否支持闪光灯
        const flashMode = device?.hasFlash ? 'on' : 'off';
        
        const photo = await camera.current.takePhoto({
          flash: flashMode
        });
        console.log('照片路径:', photo.path);
        
        // 优化照片路径处理，确保跨设备兼容性
        let photoUri;
        if (Platform.OS === 'android') {
          // Android 上确保使用正确的文件 URI
          photoUri = `file://${photo.path}`;
        } else {
          // iOS 上直接使用 path
          photoUri = photo.path;
        }
        
        setCapturedPhoto(photoUri);
        setImageError(null);
      } catch (error) {
        console.error('拍照失败:', error);
        Alert.alert('拍照失败', `无法拍摄照片: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };
  
  // 4. 切换摄像头功能
  const toggleCamera = () => {
    setCameraPosition(prevPosition => prevPosition === 'back' ? 'front' : 'back');
  };
  
  // 4. 关闭预览，返回相机界面
  const closePreview = () => {
    setCapturedPhoto(null);
    setImageError(null);
  };

  // 5. 保存照片到相册
  const savePhoto = async () => {
    if (!capturedPhoto) return;

    try {
      // 检查媒体库权限
      if (mediaLibraryPermission !== 'granted') {
        const permission = await MediaLibrary.requestPermissionsAsync();
        setMediaLibraryPermission(permission.status);
        
        if (permission.status !== 'granted') {
          Alert.alert('权限不足', '需要媒体库权限才能保存照片\n请在设置中开启权限后重试');
          return;
        }
      }

      // 保存照片到相册
      const asset = await MediaLibrary.createAssetAsync(capturedPhoto);
      console.log('照片已保存到相册:', asset);
      
      try {
        // 创建相册并添加照片（可选）
        await MediaLibrary.createAlbumAsync('MyEASMixedProject', asset, false);
        Alert.alert('保存成功', '照片已保存到相册\n相册名: MyEASMixedProject');
      } catch (albumError) {
        // 如果创建相册失败，仍然提示保存成功
        console.error('创建相册失败:', albumError);
        Alert.alert('保存成功', '照片已保存到默认相册');
      }
    } catch (error) {
      console.error('保存照片失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('保存失败', `无法将照片保存到相册:\n${errorMessage}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* 相机视图 */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!capturedPhoto} // 拍照后暂停相机
        photo={true}    // 开启拍照功能
      />
      
      {/* 拍照按钮和切换摄像头按钮 */}
      {!capturedPhoto && (
        <View style={styles.buttonContainer}>
          <Button title="切换摄像头" onPress={toggleCamera} />
          <View style={styles.buttonSpacing} />
          <Button title="拍照" onPress={takePhoto} />
        </View>
      )}
      
      {/* 照片预览 */}
      {capturedPhoto && (
        <View style={styles.previewContainer}>
          {/* 图片加载指示器 */}
          {imageLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingText}>加载图片中...</Text>
            </View>
          )}
          
          {/* 图片错误提示 */}
          {imageError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>图片加载失败: {imageError}</Text>
            </View>
          )}
          
          {/* 预览图片 */}
          <Image 
            source={{ uri: capturedPhoto }} 
            style={styles.previewImage} 
            resizeMode="contain"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={(error) => {
              setImageLoading(false);
              setImageError(error.nativeEvent.error);
              console.error('图片加载错误:', error.nativeEvent.error);
            }}
          />
          
          <View style={styles.previewButtons}>
            <Button title="重新拍摄" onPress={closePreview} />
            <View style={styles.buttonSpacing} />
            <Button title="保存" onPress={savePhoto} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  deviceNotFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deviceNotFoundText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deviceNotFoundSubText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
  previewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
    backgroundColor: 'transparent',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    padding: 20,
  },
  buttonSpacing: {
    width: 20,
    marginVertical: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default VisionCamera;