$(document).ready(function() {
    var mapData = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    var canvas = document.getElementById('canv');
    
    if (canvas.getContext) {
        var context = canvas.getContext("2d");
    }
    
    var player;
    var map;

    var options = {
        scale: 48,
        screenWidth: 320,
        stripWidth: 2,
        rayCount: 120
    };

    var fov = 70 * (Math.PI / 180);
    var numRays = Math.ceil(options.screenWidth / options.stripWidth), viewDistance = (options.screenWidth / 2) / Math.tan((fov / 2));

    window.onload = function init() {
        map = new Map(mapData);

        player = new Player();
        canvas.width = map.width * options.scale;
        canvas.height = map.height * options.scale;
        
        window.requestAnimFrame(mainLoop);
    };

    function mainLoop() {
        context.fillStyle = "black";
        context.fillRect(0, 0, canvas.width, canvas.height);
        player.update();

        map.draw();
        player.draw();
        raycaster.castAll();

        window.requestAnimFrame(mainLoop);
    };

    document.onkeydown = function(e) {
        e = e || window.event;

        switch (e.keyCode) {
            case 38:
                player.speed = 1;
                break;
            case 40:
                player.speed = -1;
                break;
            case 37:
                player.turnDirection = -1;
                break;
            case 39:
                player.turnDirection = 1;
                break;
        }
    }

    document.onkeyup = function(e) {
        e = e || window.event;

        switch (e.keyCode) {
            case 38:
                player.speed = 0;
                break;
            case 40:
                player.speed = 0;
                break;
            case 37:
                player.turnDirection = 0;
                break;
            case 39:
                player.turnDirection = 0;
                break;
        }
    }
        
    function Player() {
        this.position = [4.4, 1.4];
        this.turnDirection = 0;
        this.rotation = 0.73;
        this.speed = 0;
        this.moveSpeed = 0.05;
        this.rotationSpeed = 2 * (Math.PI * 2) / 180;
    }

    Player.prototype = {
        update: function() {
            var step = this.speed * this.moveSpeed;
            var x, y;

            this.rotation += this.turnDirection * this.rotationSpeed;
            this.rotation = normalizeAngle(this.rotation);

            x = this.position[0] + (Math.cos(this.rotation) * step);
            y = this.position[1] + (Math.sin(this.rotation) * step);

            if (!map.isPassableAt(x, y))
                return;

            this.position[0] = x;
            this.position[1] = y;
        },
        draw: function drawPlayer() {
            context.fillStyle = "white";
            context.beginPath();
            context.arc(this.position[0] * options.scale, this.position[1] * options.scale, 2, 0, (Math.PI * 2));
            context.fill();
        }
    };

    function Map(map) {
        this.map = map;
        this.height = map.length;
        this.width = map[0].length;
    }

    Map.prototype = {
        isPassableAt: function isPassableAt(x, y) {
            return this.isInScope(x, y) && this.hasSpaceAt(x, y);
        },
        hasSpaceAt: function hasSpaceAt(x, y) {
            return this.map[Math.floor(y)][Math.floor(x)] == 0;
        },
        isInScope: function(x, y) {
            return !(x < 0 || y < 0 || y > this.height || x > this.width);
        },
        draw: function() {
            context.fillStyle = "#fff";

            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    if (this.map[y][x] != 0) {
                        context.fillRect(
                            x * options.scale,
                            y * options.scale,
                            options.scale,
                            options.scale
                        );
                    }
                }
            }
        }
    };
    
    raycaster = {
        castAll: function castAll() {
            var strip = 0;
            for (var i = 0; i < options.rayCount; i++) {
                var rayPosition = (-options.rayCount / 2 + i) * options.stripWidth;
                var rayViewDist = pythagoras(rayPosition, viewDistance);
                var rayAngle = Math.asin(rayPosition / rayViewDist);
                this.cast(player.rotation + rayAngle, strip++);
            };
        },
        cast: function(_angle, strip) {
            var angle = normalizeAngle(_angle);
            var right = (angle > (Math.PI * 2) * 0.75 || angle < (Math.PI * 2) * 0.25), up = (angle < 0 || angle > Math.PI);
            var angleSin = Math.sin(angle), angleCos = Math.cos(angle);
            var distanceVertical = 0, distanceHorizontal = 0;
            var distance;
            var hit = [0, 0];
            var texture = [0, 0];
            var wall = [0, 0];

            var slope = angleSin / angleCos;
            var _x = right ? 1 : -1;
            var _y = _x * slope;

            var x = right ? Math.ceil(player.position[0]) : Math.floor(player.position[0]);
            var y = player.position[1] + (x - player.position[0]) * slope;

            while (x >= 0 && map.width && y > 0 && y < map.height) {
                if (!map.hasSpaceAt(x + (right ? 0 : -1), y)) {
                    distance = distanceVertical = pythagorasSquared(
                        x - player.position[0],
                        y - player.position[1]
                    );
                    
                    hit = [x, y];
                    break;
                }

                x += _x;
                y += _y;
            }

            slope = angleCos / angleSin;
            _y = up ? -1 : 1;
            _x = _y * slope;
            y = up ? Math.floor(player.position[1]) : Math.ceil(player.position[1]);
            x = player.position[0] + (y - player.position[1]) * slope;

            while (x >= 0 && x < map.width && y >= 0 && y < map.height) {
                if (!map.hasSpaceAt(x, y + (up ? -1 : 0))) {
                    distanceHorizontal = pythagorasSquared(
                        x - player.position[0],
                        y - player.position[1]
                    );

                    if (!distanceVertical || distanceHorizontal < distanceVertical) {
                        distance = distanceHorizontal;
                        hit = [x, y];

                        texture[0] = x % 1;
                        
                        if (up)
                            texture[0] = 1 - texture[0];
                    }

                    break;
                }

                x += _x;
                y += _y;
            }

            if (distance)
                this.draw(hit);
        },
        draw: function(ray) {
            context.strokeStyle = "rgba(255, 0, 0, 0.3)";
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(player.position[0] * options.scale, player.position[1] * options.scale);
            context.lineTo(
                ray[0] * options.scale,
                ray[1] * options.scale
            );
            context.closePath();
            context.stroke();
        }
    }
    
    function normalizeAngle(angle) {
        angle %= (Math.PI * 2);
        if (angle < 0)
            angle += (Math.PI * 2);
        return angle;
    }

    function pythagorasSquared(a, b) {
        return (a * a) + (b * b);
    }

    function pythagoras(a, b) {
        return Math.sqrt(pythagorasSquared(a, b));
    }

    window.requestAnimFrame = function() {
        return window.requestAnimationFrame    ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(a) {
                window.setTimeout(a, 1000/60)
            }
    }();
});