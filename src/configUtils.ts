import config, { IRoomConfig } from "./config";

interface IAnnotatedRoomConfig extends IRoomConfig {
    roomId: string;
}

export function getRoomConfig(roomId: string): IAnnotatedRoomConfig {
    const defaults = config.defaultRoomConfig;
    let overrides = config.roomConfigs[roomId];
    if (!overrides) {
        return Object.assign({}, {roomId}, defaults) as IAnnotatedRoomConfig;
    }
    return Object.assign({}, {roomId}, defaults, overrides) as IAnnotatedRoomConfig;
}

export function getRoomConfigsForTarget(emailAddress: string, source: "cc" | "bcc" | "to"): IAnnotatedRoomConfig[] {
    const configs: IAnnotatedRoomConfig[] = [];
    const customMapping = config.customMailTargets[emailAddress];
    const defaultMapping = config.defaultMailTargets;

    if (customMapping) {
        for (const mapped of customMapping) {
            configs.push(getRoomConfig(mapped));
        }
    } else if (defaultMapping.length > 0) {
        for (const mapped of defaultMapping) {
            configs.push(getRoomConfig(mapped));
        }
    } else {
        const domains = config.mail.domains;

        if (domains.includes(emailAddress.split('@')[1]) || config.mail.allowAnyDomain) {
            const parts = emailAddress.split('@')[0].split('_');
            if (parts.length < 2) return null; // invalid address

            const roomId = `!${parts.shift()}:${parts.join('_')}`;
            configs.push(getRoomConfig(roomId));
        }

    }

    if (configs.length === 0) {
        return null;
    }

    const freshConfigs: IAnnotatedRoomConfig[] = [];
    for (const roomConfig of configs) {
        if (!roomConfig) continue;
        if (source === "cc" && !roomConfig.useCcAsTarget) continue;
        if (source === "bcc" && !roomConfig.useBccAsTarget) continue;
        if (source === "to" && !roomConfig.useToAsTarget) continue;
        freshConfigs.push(roomConfig);
    }

    return freshConfigs;
}
