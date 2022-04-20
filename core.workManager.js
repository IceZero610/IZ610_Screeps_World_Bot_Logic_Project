const { jobOperator, jobConditions, jobEnum } = require("./jobs");
const prefabs = require("./prefabs");

// 通过Role，获取AlternativeJob列表
function getJobListByRole(creep) {
    let prefab = prefabs[creep.memory.role];
    return prefab.alternativeJob;
}

let jobStatistics = {
    saved: {},
};

// 处理
function workProcessor() {
    // 当前Tick工作人数统计初始化
    for (let jobType in jobEnum) {
        jobStatistics.saved[jobType] = 0;
    }

    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        for (let i = 0; i < getJobListByRole(creep).length; i++) {
            // 如果发现条件满足  直接结束
            if (jobConditions[getJobListByRole(creep)[i]].checkCondition(creep)) {
                break;
            }
        }

        // 当前Tick工作人数统计
        if ((jobStatistics.saved.hasOwnProperty(creep.memory.job))) {
            jobStatistics.saved[creep.memory.job]++;
        }

        jobOperator[creep.memory.job].operate(creep);
    }
}

const modulePack = Object.freeze({
    workProcessor: workProcessor,
    jobStatistics: jobStatistics,
});
module.exports = modulePack;
