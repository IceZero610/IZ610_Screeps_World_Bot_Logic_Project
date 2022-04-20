const hitPointSetting = [10000, 45000, 100000];

function towerLogic() {
    var towers = [Game.getObjectById("aacbe85227547f8"), Game.getObjectById("f49a88296786257")];

    for (let i = 0; i < 2; i++) {
        let tower = towers[i];
        if (tower) {
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

            if (closestHostile) {
                tower.attack(closestHostile);
            } else {
                var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) =>
                        structure.hitsMax - structure.hits > 1500 &&
                        structure.structureType != STRUCTURE_WALL &&
                        structure.structureType != STRUCTURE_RAMPART,
                });
                if (closestDamagedStructure) {
                    tower.repair(closestDamagedStructure);
                } else {
                    for (let index = 0; index < hitPointSetting.length; index++) {
                        let walls = tower.room.find(FIND_STRUCTURES, {
                            filter: (structure) =>
                                structure.hits < hitPointSetting[index] &&
                                (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART),
                        });
                        if (walls.length > 0) {
                            let minHit = _.min(walls, function (obj) {
                                return obj.hits;
                            });

                            tower.repair(minHit);

                            break;
                        }
                    }
                }
            }
        }
    }
}

// Export
const modulePack = Object.freeze({
    towerLogic: towerLogic,
});

module.exports = modulePack;
