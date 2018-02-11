
/**
 * @description Pseudoclassical inheritance, subClass will inherit from superClass
 * @param {class} subClass
 * @param {class} superClass
 */
inherit = function(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype); // delegate to prototype
    subClass.prototype.constructor = subClass; // set constructor on prototype
}

/**
 * @description Get a random integer which is not large than the max number
 * @param {number} max - The max number
 * @returns {number}
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

/**
 * @description Pad a number with leading zeros
 * @param {number} number
 * @param {number} width the total width of the return string
 * @returns {string}
 */
function zeroFill(number, width) {
    width -= number.toString().length;
    if (width > 0){
        return new Array(width + (/\./.test( number ) ? 2 : 1)).join('0') + number;
    }
    return number + "";
}


/**
 * @description Entity in the game, like players, enemies, selector, score
 * @constructor
 */
var Entity = function() {
};

/**
 * @description Update the entity's position
 * @param {number} dt - A time delta between ticks
 */
Entity.prototype.update = function(dt) {
};

/**
 * @description Draw the entity on the screen
 */
Entity.prototype.render = function() {
};

/**
 * @description Reset the attributes of the entity, like position
 */
Entity.prototype.reset = function() {
}


/**
 * @description Image entity in the game, like players, enemies, collectable items
 * @constructor
 */
var ImageEntity = function() {
};

inherit(ImageEntity, Entity);

/**
 * @description Draw the image entity on the screen
 */
ImageEntity.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};


/**
 * @description Text entity in the game, like score, message
 * @constructor
 */
var TextEntity = function() {
};

inherit(TextEntity, Entity);

/**
 * @description Draw the image entity on the screen
 */
TextEntity.prototype.render = function() {
    ctx.font = this.font;
    ctx.fillText(this.text, this.x, this.y);
};


/**
 * @description Enemies our player must avoid
 * @constructor
 */
var Enemy = function() {
};

inherit(Enemy, ImageEntity);

/**
 * @description Reset the attributes of the enemy, like position, speed
 */
Enemy.prototype.reset = function() {
    const yPositions = [63, 146, 229];
    const speeds = [150, 200, 250, 300];

    this.sprite = 'images/enemy-bug.png';
    this.x = 0 - getRandomInt(200);
    this.y = yPositions[getRandomInt(3)];
    this.speed = speeds[getRandomInt(4)];
    this.pauseAnimationFrames = 100;
    this.isHit = false;
}

/**
 * @description Stop the enemy's move
 */
Enemy.prototype.stop = function() {
    this.speed = 0;
}

/**
 * @description Judge if there is a collision between the enemy and the player now
 * @param {player} player
 * @returns {boolean}
 */
Enemy.prototype.hasCollision = function(player) {
    return this.y <= player.y && this.y + 83 >= player.y &&
        this.x + 70 >= player.x && this.x - 50 <= player.x && ! player.isStopped;
}

/**
 * @description Deal with the collision situation
 * @param {player} player
 */
Enemy.prototype.handleCollision = function(player) {
    this.sprite = 'images/rock.png';
    this.isHit = true;
    this.stop();
    player.handleCollision();
}

/**
 * @description Update the enemy's position
 * @param {number} dt - A time delta between ticks
 */
Enemy.prototype.update = function(dt) {
    // Deal with the collision iff there is a collision now
    if (this.hasCollision(game.player)) {
        this.handleCollision(game.player);
        return;
    }

    // Pause the animation for some frames if the enemy was hit in a collision before
    if (this.isHit && this.pauseAnimationFrames-- <= 0) {
        game.stop();
    }

    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x += this.speed * dt;
    if (this.x > 505) {
       this.reset();
    }
};


/**
 * @description Player
 * @constructor
 * @param {string} sprite - The player's image
 * @param {number} index - The index number in players array, starting from one
 */
var Player = function(sprite, index) {
    this.runSprite = `images/char-${sprite}.png`;
    this.index = index;
};

inherit(Player, ImageEntity);

/**
 * @description Reset the attributes of the player, like position, image
 */
Player.prototype.reset = function() {
    this.sprite = this.runSprite;
    this.successSprite = 'images/star.png';
    this.x = 101 * this.index;
    this.y = 405;
    this.pauseAnimationFrames = 100;
    this.isSuccessful = false;
    this.isStopped = false;
}

