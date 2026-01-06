// hooks/logger.js
import { logger } from 'react-native-logs';

const padZero = (num, length = 2) => num.toString().padStart(length, '0');

// 定义不同级别的前缀
const levelPrefixes = {
    error: '❌ ERROR',
    warn: '⚠️ WARN',
    info: 'ℹ️ INFO',
    debug: '🔍DEBUG',
};

const config = {
    severity: 'debug',
    state: true,       // 是否启用日志 (true/false)
    async: true,       // 是否异步记录日志 (建议开启以提高性能)
    transport: (msgObj, levelFromTransport, optionsFromTransport) => {
        const now = new Date();
        const dateTimeStr = `${now.getFullYear()}/${padZero(now.getMonth() + 1)}/${padZero(now.getDate())} ${padZero(now.getHours())}:${padZero(now.getMinutes())}:${padZero(now.getSeconds())}.${padZero(now.getMilliseconds(), 3)}`;

        if (typeof msgObj === 'object' && msgObj !== null) {
            const rawMsgArray = msgObj.rawMsg || [];
            const rawMsgString = rawMsgArray.join(' ');
            const levelText = (msgObj.level?.text || 'log').toLowerCase();
            const prefix = levelPrefixes[levelText] || levelPrefixes.log;

            console.log(`[${dateTimeStr}] [${prefix}] ${rawMsgString}`);
        } else {
            const levelStr = (levelFromTransport || 'log').toLowerCase();
            const prefix = levelPrefixes[levelStr] || levelPrefixes.log;

            console.log(`[${dateTimeStr}] [${prefix}]`, msgObj);
        }
    },
};

export const log = logger.createLogger(config);
