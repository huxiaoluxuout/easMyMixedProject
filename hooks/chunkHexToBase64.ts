import {bleManager} from "@/hooks/use-ble-manager";


const MAX_PACKET_SIZE = 20; // BLE单包最大字节数

/**
 * 将大段十六进制数据分包为多个Base64包
 * @param {string} hexString - 原始十六进制字符串（可带空格）
 * @param {number} chunkSize - 每个包的字节数，默认20
 * @param {boolean} addChecksum - 是否添加校验和（低8位和校验）
 * @returns {string[]} Base64编码的数据包数组
 */
export function chunkHexToBase64(hexString: string, chunkSize: number = MAX_PACKET_SIZE, addChecksum: boolean = false): string[] {
    // 清理输入：移除所有空格和换行
    const cleanHex = hexString.replace(/\s+/g, '');

    // 验证十六进制格式
    if (!/^[0-9A-Fa-f]+$/.test(cleanHex)) {
        throw new Error('输入包含非十六进制字符');
    }
    if (cleanHex.length % 2 !== 0) {
        throw new Error('十六进制字符串长度应为偶数');
    }

    // 计算总字节数
    const totalBytes = cleanHex.length / 2;
    console.log(`原始数据: ${totalBytes} 字节`);

    // 分割成多个数据块
    const chunks = [];
    for (let i = 0; i < cleanHex.length; i += chunkSize * 2) {
        const chunkHex = cleanHex.slice(i, i + chunkSize * 2);

        // 可选：添加校验和
        let finalChunkHex = chunkHex;
        if (addChecksum) {
            finalChunkHex = addChecksumToHex(chunkHex);
        }

        // 转换为Base64
        const base64Chunk = hexToBase64(finalChunkHex);
        chunks.push(base64Chunk);

        console.log(`分包 ${chunks.length}: ${chunkHex.length/2}字节 -> Base64: ${base64Chunk}`);
    }

    console.log(`总计: ${chunks.length} 个包`);
    return chunks;
}

/**
 * 添加低8位和校验
 * @param {string} hexString - 十六进制字符串
 * @returns {string} 添加校验和后的十六进制字符串
 */
function addChecksumToHex(hexString: string): string {
    const bytes = [];
    let checksum = 0;

    // 解析十六进制为字节数组
    for (let i = 0; i < hexString.length; i += 2) {
        const byte = parseInt(hexString.slice(i, 2), 16);
        bytes.push(byte);
        checksum = (checksum + byte) & 0xFF; // 只保留低8位
    }

    // 添加校验字节
    bytes.push(checksum);

    // 转换回十六进制字符串
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * 十六进制转Base64（兼容RN环境）
 */
function hexToBase64(hexString: string) {
    const cleanHex = hexString.replace(/\s+/g, '');

    // 使用Buffer进行转换（React Native支持）
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(cleanHex, 'hex').toString('base64');
    }

    // 备用方案：手动转换
    const bytes = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes.push(parseInt(cleanHex.slice(i, 2), 16));
    }

    // 使用btoa或base64库
    const binaryString = String.fromCharCode.apply(null, bytes);
    return btoa(binaryString);
}
/*---------------------------------------------------------------------------*/

export class BLEPacketWriter {
    private isWriting: boolean;

    constructor(deviceId: string, serviceUUID: string, characteristicUUID: string,bleManager:any, options = {}) {
        this.deviceId = deviceId;
        this.serviceUUID = serviceUUID;
        this.characteristicUUID = characteristicUUID;

        // 配置选项
        this.packetSize = options.packetSize || 20;
        this.delayBetweenPackets = options.delay || 50; // 包间延迟(ms)
        this.maxRetries = options.maxRetries || 3;
        this.withResponse = options.withResponse !== false; // 默认使用有响应写入

        this.manager = bleManager;
        this.isWriting = false;
        this.currentQueue = [];
    }

    /**
     * 写入大段数据（自动分包）
     */
    async writeLargeData(hexData:string, progressCallback = null) {
        if (this.isWriting) {
            throw new Error('当前有写入任务正在进行');
        }

        try {
            this.isWriting = true;

            // 1. 数据分包
            const packets = chunkHexToBase64(hexData, this.packetSize, false);
            const totalPackets = packets.length;

            console.log(`开始写入 ${totalPackets} 个数据包...`);

            // 2. 顺序写入所有包
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];
                let retryCount = 0;
                let success = false;

                // 重试机制
                while (!success && retryCount <= this.maxRetries) {
                    try {
                        if (this.withResponse) {
                            await this.manager.writeCharacteristicWithResponseForDevice(
                                this.deviceId,
                                this.serviceUUID,
                                this.characteristicUUID,
                                packet
                            );
                        } else {
                            await this.manager.writeCharacteristicWithoutResponseForDevice(
                                this.deviceId,
                                this.serviceUUID,
                                this.characteristicUUID,
                                packet
                            );
                        }

                        success = true;
                        console.log(`包 ${i + 1}/${totalPackets} 写入成功`);

                        // 进度回调
                        if (progressCallback) {
                            // @ts-ignore
                            progressCallback(i + 1, totalPackets);
                        }

                    } catch (error) {
                        retryCount++;
                        console.warn(`包 ${i + 1} 写入失败，重试 ${retryCount}/${this.maxRetries}:`, error.message);

                        if (retryCount > this.maxRetries) {
                            throw new Error(`包 ${i + 1} 写入失败，已达最大重试次数`);
                        }

                        // 等待后重试
                        await this.delay(1000 * retryCount);
                    }
                }

                // 包间延迟（避免设备缓冲区溢出）
                if (i < packets.length - 1) {
                    await this.delay(this.delayBetweenPackets);
                }
            }

            console.log('所有数据包写入完成！');
            return true;

        } catch (error) {
            console.error('写入过程出错:', error);
            throw error;
        } finally {
            this.isWriting = false;
        }
    }

    /**
     * 延迟函数
     */
    delay(ms: number | undefined) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 取消当前写入
     */
    cancel() {
        this.isWriting = false;
        console.log('写入已取消');
    }
}

