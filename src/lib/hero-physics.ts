// @ts-nocheck
window.onload = function () {
    var heroSvg = document.querySelector(".hero-circles svg");
    heroSvg.style.cursor = "grab";

    // Center circles in viewport
    var centerX = window.innerWidth / 2;
    var centerY = window.innerHeight / 2;

    var RADIUS = 130;
    var STROKE_RADIUS = RADIUS * 2;
    var CENTER_OFFSET = RADIUS * 1.15;

    var circles = [
        { x: centerX - CENTER_OFFSET, y: centerY, vx: 0, vy: 0 },
        { x: centerX + CENTER_OFFSET, y: centerY, vx: 0, vy: 0 },
    ];

    var originalPositions = [
        { x: centerX - CENTER_OFFSET, y: centerY },
        { x: centerX + CENTER_OFFSET, y: centerY },
    ];

    var dragging = null;
    var isSpringing = false;
    var isVennDiagram = false;
    var confettiFired = false;
    window.vennState = "IDLE";

    // Prevent overlap only when no velocity
    function preventOverlap() {
        if (isSpringing) return; // Allow overlap during spring

        var dx = circles[1].x - circles[0].x;
        var dy = circles[1].y - circles[0].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var minDist = STROKE_RADIUS;

        if (dist < minDist && dist > 0) {
            var overlap = (minDist - dist) / 2;
            var nx = dx / dist;
            var ny = dy / dist;

            circles[0].x -= nx * overlap;
            circles[0].y -= ny * overlap;
            circles[1].x += nx * overlap;
            circles[1].y += ny * overlap;
        }
    }

    function enableVennDiagram() {
        if (isVennDiagram) return;

        var dx = circles[1].x - circles[0].x;
        var dy = circles[1].y - circles[0].y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= RADIUS * 7) return;

        isVennDiagram = true;
        window.vennState = "HIT";
        window.dispatchEvent(
            new CustomEvent("vennStateChange", { detail: "HIT" }),
        );

        var centerX = window.innerWidth / 2;
        var centerY = window.innerHeight / 2;
        var vennOffset = RADIUS * 0.5;
        circles[0].x = centerX - vennOffset;
        circles[0].y = centerY;
        circles[1].x = centerX + vennOffset;
        circles[1].y = centerY;
        originalPositions[0].x = centerX - vennOffset;
        originalPositions[0].y = centerY;
        originalPositions[1].x = centerX + vennOffset;
        originalPositions[1].y = centerY;

        if (!confettiFired) {
            confettiFired = true;
            if (typeof confetti === "function") {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                });
            }
        }

        render();
    }

    function getRoughPaths() {
        var generator = rough.generator();
        var paths = "";
        var r = RADIUS;
        var strokeR = STROKE_RADIUS;

        var stroke1 = generator.circle(circles[0].x, circles[0].y, strokeR, {
            stroke: "#333",
            strokeWidth: 2,
            fill: "none",
        });
        var stroke2 = generator.circle(circles[1].x, circles[1].y, strokeR, {
            stroke: "#333",
            strokeWidth: 2,
            fill: "none",
        });

        [stroke1, stroke2].forEach(function (drawable) {
            generator.toPaths(drawable).forEach(function (path) {
                paths +=
                    '<path d="' +
                    path.d +
                    '" fill="none" stroke="' +
                    path.stroke +
                    '" stroke-width="' +
                    path.strokeWidth +
                    '" />';
            });
        });

        var midX = (circles[0].x + circles[1].x) / 2;
        var midY = (circles[0].y + circles[1].y) / 2;
        var dx = circles[1].x - circles[0].x;
        var dy = circles[1].y - circles[0].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var baseOffset = 30;
        var lineOffset = baseOffset + (dist - 200) * 0.5;
        var lineWidth = Math.max(1, 4 - (dist - 200) * 0.02);
        var arrowSize = 14;

        if (dist > 0) {
            var line = generator.line(
                midX - (dx / dist) * lineOffset,
                midY - (dy / dist) * lineOffset,
                midX + (dx / dist) * lineOffset,
                midY + (dy / dist) * lineOffset,
                { stroke: "#333", strokeWidth: lineWidth },
            );
            generator.toPaths(line).forEach(function (path) {
                paths +=
                    '<path d="' +
                    path.d +
                    '" fill="none" stroke="' +
                    path.stroke +
                    '" stroke-width="' +
                    path.strokeWidth +
                    '" />';
            });

            var angle = Math.atan2(dy, dx);
            var arrow1X = midX + (dx / dist) * lineOffset;
            var arrow1Y = midY + (dy / dist) * lineOffset;
            paths +=
                '<polygon points="' +
                (arrow1X + Math.cos(angle) * arrowSize) +
                "," +
                (arrow1Y + Math.sin(angle) * arrowSize) +
                " " +
                (arrow1X + Math.cos(angle + 2.5) * arrowSize) +
                "," +
                (arrow1Y + Math.sin(angle + 2.5) * arrowSize) +
                " " +
                (arrow1X + Math.cos(angle - 2.5) * arrowSize) +
                "," +
                (arrow1Y + Math.sin(angle - 2.5) * arrowSize) +
                '" fill="#333" />';

            var arrow2X = midX - (dx / dist) * lineOffset;
            var arrow2Y = midY - (dy / dist) * lineOffset;
            paths +=
                '<polygon points="' +
                (arrow2X + Math.cos(angle + Math.PI) * arrowSize) +
                "," +
                (arrow2Y + Math.sin(angle + Math.PI) * arrowSize) +
                " " +
                (arrow2X + Math.cos(angle + Math.PI + 2.5) * arrowSize) +
                "," +
                (arrow2Y + Math.sin(angle + Math.PI + 2.5) * arrowSize) +
                " " +
                (arrow2X + Math.cos(angle + Math.PI - 2.5) * arrowSize) +
                "," +
                (arrow2Y + Math.sin(angle + Math.PI - 2.5) * arrowSize) +
                '" fill="#333" />';
        }

        return paths;
    }

    function render() {
        var paths = "";
        var r = RADIUS;

        paths +=
            '<circle cx="' +
            circles[0].x +
            '" cy="' +
            circles[0].y +
            '" r="' +
            r +
            '" fill="#FFB3BA" fill-opacity="0.5" />';
        paths +=
            '<circle cx="' +
            circles[1].x +
            '" cy="' +
            circles[1].y +
            '" r="' +
            r +
            '" fill="#BAE1FF" fill-opacity="0.5" />';
        paths += getRoughPaths();

        heroSvg.innerHTML = paths;
    }

    heroSvg.addEventListener("mousedown", function (e) {
        e.preventDefault();
        var rect = heroSvg.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        for (var i = 0; i < 2; i++) {
            var dx = mx - circles[i].x;
            var dy = my - circles[i].y;
            var hitR = RADIUS;
            if (Math.sqrt(dx * dx + dy * dy) < hitR) {
                dragging = i;
                isSpringing = false;
                heroSvg.style.cursor = "grabbing";
                break;
            }
        }
    });

    document.addEventListener("mousemove", function (e) {
        if (dragging !== null) {
            var rect = heroSvg.getBoundingClientRect();
            circles[dragging].x = e.clientX - rect.left;
            circles[dragging].y = e.clientY - rect.top;
            circles[dragging].vx = 0;
            circles[dragging].vy = 0;

            var other = dragging === 0 ? 1 : 0;
            var dx = circles[dragging].x - originalPositions[dragging].x;
            var dy = circles[dragging].y - originalPositions[dragging].y;
            circles[other].x = originalPositions[other].x - dx;
            circles[other].y = originalPositions[other].y - dy;
            circles[other].vx = 0;
            circles[other].vy = 0;

            preventOverlap();
            render();
        }
    });

    document.addEventListener("mouseup", function () {
        if (dragging !== null) {
            heroSvg.style.cursor = "grab";
            enableVennDiagram();
            isSpringing = true;
            dragging = null;
            springPhysics(); // Start spring physics loop
        }
    });

    // Spring physics loop
    function springPhysics() {
        if (isSpringing) {
            var allStopped = true;

            for (var i = 0; i < 2; i++) {
                var target = originalPositions[i];

                var dx = target.x - circles[i].x;
                var dy = target.y - circles[i].y;
                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0.5) {
                    allStopped = false;

                    // Spring force - stronger when further away
                    var springK = 0.08 + dist * 0.0005; // Increase spring constant with distance
                    var ax = dx * springK;
                    var ay = dy * springK;

                    circles[i].vx += ax;
                    circles[i].vy += ay;
                }

                // Damping
                circles[i].vx *= 0.88;
                circles[i].vy *= 0.88;

                circles[i].x += circles[i].vx;
                circles[i].y += circles[i].vy;
            }

            preventOverlap();
            render();

            if (!allStopped) {
                requestAnimationFrame(springPhysics);
            } else {
                isSpringing = false;
            }
        }
    }

    render();
};
