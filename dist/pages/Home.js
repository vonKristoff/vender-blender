import { html } from 'hono/html';
export const heroPhysicsScript = () => html `
  // @ts-nocheck
  window.onload = function () {
    var heroSvg = document.querySelector(".hero-circles svg");
    heroSvg.style.cursor = "grab";

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

    function preventOverlap() {
        if (isSpringing) return;

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
        
        if (dist <= RADIUS) return;
        
        isVennDiagram = true;
        window.vennState = "HIT";
        window.dispatchEvent(new CustomEvent("vennStateChange", { detail: "HIT" }));

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
            springPhysics();
        }
    });

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

                    var springK = 0.08 + dist * 0.0005;
                    var ax = dx * springK;
                    var ay = dy * springK;

                    circles[i].vx += ax;
                    circles[i].vy += ay;
                }

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
`;
export const messageScript = () => html `
  <script>
    var el = document.getElementById('hero-message');
    var messages = {
      "IDLE": { text: "go on, i know you want to", cls: "" },
      "HIT": { text: "a true venn-dictated individual", cls: "hit" },
      "MISS": { text: "try a bit harder", cls: "miss" }
    };
    var lastState = "";
    var hasDragged = false;
    function checkState() {
      var state = window.vennState || "IDLE";
      if (state !== lastState) {
        lastState = state;
        hasDragged = false;
        if (el) {
          el.textContent = messages[state].text;
          el.className = "hero-message " + messages[state].cls;
        }
        if (state === "MISS") {
          setTimeout(function() {
            if (window.vennState === "MISS") {
              window.vennState = "IDLE";
            }
          }, 1500);
        }
      }
    }
    function init() {
      checkState();
      setInterval(checkState, 100);
      window.addEventListener("mousedown", function() {
        hasDragged = true;
      });
      window.addEventListener("mouseup", function() {
        if (window.vennState === "IDLE" && hasDragged) {
          window.vennState = "MISS";
        }
      });
    }
    if (document.readyState === "complete") {
      init();
    } else {
      window.addEventListener("load", init);
    }
  </script>
`;
export const HomePage = () => html `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VENDER-BLENDER - Venn Diagram API</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'PermanentMarker', sans-serif; background: #fafafa; color: #333; line-height: 1.6; }
      .hero { 
        height: 100vh; 
        min-height: 600px;
        background: linear-gradient(135deg, #FFB3BA 0%, #BAFFC9 50%, #BAE1FF 100%); 
        display: flex; 
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .hero-circles { position: relative; width: 100%; height: 100%; cursor: grab; }
      .hero-circles:active { cursor: grabbing; }
      .hero-circle { cursor: grab; }
      .hero svg { position: absolute; top: 0; left: 0; }
      .hero h1 { font-size: 4rem; color: #222; margin-bottom: 10px; }
      .hero p { font-size: 1.5rem; color: #444; }
      .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
      h2 { font-size: 2rem; margin: 40px 0 20px; color: #222; border-bottom: 3px solid #FFB3BA; padding-bottom: 10px; }
      h3 { font-size: 1.5rem; margin: 30px 0 15px; color: #333; }
      code { background: #eee; padding: 2px 8px; border-radius: 4px; font-size: 0.95em; }
      pre { background: #2d2d2d; color: #f8f8f2; padding: 20px; border-radius: 8px; overflow-x: auto; margin: 15px 0; font-size: 0.9em; }
      .example { background: white; border-radius: 12px; padding: 25px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
      .example-label { font-size: 1.1rem; color: #666; margin-bottom: 10px; }
      .endpoint { background: #e8f4fd; padding: 15px 20px; border-radius: 8px; margin: 10px 0; font-size: 1.2rem; }
      ul { padding-left: 25px; }
      li { margin: 10px 0; }
      footer { text-align: center; padding: 40px; color: #888; font-size: 1rem; }
      .scroll-hint { position: absolute; bottom: 30px; font-size: 1.2rem; color: #555; }
      .hero-message {
        font-size: 1.8rem; 
        color: #333; 
        margin-top: 20px;
        text-align: center;
        transition: opacity 0.3s ease, transform 0.3s ease, color 0.3s ease;
      }
      .hero-message.hit { color: #2a7; }
      .hero-message.miss { color: #e55; }
    </style>
  </head>
  <body>
    <div class="hero">
      <div class="hero-circles">
        <svg id="hero-svg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"></svg>
      </div>
      <p class="hero-message" id="hero-message">go on, i know you want to</p>
      <h1 style="margin-top: 30px; font-size: 3rem; color: #222;">VENDER-BLENDER</h1>
      <p style="font-size: 1.3rem; color: #444;">Generate sketchy venn diagrams from simple URL params</p>
      <div class="scroll-hint">↓ scroll to start</div>
    </div>

    <div class="container">
      <h2>Quick Start</h2>
      <div class="example">
        <div class="example-label">Two circles:</div>
        <div class="endpoint">/svg/A.B</div>
        <iframe src="/svg/A.B" style="border: none; width: 400px; height: 400px; background: white; border-radius: 8px;"></iframe>
      </div>

      <h2>API Endpoints</h2>
      <div class="endpoint">/svg/&lt;sets&gt;</div>
      <div class="endpoint">/png/&lt;sets&gt;</div>
      <div class="endpoint">/img-svg/&lt;sets&gt; (for img tags)</div>

      <h2>Syntax</h2>
      <ul>
        <li><code>Title</code> - Circle label (use <code>-</code> for spaces: <code>MY-TITLE</code>)</li>
        <li><code>.</code> - Separate sets within a diagram (1-3 sets per diagram)</li>
        <li><code>~label~</code> - Intersection label between circles</li>
        <li><code>_label_</code> - Universal set (super intersection)</li>
        <li><code>/</code> - Separate multiple diagrams</li>
      </ul>

      <h2>Examples</h2>

      <h3>Single Set</h3>
      <div class="example">
        <div class="example-label">One circle:</div>
        <div class="endpoint">/svg/MY-SET</div>
        <iframe src="/svg/MY-SET" style="border: none; width: 400px; height: 400px; background: white; border-radius: 8px;"></iframe>
      </div>

      <h3>Two Sets</h3>
      <div class="example">
        <div class="example-label">Two circles:</div>
        <div class="endpoint">/svg/APPLES.ORANGES</div>
        <iframe src="/svg/APPLES.ORANGES" style="border: none; width: 400px; height: 400px; background: white; border-radius: 8px;"></iframe>
      </div>

      <h3>Two Sets + Intersection</h3>
      <div class="example">
        <div class="example-label">With intersection label:</div>
        <div class="endpoint">/svg/FRUIT.~SWEET-SOUR~.YUM</div>
        <iframe src="/svg/FRUIT.~SWEET-SOUR~.YUM" style="border: none; width: 400px; height: 400px; background: white; border-radius: 8px;"></iframe>
      </div>

      <h3>Three Sets + Intersections + Universal</h3>
      <div class="example">
        <div class="example-label">Complex diagram:</div>
        <div class="endpoint">/svg/A.~AB~.B.~BC~.C.~CA~._ALL_</div>
        <iframe src="/svg/A.~AB~.B.~BC~.C.~CA~._ALL_" style="border: none; width: 400px; height: 400px; background: white; border-radius: 8px;"></iframe>
      </div>

      <h3>Multiple Diagrams</h3>
      <div class="example">
        <div class="example-label">Separate diagrams with /:</div>
        <div class="endpoint">/svg/A.B/C.D</div>
        <iframe src="/svg/A.B/C.D" style="border: none; width: 820px; height: 400px; background: white; border-radius: 8px;"></iframe>
      </div>

      <h2>Fun Examples</h2>

      <h3>The Classic Meme</h3>
      <div class="example">
        <div class="example-label">Easter Bunny + Santa Claus + Tooth Fairy:</div>
        <div class="endpoint">/svg/EASTER-BUNNY.~BELIEF~.SANTA-CLAUS.TOOTH-FAIRY</div>
        <iframe src="/svg/EASTER-BUNNY.~BELIEF~.SANTA-CLAUS.TOOTH-FAIRY" style="border: none; width: 820px; height: 400px; background: white; border-radius: 8px;"></iframe>
      </div>

      <h3>The Job Search</h3>
      <div class="example">
        <div class="example-label">What you think the job needs + What it actually needs + What you're good at:</div>
        <div class="endpoint">/svg/JOB-TITLE.~REALITY~.SKILLS.PASSION</div>
        <iframe src="/svg/JOB-TITLE.~REALITY~.SKILLS.PASSION" style="border: none; width: 820px; height: 400px; background: white; border-radius: 8px;"></iframe>
      </div>

      <h3>Tech Support</h3>
      <div class="example">
        <div class="example-label">When it works + How you fixed it = The truth:</div>
        <div class="endpoint">/svg/TURNOFF.~MAGIC~.TURNON-AGAIN</div>
        <iframe src="/svg/TURNOFF.~MAGIC~.TURNON-AGAIN" style="border: none; width: 400px; height: 400px; background: white; border-radius: 8px;"></iframe>
      </div>

      <h2>Embedding</h2>
      <h3>SVG (direct embed)</h3>
      <pre>&lt;iframe src="/svg/YOUR-SETS"&gt;&lt;/iframe&gt;</pre>

      <h3>PNG (img tag)</h3>
      <pre>&lt;img src="/png/YOUR-SETS" /&gt;</pre>

      <h3>SVG (img tag)</h3>
      <pre>&lt;img src="/img-svg/YOUR-SETS" /&gt;</pre>

      <footer>
        <p>VENDER-BLENDER - Sketchy Venn Diagrams API</p>
      </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@hiseb/confetti@2.1.0/dist/confetti.min.js"></script>
    <script src="https://unpkg.com/roughjs@4.6.6/bundled/rough.js"></script>
    <script src="/hero-physics.js"></script>
    ${messageScript()}
  </body>
  </html>
`;
