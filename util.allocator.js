// Allocator，分配器，用于每Tick缓存建筑的搜索结果及目标分配。
// 每个Job下 工作的目标从这里取。
// 每个Bot如果需要找目标，最好需要这里

// 初始状态的cache全为空
// 警告： 每加上一个FILETER_RULE都需要在这里对应添加一个
const searchCacheProto = {
    energyWarehouse: {
        cache: undefined,
        pointStatus: {},
    },
    energySource: {
        cache: undefined,
        pointStatus: {},
    },
    tower: {
        cache: undefined,
        pointStatus: {},
    },
    storage: {
        cache: undefined,
        pointStatus: {},
    },
    tombstone: {
        cache: undefined,
        pointStatus: {},
    },
};

// ——————————————————————————————
// —————————  缓存对象  ——————————
// ——————————————————————————————
searchCache = undefined;

// 重置搜索缓存
function resetCache() {
    searchCache = _.cloneDeep(searchCacheProto);
}

// 缓存设置函数
// 如果有缓存，则reture需要的资源
// 如果没有缓存，则运行whenCacheNotExist函数。这个函数应该返回一个即将要存入缓存的数据结构
function tryGetCache(ruleName, whenCacheNotExist) {
    // 确定缓存对象状态  如果有缓存，直接返回，否则先执行一次初始化函数
    if (!searchCache[ruleName].cache) {
        searchCache[ruleName].cache = whenCacheNotExist();
    }

    return searchCache[ruleName].cache;
}

// 获取可以存储能量的结构List
const FILTER_RULE_EnergyWarehouse = {
    ruleName: "energyWarehouse",
    search: (creep) => {
        return tryGetCache(FILTER_RULE_EnergyWarehouse.ruleName, () => {
            return creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (
                        (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                },
            });
        });
    },
};

// 获取能量资源点
const FILTER_RULE_EnergySource = {
    ruleName: "energySource",
    search: (creep) => {
        return tryGetCache(FILTER_RULE_EnergySource.ruleName, () => {
            return creep.room.find(FIND_SOURCES);
        });
    },
};

// 获取需要能量的防御塔
const FILTER_RULE_Tower = {
    ruleName: "tower",
    search: (creep) => {
        return tryGetCache(FILTER_RULE_Tower.ruleName, () => {
            return creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                },
            });
        });
    },
};

// 获取还没有满的防御塔
const FILTER_RULE_Storage = {
    ruleName: "storage",
    search: (creep) => {
        return tryGetCache(FILTER_RULE_Storage.ruleName, () => {
            return creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                },
            });
        });
    },
};

// 获取里面还有资源的坟墓
const FILTER_RULE_Tombstone = {
    ruleName: "tombstone",
    search: (creep) => {
        return tryGetCache(FILTER_RULE_Tombstone.ruleName, () => {
            return creep.room.find(FIND_TOMBSTONES, {
                filter: (structure) => {
                    return structure.store.getUsedCapacity() > 0;
                },
            });
        });
    },
};

// 根据传入的筛选规则组
function setTargetByRule(creep, filterRule) {
    // 如果是本次Tick第一次进入此函数，会先初始化

    let ruleName = filterRule.ruleName;

    // 确定缓存对象状态  如果没有缓存  则进行初始化的搜索
    if (!searchCache[ruleName].cache) {
        searchCache[ruleName].cache = filterRule.search(creep);
    }

    // 如果找不到合适的目标，直接返回null
    if (searchCache[ruleName].cache.length == 0) {
        return null;
    }

    // 检查pointStatus 使其初始化     (检测里面有没有内容)
    if (Object.keys(searchCache[ruleName].pointStatus).length == 0) {
        searchCache[ruleName].cache.forEach((target) => {
            // 以目标的ID作为pointStatus的Key
            searchCache[ruleName].pointStatus[target.id] = true; // 默认value为true表示可用
        });
    }

    // 分配目标功能

    // 前一帧 Bot存储的目标
    let prevTickTarget = creep.memory.targetId;

    // 判断Bot的目标是否在符合条件的目标中   |   并且未被对应规则组占用
    let pointStatus = searchCache[ruleName].pointStatus;
    if (pointStatus.hasOwnProperty(prevTickTarget) && pointStatus[prevTickTarget]) {
        // 标记目标点为占用状态 继续进行自己的工作
        // (这么写脑测偶尔会出现抢工作的情况，理想上应该先进行一次遍历先让有工作的把点位占用，再一次遍历执行这个函数就比较合理)
        pointStatus[prevTickTarget] = false;
        return prevTickTarget;
    }

    // 如果没有合适的目标，现在就分配一个合适的目标
    // 先建立一个有所有未占用目标的数组
    let selectedTargets = [];
    for (let id in pointStatus) {
        if (pointStatus[id]) {
            selectedTargets.push(Game.getObjectById(id));
        }
    }

    // 如果所有目标都被占用了，那就不管是否占用，就找最近的目标就好了  todo@ 逻辑优化
    if (selectedTargets.length == 0) {
        selectedTargets = searchCache[ruleName].cache;
    }

    // 找到距离最近的点  设为占用之后返回
    let finalTarget = creep.pos.findClosestByPath(selectedTargets);
    if (finalTarget) {
        pointStatus[finalTarget.id] = false;
    } else {
        return null;
    }
    creep.memory.targetId = finalTarget.id;
    return finalTarget.id;
}

const modulePack = Object.freeze({
    resetCache: resetCache,
    setTargetByRule: setTargetByRule,
    FILTER_RULE_EnergyWarehouse: FILTER_RULE_EnergyWarehouse,
    FILTER_RULE_EnergySource: FILTER_RULE_EnergySource,
    FILTER_RULE_Tower: FILTER_RULE_Tower,
    FILTER_RULE_Storage: FILTER_RULE_Storage,
    FILTER_RULE_Tombstone: FILTER_RULE_Tombstone,
});
module.exports = modulePack;
