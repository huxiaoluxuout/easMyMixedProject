const MAX_PACKET_SIZE = 20; // BLE单包最大字节数

/**
 * 将十六进制数据转换为Base64
 */
export function hexToBase64(hexString: string): string {
    // 清理输入
    const cleanHex = hexString.replace(/\s+/g, '');

    // 验证
    if (!/^[0-9A-Fa-f]+$/.test(cleanHex)) {
        throw new Error('输入包含非十六进制字符');
    }
    if (cleanHex.length % 2 !== 0) {
        throw new Error('十六进制字符串长度应为偶数');
    }

    // 转换为字节数组
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }

    // 转换为Base64
    if (typeof Buffer !== 'undefined') {
        // Node.js 或 React Native 环境
        return Buffer.from(bytes).toString('base64');
    } else {
        // 浏览器环境
        const binaryString = String.fromCharCode(...bytes);
        return btoa(binaryString);
    }
}

/**
 * 将大段十六进制数据分包为多个Base64包
 */
export function chunkHexToBase64(
    hexString: string,
    chunkSize: number = MAX_PACKET_SIZE,
    addChecksum: boolean = false
): string[] {
    // 清理输入
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
    console.log(`📦 原始数据: ${totalBytes} 字节`);

    // 如果数据很小，不需要分包
    if (totalBytes <= chunkSize) {
        console.log('数据较小，单包发送');
        const base64 = hexToBase64(cleanHex);
        console.log(`Base64包: ${base64}`);
        return [base64];
    }

    // 分包处理
    const chunks: string[] = [];
    const packetCount = Math.ceil(totalBytes / chunkSize);

    console.log(`需要分包: ${packetCount} 个包 (每包最多 ${chunkSize} 字节)`);

    for (let i = 0; i < packetCount; i++) {
        // 计算当前包的起始和结束位置
        const startByte = i * chunkSize;
        const endByte = Math.min((i + 1) * chunkSize, totalBytes);
        const byteCount = endByte - startByte;

        // 提取这个包的HEX数据
        const startIndex = startByte * 2;
        const endIndex = endByte * 2;
        const chunkHex = cleanHex.substring(startIndex, endIndex);

        // 可选：添加校验和
        let finalHex = chunkHex;
        if (addChecksum) {
            finalHex = addChecksumToHex(chunkHex);
            console.log(`包 ${i+1} 添加校验和: ${chunkHex} -> ${finalHex}`);
        }

        // 转换为Base64
        const base64Chunk = hexToBase64(finalHex);
        chunks.push(base64Chunk);

        console.log(`📤 分包 ${i+1}/${packetCount}: ${byteCount}字节`);
        console.log(`   HEX: ${chunkHex}`);
        console.log(`   Base64: ${base64Chunk}`);

        // 显示前几个字节用于调试
        if (i < 3) {
            console.log(`   数据预览: ${chunkHex.substring(0, 20)}...`);
        }
    }

    console.log(`✅ 总计: ${chunks.length} 个包`);
    return chunks;
}

/**
 * 添加校验和（低8位和校验）
 */
