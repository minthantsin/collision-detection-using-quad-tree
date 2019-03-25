class ball {
    constructor(x, y, r, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.isColided = false;
        this.velocityX = velocityX;          
        this.velocityY = velocityY;
    }
    intersects(other) {
        var changeX = this.x - other.x;
        var changeY = this.y - other.y;
        if (Math.sqrt(Math.pow(changeX, 2) + Math.pow(changeY, 2)) <= this.r + other.r) {
            return true;
        }
        return false;
    }
}
class AABB {
    constructor(x, y, halfLength) {
        this.x = x;
        this.y = y;
        this.halfLength = halfLength;
    }
    containsball(ball) {
        if ((ball.x + ball.r >= this.x - this.halfLength) &&
            (ball.x - ball.r <= this.x + this.halfLength) &&
            (ball.y + ball.r >= this.y - this.halfLength) &&
            (ball.y - ball.r <= this.y + this.halfLength)) {
            return true;
        }
        return false;
    }
    intersectsAABB(otherAABB) {
        if (Math.abs(this.x - otherAABB.x) < this.halfLength + otherAABB.halfLength &&
            Math.abs(this.y - otherAABB.y) < this.halfLength + otherAABB.halfLength) {
            return true;
        }
        return false;
    }
}
class QuadTree {
    constructor(boundaryAABB) {
        this.boundaryAABB = boundaryAABB;
        this.balls = [];

        this.nw = null;
        this.ne = null;
        this.sw = null;
        this.se = null;
    }
    insert(ball) {
        if (!this.boundaryAABB.containsball(ball)) {
            return false;
        }
        if (this.balls.length < QuadTree.size && this.nw == null) {
            this.balls.push(ball);
            return true;
        }
        if (this.nw == null) {
            this.subdivide();
        }
        if (this.nw.insert(ball)) { return true; };
        if (this.ne.insert(ball)) { return true; };
        if (this.sw.insert(ball)) { return true; };
        if (this.se.insert(ball)) { return true; };
        return false;
    }
    subdivide() {
        var quarterLength = this.boundaryAABB.halfLength / 2;
        this.nw = new QuadTree(new AABB(this.boundaryAABB.x - quarterLength,
                                this.boundaryAABB.y - quarterLength,quarterLength));
        this.ne = new QuadTree(new AABB(this.boundaryAABB.x + quarterLength,
                                this.boundaryAABB.y - quarterLength,quarterLength));
        this.sw = new QuadTree(new AABB(this.boundaryAABB.x - quarterLength,
                                this.boundaryAABB.y + quarterLength,quarterLength));
        this.se = new QuadTree(new AABB(this.boundaryAABB.x + quarterLength,
                                this.boundaryAABB.y + quarterLength,quarterLength));
    }
    queryRange(rangeAABB) {
        var foundballs = [];
        if (!this.boundaryAABB.intersectsAABB(rangeAABB)) {
            return foundballs;
        }
        for (let c of this.balls) {
            if (rangeAABB.containsball(c)) {
                foundballs.push(c);
            }
        }
        if (this.nw == null) {
            return foundballs;
        }
        Array.prototype.push.apply(foundballs, this.nw.queryRange(rangeAABB));
        Array.prototype.push.apply(foundballs, this.ne.queryRange(rangeAABB));
        Array.prototype.push.apply(foundballs, this.sw.queryRange(rangeAABB));
        Array.prototype.push.apply(foundballs, this.se.queryRange(rangeAABB));
        return foundballs;
    }
    draw(context, drawGrid) {
        if (drawGrid) {
            this.drawquadrants(context);
        }
        this.drawballs(context);
    }
    drawquadrants(context) {
        if (this.nw != null) {
            this.nw.drawquadrants(context);
            this.ne.drawquadrants(context);
            this.sw.drawquadrants(context);
            this.se.drawquadrants(context);
        } else {
            context.beginPath();
            context.rect(this.boundaryAABB.x - this.boundaryAABB.halfLength,
                         this.boundaryAABB.y - this.boundaryAABB.halfLength,
                         2 * this.boundaryAABB.halfLength, 2 * this.boundaryAABB.halfLength);
            context.lineWidth = 3;
            context.strokeStyle = 'black';
            context.closePath();
            context.stroke();
        }
    }
    drawballs(context) {
        if (this.nw != null) {
            this.nw.drawballs(context);
            this.ne.drawballs(context);
            this.sw.drawballs(context);
            this.se.drawballs(context);
        }
        for (let c of this.balls) {
            context.beginPath();
            context.arc(c.x, c.y, c.r, 0, 2 * Math.PI, false);
            if (c.isColided) {
                context.fillStyle = 'blue';
            } else {
                context.fillStyle = 'green';
            }
            context.fill();
            context.lineWidth = 0.1;
            if (c.isColided) {
                context.strokeStyle = 'blue';
            } else {
                context.strokeStyle = 'green';
            }
            context.closePath();
            context.stroke();
        }
    }
}
function iterate() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    let detections = 0;
    if (mouseIsDown) {
        let velocityX = Math.random() * (100 + 50) + -50;
        let velocityY = Math.random() * (100 + 50) + -50;
        let x = mouseX;
        let y = mouseY;
        let r = 10.0;
        if (x + r > canvas.width) {
            let change = (x + r) - canvas.width;
            x -= change;
        } else if (x - r < 0) {
            let change = Math.abs(x - r);
            x += change;
        }
        if (y + r > canvas.height) {
            let change = (y + r) - canvas.height;
            y -= change;
        } else if (y - r < 0) {
            let change = Math.abs(y - r);
            y += change;
        }
        balls.push(new ball(x, y, r, velocityX, velocityY));
    }
    let quadTree = new QuadTree(boundaryAABB);
    for (let c of balls) {
        c.isColided = false;
        quadTree.insert(c);
    }
    for (let c of balls) {
        let searchedAABB =  new AABB(c.x, c.y, c.r + 1);
        let foundballs = quadTree.queryRange(searchedAABB);
        for (let fb of foundballs) {
            if (c == fb) {
                continue;
            }
            detections++;
            if (c.intersects(fb)) {
                c.isColided = true;
                fb.isColided = true;
                break;  
            } 
        } 
    }
    quadTree.draw(context, drawGridCheckbox.checked);
    d = new Date();
    changeTimeS = (d.getTime() / 1000.0) - lastTimeS;
    lastTimeS = d.getTime() / 1000.0;
    for (let c of balls) {
        let nextX = c.x + c.velocityX * changeTimeS;
        let nextY = c.y - c.velocityY * changeTimeS;
        if (nextX - c.r <= 0 || nextX + c.r >= canvas.width) {
            c.velocityX *= -1;
            c.x += c.velocityX * changeTimeS;
        } else {
            c.x = nextX;
        }
        if (nextY - c.r <= 0 || nextY + c.r >= canvas.height) {
            c.velocityY *= -1;
            c.y -= c.velocityY * changeTimeS;
        } else {
            c.y = nextY;
        }
    }
    ballCounter.textContent = balls.length;
    detectionCounter.textContent = detections;
    bruteforceCounter.textContent = Math.pow(balls.length, 2);
    ratio.textContent=Math.round((Math.pow(balls.length, 2)-detections)/(detections))
}
QuadTree.size = 3;
var drawGridCheckbox = document.getElementById('checkbox');
drawGridCheckbox.checked = true;
var ballCounter = document.getElementById('ball');
var detectionCounter = document.getElementById('quadtree');
var bruteforceCounter = document.getElementById('bruteforce');
var ratio=document.getElementById('ratio');
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var canvasDimension = canvas.height;
var balls = [];
var d = new Date();
var lastTimeS = d.getTime() / 1000.0;
var changeTimeS = 0;
var mouseIsDown = false;
var mouseX = 0;
var mouseY = 0;
var halfLength = canvasDimension / 2;
var boundaryAABB = new AABB(halfLength, halfLength, halfLength);
canvas.onmousedown = function(e){
    mouseIsDown = true;
}
canvas.onmouseup = function(e){
    mouseIsDown = false;
}
canvas.addEventListener('mousemove', function(evt) {
    var rect = canvas.getBoundingClientRect();
    mouseX = evt.clientX - rect.left;
    mouseY = evt.clientY - rect.top;
    }, false
);
setInterval(iterate, 10);

