const prefabs = require("./prefabs");
const { bodyCost } = require("./util.const");

function spawnCreepByTemplate(prefab, level = 0) {
    let newName = `${prefab.roleName}_${Game.time}`;
    let bodyTemplate = prefab.bodyTemplate[level];
    let memory = {
        role: prefab.initialRole,
        job: "JOB_HarvestEnergy",
    };
    let res = Game.spawns["Spawn1"].spawnCreep(bodyTemplate, newName, { memory: memory });

    if (res) {
        console.log(`生成Creep失败, 失败编码: ${res}`);
    }
}

// 自动根据Prefab和等级计算所需能量
function energyCostCalc(prefab, level) {
    let bodyTemplate = prefab.bodyTemplate[level];
    total = 0;
    bodyTemplate.forEach((body) => {
        total += bodyCost[body];
    });

    return total;
}

function quantityAssure(creepRole, maxAmount, level = 0) {

    // 如果已经在建造了，直接跳过
    if (Game.spawns["Spawn1"].spawning) {
        return false;
    }

    let creepsInRole = _.filter(Game.creeps, (creep) => creep.memory.role == creepRole);

    // 数量不够 需要补足对应Role
    if (creepsInRole.length < maxAmount) {
        // 能量满足 可以生产
        // console.log(`${creepRole}: ${energyCostCalc(prefabs[creepRole], level)}`)

        // 从设定的最高等级开始，依次尝试生产价格变低的对应Role。
        do {
            if (Game.spawns["Spawn1"].room.energyAvailable >= energyCostCalc(prefabs[creepRole], level)) {
                spawnCreepByTemplate(prefabs[creepRole], level);
                return true;
            } else {
                level--;
            }
        } while (level >= 0);

        // 一旦数量不足，直接阻塞，一定会按照队列顺序优先补充需要的工种
        return true;
    } else {
        return false;
    }
}

const modulePack = Object.freeze({
    quantityAssure: quantityAssure,
    spawnCreepByTemplate: spawnCreepByTemplate,
});
module.exports = modulePack;
