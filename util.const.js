// ———— 游戏相关常量 ————

// Body部件Enum
const bodyEnum = Object.freeze({
    move: MOVE,
    work: WORK,
    carry: CARRY,
    attack: ATTACK,
    ranged: RANGED_ATTACK,
    heal: HEAL,
    claim: CLAIM,
    tough: TOUGH,
});

// Body部件价格
const bodyCost = Object.freeze({
    move: 50,
    work: 100,
    carry: 50,
    attack: 80,
    ranged_attack: 150,
    heal: 250,
    claim: 600,
    tough: 10,
});

const modulePack = Object.freeze({
    bodyEnum: bodyEnum,
    bodyCost: bodyCost,
});
module.exports = modulePack;