/**
 * @description Stop the player's move
 */
Player.prototype.stop = function() {
    this.isStopped = true;
}

/**
 * @description Deal with the collision situation
 */
Player.prototype.handleCollision = function() {
    this.sprite = 'images/rock.png';
    this.stop();
}

/**
 * @description Update the player's position
 * @param {number} dt - A time delta between ticks
 */
Player.prototype.update = function(dt) {
    // If the player succeed, pause the animation for some frames
    if (this.isSuccessful && this.pauseAnimationFrames-- <= 0) {
        this.reset();
        game.collectibleItems.forEach(function(item) {
            item.reset();
        });
    }
};

/**
 * @description Judge if the player reaches the water
 */
Player.prototype.isInWater = function() {
    return this.y <= 0
}

/**
 * @description Set successful status and add score when the player succeeds
 */
Player.prototype.succeed = function() {
    this.isSuccessful = true;
    this.sprite = this.successSprite;
    game.addScore(5);
}

/**
 * @description Deal with the keyboard input to move the player
 * @param {string} keyCode
 */
Player.prototype.handleInput = function(keyCode) {
    // Don't move the player in some situations
    if (this.isSuccessful || this.isStopped) {
        return;
    }

    // Move the player according to that input
    if (keyCode == 'left') {
        this.x -= 101;
    } else if (keyCode == 'right') {
        this.x += 101;
    } else if (keyCode == 'up') {
        this.y -= 83;
    } else if (keyCode == 'down') {
        this.y += 83;
    } else {
        return;
    }

    // The player cannot move off screen
    if (this.x > 404) {
        this.x = 404;
    } else if (this.x < 0) {
        this.x = 0;
    }

    if (this.y > 405) {
        this.y = 405;
    } else if (this.y < -10) {
        this.y = -10;
    }

    // the player succeeds when the player reaches the water
    if (this.isInWater()) {
        this.succeed();
    }
}


/**
 * @description Item our player should collect
 * @constructor
 */
var CollectibleItem = function() {
};

inherit(CollectibleItem, ImageEntity);

/**
 * @description Reset the attributes of the collectible item, like position, image
 */
CollectibleItem.prototype.reset = function() {
    const yPositions = [-300, 73, 156, 239];
    const xPositions = [-300, -300, 0, 101, 202, 303, 404];
    const sprites = ['images/gem-blue.png', 'images/gem-green.png', 'images/gem-orange.png'];

    this.sprite = sprites[getRandomInt(3)];
    this.x = xPositions[getRandomInt(7)];
    this.y = yPositions[getRandomInt(4)];
    this.isCollected = false;
}

/**
 * @description Judge if the item has been collected by the player
 * @param {player} player
 * @returns {boolean}
 */
CollectibleItem.prototype.hasCollection = function(player) {
    return this.y == player.y && this.x == player.x;
}

/**
 * @description Deal with the collection situation, such as adding score
 */
CollectibleItem.prototype.handleCollection = function() {
    this.hide();
    this.isCollected = true;
    game.addScore(10);
}

/**
 * @description Hide the item
 */
CollectibleItem.prototype.hide = function() {
    this.x = -300;
    this.y = -300;
}

/**
 * @description Update the collectible item's position
 */
CollectibleItem.prototype.update = function() {
    if (this.hasCollection(game.player)) {
        this.handleCollection();
    }
};


/**
 * @description Panel with the score information
 * @constructor
 */
var ScorePanel = function() {
};

inherit(ScorePanel, TextEntity);

/**
 * @description Reset the attributes of the score panel, like position, font
 */
ScorePanel.prototype.reset = function() {
    this.font = '16px Georgia';
    this.setCurrentScore(game.score, game.leftTime);
    this.x = 330;
    this.y = 80;
}

/**
 * @description Set the current score of the player
 * @param {number} score
 * @param {number} time
 */
ScorePanel.prototype.setCurrentScore = function(score, time) {
    const minutes = zeroFill(Math.floor(time / 60), 2);
    const seconds = zeroFill(Math.floor(time % 60), 2);
    this.text = `Score: ${score}, Time: ${minutes}:${seconds}`
}


/**
 * @description panel with game message
 * @constructor
 */
var MessagePanel = function() {
    this.font = '25px Verdana';
    this.text = 'Game Over';
    this.x = 160;
    this.y = 256;
};

