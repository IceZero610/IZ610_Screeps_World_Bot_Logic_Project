const { jobStatistics } = require("./core.workManager");
const utilFunc = require("./util.func");
const { ROLE_UPGRADER, ROLE_HARVESTER, ROLE_BUILDER, ROLE_REPAIRER, ROLE_BACKMAN } = require("./util.roleEnum");
const { jobEnum } = require("./jobs");
function displayModitor() {
    if (Game.spawns["Spawn1"].spawning) {
        var spawningCreep = Game.creeps[Game.spawns["Spawn1"].spawning.name];
        Game.spawns["Spawn1"].room.visual.text(
            "🛠️" + spawningCreep.memory.role,
            Game.spawns["Spawn1"].pos.x + 1,
            Game.spawns["Spawn1"].pos.y,
            {
                align: "left",
                opacity: 0.8,
            },
        );
    }

    let lifeTime = [];
    for (let name in Memory.creeps) {
        if (!Game.creeps[name].spawning) {
            lifeTime.push(Game.creeps[name].ticksToLive);
        }
    }
    let min = Math.min.apply(null, lifeTime);

    Game.spawns["Spawn1"].room.visual.text(
        `💀最近的死亡: ${min} Tick`,
        Game.spawns["Spawn1"].pos.x - 16,
        Game.spawns["Spawn1"].pos.y - 10,
        { align: "left", opacity: 0.4 },
    );

    Game.spawns["Spawn1"].room.visual.text(
        `ℹRole分配：研究: ${utilFunc.roleList(ROLE_UPGRADER).length} |
补给: ${utilFunc.roleList(ROLE_HARVESTER).length} | 
建设: ${utilFunc.roleList(ROLE_BUILDER).length} | 
修理: ${utilFunc.roleList(ROLE_REPAIRER).length} |
打杂: ${utilFunc.roleList(ROLE_BACKMAN).length}`,
        Game.spawns["Spawn1"].pos.x - 16,
        Game.spawns["Spawn1"].pos.y - 9,
        { align: "left", opacity: 0.6 },
    );

    Game.spawns["Spawn1"].room.visual.text(`📊Job状态统计：`, Game.spawns["Spawn1"].pos.x - 16, Game.spawns["Spawn1"].pos.y - 8, {
        align: "left",
        opacity: 0.6,
    });

    Game.spawns["Spawn1"].room.visual.text(
        `补充能量: ${jobStatistics.saved[jobEnum.JOB_HarvestEnergy]}`,
        Game.spawns["Spawn1"].pos.x - 15,
        Game.spawns["Spawn1"].pos.y - 7,
        { align: "left", opacity: 0.4 },
    );

    Game.spawns["Spawn1"].room.visual.text(
        `输送能量: ${jobStatistics.saved[jobEnum.JOB_TransferEnergyToSpawn]}`,
        Game.spawns["Spawn1"].pos.x - 15,
        Game.spawns["Spawn1"].pos.y - 6,
        { align: "left", opacity: 0.4 },
    );

    Game.spawns["Spawn1"].room.visual.text(
        `升级研究: ${jobStatistics.saved[jobEnum.JOB_TransferEnergyToController]}`,
        Game.spawns["Spawn1"].pos.x - 15,
        Game.spawns["Spawn1"].pos.y - 5,
        { align: "left", opacity: 0.4 },
    );

    Game.spawns["Spawn1"].room.visual.text(
        `建筑结构: ${jobStatistics.saved[jobEnum.JOB_BuildingConstruction]}`,
        Game.spawns["Spawn1"].pos.x - 15,
        Game.spawns["Spawn1"].pos.y - 4,
        { align: "left", opacity: 0.4 },
    );

    Game.spawns["Spawn1"].room.visual.text(
        `维修建筑: ${jobStatistics.saved[jobEnum.JOB_Repairing]}`,
        Game.spawns["Spawn1"].pos.x - 15,
        Game.spawns["Spawn1"].pos.y - 3,
        { align: "left", opacity: 0.4 },
    );

    Game.spawns["Spawn1"].room.visual.text(
        `休息待机: ${jobStatistics.saved[jobEnum.JOB_GotoRestPoint]}`,
        Game.spawns["Spawn1"].pos.x - 15,
        Game.spawns["Spawn1"].pos.y - 2,
        { align: "left", opacity: 0.4 },
    );
}

const modulePack = Object.freeze({
    displayModitor: displayModitor,
});
module.exports = modulePack;
