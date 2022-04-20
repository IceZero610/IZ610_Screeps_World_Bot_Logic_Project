// ———— Jobs：类似状态机的Status，在某一状态下时，执行特定的行为 ————

const {
    FILTER_RULE_EnergyWarehouse,
    setTargetByRule: setTargetIDByRule,
    FILTER_RULE_EnergySource,
    FILTER_RULE_Tower,
    FILTER_RULE_Storage,
    FILTER_RULE_Tombstone,
} = require("./util.allocator");

// 字符串对应组，每添加新的Condition和Operation，需要同步向这里添加Enum

// Job的Enum
const jobEnum = Object.freeze({
    // 前往能量源获取能量
    JOB_HarvestEnergy: "JOB_HarvestEnergy",

    // 既可以前往能量源处获取能量，在能量源枯竭的时候前往Storage获取能量
    JOB_FillEnergyWhatever: "JOB_FillEnergyWhatever",

    // 将能量送往Spawn或其他可以储存能量的装置
    JOB_TransferEnergyToSpawn: "JOB_TransferEnergyToSpawn",

    // 将能量送往Controller
    JOB_TransferEnergyToController: "JOB_TransferEnergyToController",

    // 前往休息点
    JOB_GotoRestPoint: "JOB_GotoRestPoint",

    // 找建筑造
    JOB_BuildingConstruction: "JOB_BuildingConstruction",

    // 找破损建筑修
    JOB_Repairing: "JOB_Repairing",

    // 为防御塔提供能量
    JOB_TowerSupply: "JOB_TowerSupply",

    // 将能量送往能量贮藏结构
    JOB_TransferResourceToStorage: "JOB_TransferResourceToStorage",

    // 从墓碑里取走物资
    JOB_Vulture: "JOB_Vulture",
});

// JobCondition的Enum  用于Prefab的定义，存在Memory中的字符串对应
const conditionEnum = Object.freeze({
    // 能量为零时前往补充能量(状态保存)  JOB_HarvestEnergy版本  (不去仓库取)
    HarvestEnergy: "HarvestEnergy",

    // 能量为零时前往补充能量(状态保存)  JOB_FillEnergyWhatever版本  (可以去仓库取)
    FillEnergy: "FillEnergy",

    // 运送能量到容器中
    TransferEnergy: "TransferEnergy",

    // 能量不为0时也补充能量  (最好优先级往后排)
    FillEnergyStandby: "FillEnergyStandby",

    // 必定触发  给Controller提供能量
    UpgradeController: "UpgradeController",

    // 有待建造的建筑、能量全满(状态保存)
    Building: "Building",

    // 有可以维修的建筑、能量全满(状态保存)
    Repairing: "Repairing",

    // 有防御塔需要能量
    TowerNeedSupply: "TowerNeedSupply",

    // 当有没有满的能量贮藏结构时
    CanStorePower: "CanStorePower",

    // 有墓碑
    Vulture: "Vulture",
});

// ——————————————————————————————————————
//                 重要
// ——————————————————————————————————————