inherit(MessagePanel, TextEntity);


/**
 * @description Selector for players
 * @constructor
 */
var Selector = function() {
};

inherit(Selector, ImageEntity);

/**
 * @description Reset the attributes of the selector, like position, image
 */
Selector.prototype.reset = function() {
    this.sprite = 'images/selector.png';
    this.x = 202;
    this.y = 375;
}

/**
 * @description Find the selected player
 */
Selector.prototype.getPlayer = function() {
    let selector = this;
    return game.players.find(function(player) {
        return selector.x == player.x;
    });
}

/**
 * @description Deal with the keyboard input to select a player
 * @param {string} keyCode
 */
Selector.prototype.handleInput = function(keyCode) {
    if (keyCode == 'left') {
        this.x -= 101;
    } else if (keyCode == 'right') {
        this.x += 101;
    } else if (keyCode == 'space' || keyCode == 'enter') {
        game.start();
    } else {
        return;
    }

    if (this.x > 303) {
        this.x = 303;
    } else if (this.x < 101) {
        this.x = 101;
    }
}

/**
 * @description Game data, like player, enemies, score
 * @constructor
 */
var Game = function() {
    this.selector = new Selector();
    this.scorePanel = new ScorePanel();
    this.messagePanel = new MessagePanel();

    this.players = [new Player('boy', 1), new Player('cat-girl', 2), new Player('horn-girl', 3)];
    this.collectibleItems = [new CollectibleItem(), new CollectibleItem(), new CollectibleItem()];
    // Place all enemy objects in an array called allEnemies
    this.allEnemies = [new Enemy(), new Enemy(), new Enemy(), new Enemy()];
};

/**
 * @description Initialize the game, let the user select a player
 */
Game.prototype.initialize = function() {
    this.status = 'selecting';
    this.entities = this.players.concat([this.selector]);
    this.entities.forEach(function(entity) {
        entity.reset();
    });
}

/**
 * @description Start the game
 */
Game.prototype.start = function() {
    this.score = 0;
    this.leftTime = 60;

    this.player = this.selector.getPlayer();
    this.entities = this.collectibleItems.concat(this.allEnemies).concat([this.player, this.scorePanel]);
    this.entities.forEach(function(entity) {
        entity.reset();
    });

    let game = this;
    this.timerId = window.setInterval(function() {
        game.handleTimer();
    }, 1000);
    this.status = 'running';
}

/**
 * @description Display the message when the game is over
 */
Game.prototype.displayFinalMessage = function() {
    this.entities.push(this.messagePanel);
}

/**
 * @description Stop the game
 */
Game.prototype.stop = function() {
    this.status = 'stopped';
    this.allEnemies.forEach(function(enemy) {
        enemy.stop();
    });
    this.player.stop();
    window.clearInterval(this.timerId);
    this.displayFinalMessage();
}

/**
 * @description Update the positions of all entities
 */
Game.prototype.updateEntities = function(dt) {
    this.entities.forEach(function(entity) {
        entity.update(dt);
    })
}

/**
 * @description Draw all entities on the screen
 */
Game.prototype.renderEntities = function() {
    this.entities.forEach(function(entity) {
        entity.render();
    })
}

/**
 * @description Add score
 * @param {number} score
 */
Game.prototype.addScore = function(score) {
    this.score += score;
    this.scorePanel.setCurrentScore(this.score, this.leftTime);
}

/**
 * @description Deal with the event of the game timer
 */
Game.prototype.handleTimer = function() {
    this.leftTime--;
    this.scorePanel.setCurrentScore(this.score, this.leftTime);
    if (this.leftTime <= 0) {
        this.stop();
    }
}

/**
 * @description Deal with the keyboard input to restart the game
 * @param {string} keyCode
 */
Game.prototype.handleInput = function(keyCode) {
    if (keyCode == 'space' || keyCode == 'enter') {
        this.initialize();
    } else {
        return;
    }
}


var game = new Game();

game.initialize();

// This listens for key presses and sends the keys to your
// handleInput() method.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        13: 'enter',
        32: 'space',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    let listener = game;
    if (game.status == 'selecting') {
       listener = game.selector;
    } else if (game.status == 'running') {
        listener = game.player;
    }

    listener.handleInput(allowedKeys[e.keyCode]);
});
