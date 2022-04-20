const { workProcessor } = require("./core.workManager");
const { quantityAssure } = require("./core.autoSpawning");
const { ROLE_UPGRADER, ROLE_HARVESTER, ROLE_BUILDER, ROLE_REPAIRER, ROLE_BACKMAN } = require("./util.roleEnum");
const { resetCache } = require("./util.allocator");
const { displayModitor } = require("./core.monitor");
const { towerLogic } = require("./build.tower");

module.exports.loop = function () {
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log(`清理 ${name} 的废弃存储空间`);
        }
    }

    towerLogic();

    resetCache();

    const buildList = [
        [ROLE_HARVESTER, 1],
        [ROLE_UPGRADER, 1],
        [ROLE_HARVESTER, 2],
        [ROLE_REPAIRER, 1],
        [ROLE_BUILDER, 1],
        [ROLE_BACKMAN, 1],
        [ROLE_UPGRADER, 2],
        [ROLE_BUILDER, 2],
    ];

    for (let i = 0; i < buildList.length; i++) {
        if (quantityAssure(buildList[i][0], buildList[i][1], 2)) {
            break;
        }
    }

    workProcessor();

    displayModitor();

    // const { spawnCreepByTemplate } = require("./core.autoSpawning");
};
