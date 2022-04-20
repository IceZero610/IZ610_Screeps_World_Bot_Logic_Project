const { jobConditionEnum } = require("./jobs");
const { bodyEnum, bodyCost } = require("./util.const");
const { ROLE_UPGRADER, ROLE_HARVESTER, ROLE_BUILDER, ROLE_REPAIRER, ROLE_BACKMAN } = require("./util.roleEnum");

// 根据游程编码的数组生成对应的Body模板的List
function generateBodyTemplate(configList) {
    // 期望传入的数组参数大概是这样的：
    // [move, 2, carry, 2, work, 3, move, 1]

    // 进行数据初步检查
    if (configList.length % 2 != 0) {
        throw Error(`⚠⚠⚠   Warning   ⚠⚠⚠ generateBodyTemplate: configList的长度必须为2的倍数: ${configList}`);
    }

    // 目标输出数组
    targetList = [];

    for (let i = 0; i < configList.length; i += 2) {
        // 检查Body类型 并尝试获取
        if (!bodyCost[configList[i]]) {
            throw Error(`⚠⚠⚠   Warning   ⚠⚠⚠ generateBodyTemplate: configList[${i}]的内容必须为bodyEnum, 当前: ${configList[i]}`);
        }
        let bodyType = configList[i];

        // 检查长度参数是否为整数  并尝试获取
        if (!Number.isInteger(configList[i + 1])) {
            throw Error(`⚠⚠⚠   Warning   ⚠⚠⚠ generateBodyTemplate: configList[${i + 1}]的内容必须为正整数, 当前: ${configList[i + 1]}`);
        }
        count = configList[i + 1];

        // 游程编码规则  片段连接到目标数组
        // console.log(_.times(count, _.constant(bodyType)));
        targetList = targetList.concat(_.times(count, _.constant(bodyType)));
    }

    return targetList;
}

// Body预设模板
const presetTemplate = Object.freeze({
    workerLevel_0: generateBodyTemplate([bodyEnum.work, 1, bodyEnum.carry, 1, bodyEnum.move, 1]),
    workerLevel_1: generateBodyTemplate([bodyEnum.work, 2, bodyEnum.carry, 2, bodyEnum.move, 3]),
    workerLevel_2: generateBodyTemplate([bodyEnum.work, 3, bodyEnum.carry, 4, bodyEnum.move, 6]),
    repairerLevel_1: generateBodyTemplate([bodyEnum.work, 1, bodyEnum.carry, 2, bodyEnum.move, 3]),
    repairerLevel_2: generateBodyTemplate([bodyEnum.work, 1, bodyEnum.carry, 2, bodyEnum.move, 2]),
    updaterLevel_1: generateBodyTemplate([bodyEnum.work, 1, bodyEnum.carry, 3, bodyEnum.move, 3]),
    backmanLevel_1: generateBodyTemplate([bodyEnum.work, 1, bodyEnum.carry, 2, bodyEnum.move, 2]),
    backmanLevel_2: generateBodyTemplate([bodyEnum.work, 1, bodyEnum.carry, 4, bodyEnum.move, 4]),
});

// prefab定义

// roleName: Prefab的名字，作为Creep名字的前缀
// bodyTemplate：生成模板，index越往后消耗越高，需要根据Room的Extension数量水平切换index
// initialRole：刚刚被建造出来时的Role类型，用于标注核心职能。数量统计与Creep建造顺序依赖此项目
// alternativeJob：工作优先级列表，依次检查条件，满足条件则执行对应的工作。  *此项目不存入内存，直接以role为Key在此处获取

const prefabs = Object.freeze({
    harvester: Object.freeze({
        roleName: "采集工",
        initialRole: ROLE_HARVESTER,
        bodyTemplate: [presetTemplate.workerLevel_0, presetTemplate.workerLevel_1, presetTemplate.workerLevel_2],
        alternativeJob: [
            jobConditionEnum.HarvestEnergy,
            jobConditionEnum.TransferEnergy,
            jobConditionEnum.CanStorePower,
            jobConditionEnum.FillEnergyStandby,
        ],
    }),
    upgrader: Object.freeze({
        roleName: "研究员",
        initialRole: ROLE_UPGRADER,
        bodyTemplate: [presetTemplate.workerLevel_0, presetTemplate.updaterLevel_1, presetTemplate.workerLevel_2],
        alternativeJob: [jobConditionEnum.FillEnergy, jobConditionEnum.UpgradeController],
    }),
    builder: Object.freeze({
        roleName: "发展家",
        initialRole: ROLE_BUILDER,
        bodyTemplate: [presetTemplate.workerLevel_0, presetTemplate.workerLevel_1, presetTemplate.workerLevel_2],
        alternativeJob: [
            jobConditionEnum.FillEnergy,
            jobConditionEnum.Building,
            jobConditionEnum.TowerNeedSupply,
            jobConditionEnum.TransferEnergy,
            // jobConditionEnum.Repairing,
            jobConditionEnum.UpgradeController,
        ],
    }),
    repairer: Object.freeze({
        roleName: "维护工",
        initialRole: ROLE_REPAIRER,
        bodyTemplate: [presetTemplate.workerLevel_0, presetTemplate.repairerLevel_1, presetTemplate.repairerLevel_2],
        alternativeJob: [
            jobConditionEnum.FillEnergy,
            jobConditionEnum.TowerNeedSupply,
            // jobConditionEnum.Repairing,
            jobConditionEnum.Building,
            jobConditionEnum.TransferEnergy,
            jobConditionEnum.FillEnergyStandby,
        ],
    }),
    backman: Object.freeze({
        roleName: "临时工",
        initialRole: ROLE_BACKMAN,
        bodyTemplate: [presetTemplate.workerLevel_0, presetTemplate.backmanLevel_1, presetTemplate.backmanLevel_2],
        alternativeJob: [
            jobConditionEnum.Vulture,
            jobConditionEnum.FillEnergy,
            jobConditionEnum.Building,
            jobConditionEnum.TransferEnergy,
            jobConditionEnum.CanStorePower,
        ],
    }),
});

// 外部使用常量设置

const modulePack = Object.freeze({
    harvester: prefabs.harvester,
    builder: prefabs.builder,
    upgrader: prefabs.upgrader,
    repairer: prefabs.repairer,
    backman: prefabs.backman,
});

module.exports = modulePack;