// 条件判断，如果满足条件，进行相关处理并返回true，中断后续的条件判断，否则反馈false，继续下面的判断
const jobConditions = Object.freeze({
    // 缺能量，去能源点获取能量：JOB_HarvestEnergy
    HarvestEnergy: {
        checkCondition: (self) => {
            // 如果能量已满，设置为前往休息点，不中断条件判断
            if (self.store.getFreeCapacity() == 0) {
                self.memory.job = jobEnum.JOB_GotoRestPoint;
                return false;
            }
            // 身上没有一点点能量的时候 设定为 JOB_HarvestEnergy 状态
            if (self.store.getUsedCapacity() == 0) {
                self.memory.job = jobEnum.JOB_HarvestEnergy;
                self.say("整点能量去");
                return true;
            } else {
                if (self.memory.job == jobEnum.JOB_HarvestEnergy) {
                    return true;
                } else {
                    return false;
                }
            }
        },
    },

    // 缺能量，优先能源点，然后是仓库
    FillEnergy: {
        checkCondition: (self) => {
            // 如果能量已满，设置为前往休息点，不中断条件判断
            if (self.store.getFreeCapacity() == 0) {
                self.memory.job = jobEnum.JOB_GotoRestPoint;
                return false;
            }
            // 身上没有一点点能量的时候 设定为 JOB_HarvestEnergy 状态
            if (self.store.getUsedCapacity() == 0) {
                self.memory.job = jobEnum.JOB_FillEnergyWhatever;
                self.say("填充能量");
                return true;
            } else {
                // 避免刚开始采集就结束采集，保留采集状态
                if (self.memory.job == jobEnum.JOB_FillEnergyWhatever) {
                    return true;
                } else {
                    return false;
                }
            }
        },
    },

    // 一般是所有事情都做完了没什么事儿了，拿点能量然后去待机
    FillEnergyStandby: {
        checkCondition: (self) => {
            // 如果能量已满，设置为前往休息点，不中断条件判断
            if (self.store.getFreeCapacity() > 0) {
                self.memory.job = jobEnum.JOB_HarvestEnergy;
                self.say("储备摸鱼能量");
                return true;
            }
            return false;
        },
    },

    // 可以运输能量的地方
    TransferEnergy: {
        checkCondition: (self) => {
            // 寻找可以存储能量的结构
            let spawnTargets = FILTER_RULE_EnergyWarehouse.search(self);
            // 如果可以找到，则设定为对应Job
            if (spawnTargets.length > 0) {
                self.memory.job = jobEnum.JOB_TransferEnergyToSpawn;
                self.say("正在送回能量");
                return true;
            }

            return false;
        },
    },

    // 必定触发，直接改写job
    UpgradeController: {
        checkCondition: (self) => {
            self.memory.job = jobEnum.JOB_TransferEnergyToController;
            return true;
        },
    },

    // 有待建造的建筑  todo@ 任务分配优化
    Building: {
        checkCondition: (self) => {
            let targets = self.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length > 0) {
                // 只有能量全满的状态才会开始建造
                if (self.store.getFreeCapacity() == 0) {
                    self.memory.job = jobEnum.JOB_BuildingConstruction;
                    return true;
                }
                // 额外的，保留建造状态
                else {
                    if (self.memory.job == jobEnum.JOB_BuildingConstruction) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
            // 没东西造的话，跳过这个状态
            else {
                return false;
            }
        },
    },

    Repairing: {
        checkCondition: (self) => {
            // 搜索所有待修复建筑 todo@ 封装优化
            let targets = self.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.hitsMax > structure.hits;
                },
            });
            if (targets.length > 0) {
                // 只有能量全满的状态才会开始维修
                if (self.store.getFreeCapacity() == 0) {
                    self.memory.job = jobEnum.JOB_Repairing;
                    return true;
                }
                // 额外的，保留维修状态
                else {
                    if (self.memory.job == jobEnum.JOB_Repairing) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
            // 没东西修的话，跳过这个状态
            else {
                return false;
            }
        },
    },

    TowerNeedSupply: {
        checkCondition: (self) => {
            // 寻找需要能量的防御塔
            let towerTargets = FILTER_RULE_Tower.search(self);

            // 如果可以找到，则设定为对应Job
            if (towerTargets.length > 0) {
                self.memory.job = jobEnum.JOB_TowerSupply;
                self.say("补给防御塔");
                return true;
            }

            return false;
        },
    },

    CanStorePower: {
        checkCondition: (self) => {
            // 寻找可以存能量的仓库
            let towerTargets = FILTER_RULE_Storage.search(self);

            // 如果可以找到，则设定为对应Job
            if (towerTargets.length > 0) {
                self.memory.job = jobEnum.JOB_TransferResourceToStorage;
                self.say("储存资源");
                return true;
            }

            return false;
        },
    },

    Vulture: {
        checkCondition: (self) => {
            // 寻找可以还有资源的墓碑
            let towerTargets = FILTER_RULE_Tombstone.search(self);

            // 如果已经在做一些运送类的工作，则继续做，不打断
            if (
                self.memory.job == jobEnum.JOB_TowerSupply ||
                self.memory.job == jobEnum.JOB_TransferEnergyToSpawn ||
                self.memory.job == jobEnum.JOB_BuildingConstruction ||
                self.memory.job == jobEnum.JOB_TowerSupply ||
                self.memory.jon == jobEnum.JOB_TransferResourceToStorage
            ) {
                return false;
            }

            // 如果可以找到，则设定为对应Job
            if (towerTargets.length > 0 && self.store.getFreeCapacity() > 0) {
                self.memory.job = jobEnum.JOB_Vulture;
                return true;
            }

            return false;
        },
    },
});