function addChecksumToHex(hexString: string): string {
    const bytes = [];
    let checksum = 0;

    // 解析十六进制为字节数组
    for (let i = 0; i < hexString.length; i += 2) {
        // 注意：使用 substring，不是 slice(i, 2)
        const byte = parseInt(hexString.substring(i, i + 2), 16);
        if (isNaN(byte)) {
            throw new Error(`无效的十六进制字节: ${hexString.substring(i, i + 2)}`);
        }
        bytes.push(byte);
        checksum = (checksum + byte) & 0xFF; // 只保留低8位
    }

    // 添加校验字节
    bytes.push(checksum);

    // 转换回十六进制字符串
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * 验证函数 - 检查分包和重组是否正确
 */
export function verifyChunking(hexString: string, chunkSize: number = MAX_PACKET_SIZE): boolean {
    const cleanHex = hexString.replace(/\s+/g, '');

    console.log('\n=== 验证分包 ===');
    console.log('原始数据长度:', cleanHex.length, '字符');
    console.log('原始字节数:', cleanHex.length / 2, '字节');

    // 分包
    const packets = chunkHexToBase64(hexString, chunkSize, false);

    // 重组验证
    let reassembledHex = '';

    packets.forEach((packet, index) => {
        // Base64转回HEX
        const hexPacket = base64ToHex(packet);
        reassembledHex += hexPacket;

        console.log(`\n包 ${index + 1}:`);
        console.log('  Base64:', packet);
        console.log('  HEX:', hexPacket);
        console.log('  长度:', hexPacket.length / 2, '字节');
    });

    console.log('\n=== 验证结果 ===');
    console.log('重组HEX:', reassembledHex);
    console.log('原始HEX:', cleanHex);
    console.log('是否一致:', reassembledHex === cleanHex);

    return reassembledHex === cleanHex;
}

/**
 * Base64转HEX（用于验证）
 */
export function base64ToHex(base64: string): string {
    try {
        let binaryString;

        if (typeof Buffer !== 'undefined') {
            // Node.js 或 React Native 环境
            binaryString = Buffer.from(base64, 'base64').toString('binary');
        } else {
            // 浏览器环境
            binaryString = atob(base64);
        }

        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    } catch (error) {
        console.error('Base64转HEX失败:', error);
        return '';
    }
}


// BLE发送包装类
export class BLESender {
    constructor(bleManager, deviceId, serviceUUID, characteristicUUID) {
        this.bleManager = bleManager;
        this.deviceId = deviceId;
        this.serviceUUID = serviceUUID;
        this.characteristicUUID = characteristicUUID;
        this.isSending = false;
    }

    /**
     * 发送单个数据包
     */
    async sendPacket(base64Data, withResponse = true) {
        try {
            if (withResponse) {
                await this.bleManager.writeCharacteristicWithResponseForDevice(
                    this.deviceId,
                    this.serviceUUID,
                    this.characteristicUUID,
                    base64Data
                );
            } else {
                await this.bleManager.writeCharacteristicWithoutResponseForDevice(
                    this.deviceId,
                    this.serviceUUID,
                    this.characteristicUUID,
                    base64Data
                );
            }
            return true;
        } catch (error) {
            console.error('发送失败:', error);
            throw error;
        }
    }

    /**
     * 发送分包数据
     */
    async sendChunkedData(hexString: string, options = {}) {
        const {
            chunkSize = 20,
            delayMs = 100,
            withResponse = true,
            progressCallback
        } = options;

        if (this.isSending) {
            throw new Error('当前有发送任务正在进行');
        }

        this.isSending = true;

        try {
            // 生成分包
            const packets = chunkHexToBase64(hexString, chunkSize, false);
            const totalPackets = packets.length;

            console.log(`开始发送 ${totalPackets} 个数据包...`);

            // 逐包发送
            for (let i = 0; i < packets.length; i++) {
                console.log(`发送包 ${i + 1}/${totalPackets}`);

                await this.sendPacket(packets[i], withResponse);

                // 进度回调
                if (progressCallback) {
                    progressCallback(i + 1, totalPackets);
                }

                // 包间延迟（最后一個包不需要延迟）
                if (i < packets.length - 1 && delayMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }

            console.log('✅ 所有数据包发送完成');
            return true;

        } catch (error) {
            console.error('❌ 发送过程失败:', error);
            throw error;
        } finally {
            this.isSending = false;
        }
    }
}


// 调试函数：显示数据详情
function debugDataInfo(hexData: string) {
    const cleanHex = hexData.replace(/\s+/g, '');
    const bytes = cleanHex.length / 2;

    console.log('\n=== 数据详情 ===');
    console.log('原始HEX:', hexData);
    console.log('清理后HEX:', cleanHex);
    console.log('总字节数:', bytes);
    console.log('Base64完整数据:', hexToBase64(cleanHex));

    // 分析协议结构
    console.log('\n=== 协议分析 ===');
    console.log('帧头:', cleanHex.substring(0, 4)); // AA55
    console.log('帧尾:', cleanHex.substring(cleanHex.length - 4)); // 55AA
    console.log('数据长度:', bytes, '字节');

    // 显示前10字节
    const first10Bytes = [];
    for (let i = 0; i < Math.min(20, cleanHex.length); i += 2) {
        first10Bytes.push(cleanHex.substring(i, i + 2));
    }
    console.log('前10字节:', first10Bytes.join(' '));
}
