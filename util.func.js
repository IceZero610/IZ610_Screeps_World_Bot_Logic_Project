// 获取特定role下的creep list
function roleList(roleType) {
    return _.filter(Game.creeps, (creep) => creep.memory.role == roleType);
}

const modulePack = Object.freeze({
    roleList: roleList,
});
module.exports = modulePack;