// 具体处理每个Job下self的工作逻辑的部分
const jobOperator = Object.freeze({
    // 前往能量源获取能量
    JOB_HarvestEnergy: {
        operate: (self) => {
            setTargetIDByRule(self, FILTER_RULE_EnergySource);
            let target = Game.getObjectById(self.memory.targetId);

            if (self.harvest(target) == ERR_NOT_IN_RANGE) {
                self.moveTo(target, { visualizePathStyle: { stroke: "#999900" } });
            }
        },
    },

    // 如果能量源没有能量了，则去仓库取能量
    JOB_FillEnergyWhatever: {
        operate: (self) => {
            setTargetIDByRule(self, FILTER_RULE_EnergySource);
            let target = Game.getObjectById(self.memory.targetId);

            // 如果能源点还有能量，还是优先去能源点采集
            if (Game.getObjectById("ef7b0774eae1ab4").energy > 0) {
                if (self.harvest(target) == ERR_NOT_IN_RANGE) {
                    self.moveTo(target, { visualizePathStyle: { stroke: "#999900" } });
                }
            }
            // 如果能源点已经枯竭，去仓库取能量
            else {
                setTargetIDByRule(self, FILTER_RULE_Storage);
                target = Game.getObjectById(self.memory.targetId);
                if (self.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    self.moveTo(target, { visualizePathStyle: { stroke: "#999900" } });
                }
            }
        },
    },

    // 将能量送往Spawn或其他可以储存能量的装置
    JOB_TransferEnergyToSpawn: {
        operate: (self) => {
            // 获取目标点
            setTargetIDByRule(self, FILTER_RULE_EnergyWarehouse);

            target = Game.getObjectById(self.memory.targetId);

            // self.say(`${target.pos.x}, ${target.pos.y}`)

            if (self.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                self.moveTo(target, { visualizePathStyle: { stroke: "#FFFF00" } });
            }
        },
    },

    // 将能量送往Controller
    JOB_TransferEnergyToController: {
        operate: (self) => {
            if (self.upgradeController(self.room.controller) == ERR_NOT_IN_RANGE) {
                self.moveTo(self.room.controller, { visualizePathStyle: { stroke: "#00AAFF" } });
            }
        },
    },

    // 前往休息点
    JOB_GotoRestPoint: {
        operate: (self) => {
            // 找到休息点
            let restPoint = Game.flags["RestPoint"].pos;
            self.moveTo(restPoint, { visualizePathStyle: { stroke: "#FF2323" } });
            self.say("摸了");
        },
    },

    //  建设
    JOB_BuildingConstruction: {
        operate: (self) => {
            let targets = self.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                if (self.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    self.moveTo(targets[0], { visualizePathStyle: { stroke: "#006633" } });
                }
            }
        },
    },

    // 修理
    JOB_Repairing: {
        operate: (self) => {
            //搜索是否有可以维修的点位  todo@ 同上，一同优化搜索目标寻找
            let targets = self.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.hitsMax > structure.hits;
                },
            });
            // 如果有，则执行维修操作
            if (targets.length) {
                if (self.repair(targets[0]) == ERR_NOT_IN_RANGE) {
                    self.moveTo(targets[0], { visualizePathStyle: { stroke: "#00EE33" } });
                }
            }
            self.say(`🔨 还有${targets.length}个维修点`);
        },
    },

    // 给防御塔补记
    JOB_TowerSupply: {
        operate: (self) => {
            // 获取目标点
            setTargetIDByRule(self, FILTER_RULE_Tower);

            let target = Game.getObjectById(self.memory.targetId);

            if (self.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                self.moveTo(target, { visualizePathStyle: { stroke: "#FF6600" } });
            }
        },
    },

    // 送东西到仓库中去
    JOB_TransferResourceToStorage: {
        operate: (self) => {
            // 获取目标点
            setTargetIDByRule(self, FILTER_RULE_Storage);

            let target = Game.getObjectById(self.memory.targetId);

            let recourceType = _.find(Object.keys(self.store));

            if (self.transfer(target, recourceType) == ERR_NOT_IN_RANGE) {
                self.moveTo(target, { visualizePathStyle: { stroke: "#FFFF00" } });
            }
        },
    },

    // 取走墓碑里面的资源
    JOB_Vulture: {
        operate: (self) => {
            // 获取目标点
            setTargetIDByRule(self, FILTER_RULE_Tombstone);

            let target = Game.getObjectById(self.memory.targetId);
            // console.log(target)

            let recourceType = _.find(Object.keys(target.store));

            // self.say(recourceType);

            if (recourceType && self.withdraw(target, recourceType) == ERR_NOT_IN_RANGE) {
                self.say("🪦 正在回收");
                self.moveTo(target, { visualizePathStyle: { stroke: "#FF0000" } });
            }
        },
    },
});

// Export
const modulePack = Object.freeze({
    jobEnum: jobEnum,
    jobConditionEnum: conditionEnum,
    jobOperator: jobOperator,
    jobConditions: jobConditions,
});

module.exports = modulePack;
