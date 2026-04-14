import { Hono } from "hono";
import sharp from "sharp";
import rough from "roughjs";
import { roughVennDiagram } from "./lib/venn";

const heroPhysicsContent = `window.onload = function () {
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
        if (dist <= RADIUS * 7) return;
        isVennDiagram = true;
        window.vennState = "HIT";
        window.dispatchEvent(new CustomEvent("vennStateChange", { detail: "HIT" }));
        var centerX = window.innerWidth / 2;
        var centerY = window.innerHeight / 2;
        var vennOffset = RADIUS * 0.5;
        originalPositions[0].x = centerX - vennOffset;
        originalPositions[0].y = centerY;
        originalPositions[1].x = centerX + vennOffset;
        originalPositions[1].y = centerY;
        if (!confettiFired) {
            confettiFired = true;
            if (typeof confetti === "function") {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            }
        }
        render();
    }
    function getRoughPaths() {
        var generator = rough.generator();
        var paths = "";
        var stroke1 = generator.circle(circles[0].x, circles[0].y, STROKE_RADIUS, { stroke: "#333", strokeWidth: 2, fill: "none" });
        var stroke2 = generator.circle(circles[1].x, circles[1].y, STROKE_RADIUS, { stroke: "#333", strokeWidth: 2, fill: "none" });
        [stroke1, stroke2].forEach(function (drawable) {
            generator.toPaths(drawable).forEach(function (path) {
                paths += '<path d="' + path.d + '" fill="none" stroke="' + path.stroke + '" stroke-width="' + path.strokeWidth + '" />';
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
                { stroke: "#333", strokeWidth: lineWidth }
            );
            generator.toPaths(line).forEach(function (path) {
                paths += '<path d="' + path.d + '" fill="none" stroke="' + path.stroke + '" stroke-width="' + path.strokeWidth + '" />';
            });
            var angle = Math.atan2(dy, dx);
            var arrow1X = midX + (dx / dist) * lineOffset;
            var arrow1Y = midY + (dy / dist) * lineOffset;
            paths += '<polygon points="' + (arrow1X + Math.cos(angle) * arrowSize) + "," + (arrow1Y + Math.sin(angle) * arrowSize) + " " + (arrow1X + Math.cos(angle + 2.5) * arrowSize) + "," + (arrow1Y + Math.sin(angle + 2.5) * arrowSize) + " " + (arrow1X + Math.cos(angle - 2.5) * arrowSize) + "," + (arrow1Y + Math.sin(angle - 2.5) * arrowSize) + '" fill="#333" />';
            var arrow2X = midX - (dx / dist) * lineOffset;
            var arrow2Y = midY - (dy / dist) * lineOffset;
            paths += '<polygon points="' + (arrow2X + Math.cos(angle + Math.PI) * arrowSize) + "," + (arrow2Y + Math.sin(angle + Math.PI) * arrowSize) + " " + (arrow2X + Math.cos(angle + Math.PI + 2.5) * arrowSize) + "," + (arrow2Y + Math.sin(angle + Math.PI + 2.5) * arrowSize) + " " + (arrow2X + Math.cos(angle + Math.PI - 2.5) * arrowSize) + "," + (arrow2Y + Math.sin(angle + Math.PI - 2.5) * arrowSize) + '" fill="#333" />';
        }
        return paths;
    }
    function render() {
        var paths = "";
        paths += '<circle cx="' + circles[0].x + '" cy="' + circles[0].y + '" r="' + RADIUS + '" fill="#FFB3BA" fill-opacity="0.5" />';
        paths += '<circle cx="' + circles[1].x + '" cy="' + circles[1].y + '" r="' + RADIUS + '" fill="#BAE1FF" fill-opacity="0.5" />';
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
            if (Math.sqrt(dx * dx + dy * dy) < RADIUS) {
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
};`;

const app = new Hono();

function getHeroCircles(): string {
  const generator = rough.generator();

  let paths = "";

  paths += `<circle cx="150" cy="200" r="90" fill="#FFB3BA" fill-opacity="0.5" />`;
  paths += `<circle cx="350" cy="200" r="90" fill="#BAE1FF" fill-opacity="0.5" />`;

  const stroke1 = generator.circle(150, 200, 180, {
    stroke: "#333",
    strokeWidth: 2,
    fill: "none",
  });
  const stroke2 = generator.circle(350, 200, 180, {
    stroke: "#333",
    strokeWidth: 2,
    fill: "none",
  });
  const arrowLine = generator.line(210, 200, 290, 200, {
    stroke: "#333",
    strokeWidth: 4,
  });

  [stroke1, stroke2].forEach((drawable) => {
    generator.toPaths(drawable).forEach((path: any) => {
      paths += `<path d="${path.d}" fill="none" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" />`;
    });
  });
  generator.toPaths(arrowLine).forEach((path: any) => {
    paths += `<path d="${path.d}" fill="none" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" />`;
  });

  paths += `<polygon points="290,193 282,200 290,207" fill="#333" />`;
  paths += `<polygon points="210,193 218,200 210,207" fill="#333" />`;

  return paths;
}

const heroSvgPaths = getHeroCircles();

interface ParsedDiagram {
  titles: string[];
  intersections: { label: string; set1: number; set2: number }[];
  universalSet?: string;
}

function parseDiagram(instance: string): ParsedDiagram | null {
  const parts = instance.split(".");
  const titles: string[] = [];
  const intersections: { label: string; set1: number; set2: number }[] = [];
  let universalSet: string | undefined;

  parts.forEach((part) => {
    if (part.startsWith("_") && part.endsWith("_")) {
      universalSet = part.slice(1, -1);
    } else if (part.startsWith("~") && part.endsWith("~")) {
      const set1 = titles.length - 1;
      intersections.push({
        label: part.slice(1, -1),
        set1,
        set2: set1 + 1,
      });
    } else {
      titles.push(part);
    }
  });

  intersections.forEach((inter) => {
    inter.set2 = inter.set2 % titles.length;
  });

  if (titles.length < 1 || titles.length > 3) {
    return null;
  }

  return { titles, intersections, universalSet };
}

app.get("/", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VENDER-BLENDER - Venn Diagram API</title>
  <!-- HTML Meta Tags -->
<meta name="description" content="AUTO GENERATE ON THE FLY VENN DIAGRAMS - USING API">

<!-- Facebook Meta Tags -->
<meta property="og:url" content="https://venn.threejjjs.xyz/">
<meta property="og:type" content="website">
<meta property="og:title" content="VENDER-BLENDER - Venn Diagram API">
<meta property="og:description" content="Generate your own Venn Diagram MEME immediately using this API">
<meta property="og:image" content="https://threejjjs.xyz/thumbs/VENN.jpg">

<!-- Twitter Meta Tags -->
<meta name="twitter:card" content="summary_large_image">
<meta property="twitter:domain" content="venn.threejjjs.xyz">
<meta property="twitter:url" content="https://venn.threejjjs.xyz/">
<meta name="twitter:title" content="VENDER-BLENDER - Venn Diagram API">
<meta name="twitter:description" content="Generate your own Venn Diagram MEME immediately using this API">
<meta name="twitter:image" content="https://threejjjs.xyz/thumbs/VENN.jpg">

<!-- Meta Tags Generated via https://www.opengraph.xyz -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Permanent+Marker&family=Trispace:wght@100..800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; line-height: normal; }
    body { font-family: 'PermanentMarker', sans-serif; background: hotpink; color: #333; line-height: 1.6; }
    .hero {
      height: 97vh;
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
    footer { text-align: center; padding: 40px; color: #222; font-size: 1.5rem; }
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
    .top {
    position:absolute;
    height: 100vh;

      display: flex;
      flex-direction: column;
      justify-content: space-between;
padding: 4em 0;
    }
    .inline-link {
      color: inherit;
    }
    p, div {
      font-size: 1.2em;
      font-family: "Permanent Marker", cursive;
    }
    .permanent-marker-regular {
      font-weight: 400;
      font-style: normal;
    }
    h1,h2,h3,h4,
    .archivo-black-regular {
      font-family: "Archivo Black", sans-serif;
      font-weight: 400;
      font-style: normal;
    }
    li {
      font-family: "Trispace", sans-serif;
      font-optical-sizing: auto;
      font-weight: 500;
      font-style: normal;
      font-variation-settings:
        "wdth" 100;
    }
    .card h3 {

    color: #222;

    }
    .example-label {
    font-size: 1.2em;
    color: cornflowerblue;
    }
    h2,h3, h4{
    color: aquamarine;

    }
    footer {
      display:flex;
      @media (max-width: 768px) {
        flex-direction: column;
      }
      justify-content: space-between;
      align-items:center;
    }
      aside {
      width: 20%;
      @media (max-width: 768px) {
        width:100%;
      }
      font-family: "Trispace", sans-serif;
      line-height: 0;
      }
      .text-xs {
      font-size: .6em;
      }
  </style>
</head>
<body>
  <div class="hero">
    <div class="top">
    <p style="font-family: Trispace; padding:0 2em; font-size: 1.3em; color: #444;">Generate sketchy <strong>Venn diagrams</strong> from simple URL params</p>
    <div>
    <p class="hero-message" id="hero-message"></p>
    <h1 class="archivo-black-regular" style="font-size: 4rem; color: #222; text-align: center;">VENDER-BLENDER</h1>
    </div>

    </div>
    <div class="hero-circles">
      <svg id="hero-svg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"></svg>
    </div>
    <button onclick="document.getElementById('try').scrollIntoView({behavior: 'smooth'})"
      style="position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
             padding: 12px 24px; font-size: 1.2rem; background: white; border: 3px solid #333;
             border-radius: 30px; cursor: pointer; font-family: 'Trispace';
             box-shadow: 4px 4px 0 #333; transition: transform 0.1s, box-shadow 0.1s;"
      onmouseover="this.style.transform='translateX(-50%) translateY(-2px)'; this.style.boxShadow='6px 6px 0 #333'"
      onmouseout="this.style.transform='translateX(-50%)'; this.style.boxShadow='4px 4px 0 #333'">
      Try it out!
    </button>
  </div>

  <div class="container">
  <h2>Embedding</h2>
  <div class="card" style="background: pink; padding: 1em 2em;">

  <h3>PNG (img tag)</h3>
  <pre>&lt;img src="/png/Venn.Diagram" /&gt;</pre>

  <h3>SVG (img tag)</h3>
  <pre>&lt;img src="/svg/Venn.Diagram" /&gt;</pre>

  <h3>Or just Link directly! (A raw image is returned)</h3>
  <pre>https://venn.threejjjs.xyz/img-svg/Venn/Diagram</pre>
</div>


    <h2>How does it work?</h2>
    <div class="card" style="background: pink; padding: 1em 2em;">
    <h3>API Syntax</h3>
    <ul>
      <li><code>.</code> Separate sets within a diagram (1-3 sets per diagram)</li>
      <li><code>text-with-whitespace</code> Ensure whitespace
      <li><code>~label~</code> Intersection label between circles</li>
      <li><code>_label_</code> Universal set (super intersection)</li>
      <li><code>/</code> Separate multiple diagrams</li>
    </ul>
    </div>

    <h2 id="try">Try it out!</h2>
    <div class="card" style="background: white; padding: 1.5em 2em;">
      <form id="api-form" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; font-size: 1em">

        <input type="text" id="sets-input" placeholder="venn.~intersection~.diagram"
          style="flex: 1; min-width: 200px; padding: 10px;  border: 2px solid #FFB3BA; border-radius: 8px; font-family: Trispace, sans-serif;font-size: 1em;">
        <select id="format-select" style="padding: 10px; font-size: 1em; border: 2px solid #BAE1FF; border-radius: 8px; font-family: Trispace, sans-serif;">
          <option value="img-svg">SVG</option>
          <option value="png">PNG</option>

        </select>
        <button type="submit" style="padding: 10px 20px; font-size: 1em; background: #FFB3BA; border: none; border-radius: 8px; cursor: pointer; font-family: Trispace, sans-serif;">Generate</button>
      </form>
      <div id="result-preview" style=""></div>
    </div>
    <div class="example">
      <div class="example-label">Two Diagrams</div>
      <pre>/img-svg/Venn/Diagram</pre>
      <img src="/img-svg/Venn/Diagram" alt="Venn diagram" style="width: 100%; height: auto; object-fit: contain;"/>
    </div>






    <div class="example">
      <div class="example-label">Create a Venn Diagram:</div>
      <pre>/img-svg/Venn.Diagram</pre>
      <img src="/img-svg/Venn.Diagram" alt="Venn diagram" style="width: 100%; height: auto; object-fit: contain;"/>
    </div>
    <div class="example">
      <div class="example-label">Intersect it:</div>
      <pre>/img-svg/chicken.~dinosaur~.egg</pre>
      <img src="/img-svg/chicken.~dinosaur~.egg" alt="Venn diagram" style="width: 100%; height: auto; object-fit: contain;"/>
    </div>


    <h2>Fun Examples</h2>

    <div class="example">
      <div class="example-label">Cook it!</div>
      <pre>/img-svg/flour.milk.egg._pankcakes_</pre>
      <img src="/img-svg/flour.milk.egg._pancakes_" alt="Venn diagram" style="width: 100%; height: auto; object-fit: contain;"/>
    </div>
    <h3>The builders dilema</h3>
    <div class="example">
      <div class="example-label">You can ONLY choose TWO</div>
      <pre>/img-svg/good.fast.cheap._never-gonna-happen_</pre>
      <img src="/img-svg/good.fast.cheap._never-gonna-happen_" alt="Venn diagram" style="width: 100%; height: auto; object-fit: contain;"/>
    </div>

    <h3>The emotions checklist</h3>
    <div class="example">
      <div class="example-label">living your best life</div>
      <pre>happiness.~anarchist~.rage.~martyrdom~.suffering.~philantropist~._teenager_</pre>
      <img src="/img-svg/happiness.~anarchist~.rage.~martyrdom~.suffering.~philantropist~._teenager_" alt="Venn diagram" style="width: 100%; height: auto; object-fit: contain;"/>
    </div>

    <h2>Try it out!</h2>
    <div class="card" style="background: white; padding: 1.5em 2em;">
      <form id="api-form" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; font-size: 1em">

        <input type="text" id="sets-input" placeholder="venn.~intersection~.diagram"
          style="flex: 1; min-width: 200px; padding: 10px;  border: 2px solid #FFB3BA; border-radius: 8px; font-family: Trispace, sans-serif;font-size: 1em;">
        <select id="format-select" style="padding: 10px; font-size: 1em; border: 2px solid #BAE1FF; border-radius: 8px; font-family: Trispace, sans-serif;">
          <option value="img-svg">SVG</option>
          <option value="png">PNG</option>

        </select>
        <button type="submit" style="padding: 10px 20px; font-size: 1em; background: #FFB3BA; border: none; border-radius: 8px; cursor: pointer; font-family: Trispace, sans-serif;">Generate</button>
      </form>
      <div id="result-preview" style=""></div>
    </div>


  </div>
    <footer>
    <aside></aside>
    <div>
    <h4>VENDER-BLENDER - Sketchy Venn Diagrams API</h4>
    <span class="text-xs"
    >&copy; All rights reserved.</span
    >
    </div>
      <aside
      class="p-4 hidden md:flex flex-col text-right text-text-200 justify-end text-wash-300"
    >
      <span class="text-xs">built with humans</span>
      <a class="inline-link" href="https://threejjjs.xyz">
        <h4
          class="text-right py-1 text-text-200 md:text-3xl font-secondary m-0"
        >
          three<span style="opacity:.5;" class="text-emerald-700">jjj</span>s
          <br />
        </h4>
      </a>
      <span class="text-xs">Interactive Tech</span>
    </aside>
    </footer>


  <script src="https://cdn.jsdelivr.net/npm/@hiseb/confetti@2.1.0/dist/confetti.min.js"></script>
  <script src="https://unpkg.com/roughjs@4.6.6/bundled/rough.js"></script>
  <script>${heroPhysicsContent.replace("// @ts-nocheck", "")}</script>
  <script>
    var el = document.getElementById('hero-message');
    var messages = {
      "IDLE": { text: "go on, i know you want to...", cls: "" },
      "HIT": { text: "a true venn-dictated individual", cls: "hit" },
      "MISS": { text: "try a bit harder", cls: "miss" }
    };
    function updateMessage() {
      var state = window.vennState || "IDLE";
      var msg = messages[state];
      if (el) {
        el.textContent = msg.text;
        el.className = "hero-message " + msg.cls;
      }
    }
    var lastState = "";
    var hasDragged = false;
    function checkState() {
      var state = window.vennState || "IDLE";
      if (state !== lastState) {
        lastState = state;
        hasDragged = false;
        updateMessage();
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

    // API Form Handler
    (function() {
      var form = document.getElementById('api-form');
      var input = document.getElementById('sets-input');
      var formatSelect = document.getElementById('format-select');
      var preview = document.getElementById('result-preview');

      if (!form || !input || !formatSelect || !preview) return;

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var sets = input.value.trim();
        if (!sets) {
          preview.innerHTML = '<p style="color: #e55;">Please enter some sets!</p>';
          return;
        }
        var format = formatSelect.value;
          var url = '/' + format + '/' + sets;
          var embedCode = '<iframe src="' + url + '" style="border: none; width: 400px; height: 400px; background: white; border-radius: 8px;"></iframe>';
          preview.innerHTML =
            '<div style="">' +
              '<img src="' + url + '" alt="Preview" style="width: 100%; height: auto;"/>' +
            '</div>' +
            '<p style="margin-bottom: 0.5em; font-family: Trispace, sans-serif;"><strong>Embed code:</strong></p>' +
            '<pre style="background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 0.9em;">' +
              (format === 'svg' ? embedCode : '&lt;img src="' + url + '" /&gt;') +
            '</pre>';
          if (typeof confetti === 'function') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
        });
    })();
  </script>
</body>
</html>`);
});

app.get("/svg/*", (c) => {
  const path = c.req.path;
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0 || segments[0] !== "svg") {
    return c.text("svg api");
  }

  const instances = segments.slice(1);

  if (instances.length === 0) {
    return c.text("svg api - add diagram: /svg/Title-1.Title-2.Title-3");
  }

  const parsedDiagrams = instances.map((instance, idx) => {
    const parsed = parseDiagram(instance);
    if (!parsed) return null;
    return roughVennDiagram(
      parsed.titles,
      parsed.intersections,
      idx,
      parsed.universalSet,
    );
  });

  if (parsedDiagrams.includes(null)) {
    return c.text("diagram requires 1-3 sets");
  }

  return c.html(parsedDiagrams.join(""));
});

app.get("/img-svg/*", (c) => {
  const path = c.req.path;
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0 || segments[0] !== "img-svg") {
    return c.text("img-svg api");
  }

  const instances = segments.slice(1);

  if (instances.length === 0) {
    return c.text(
      "img-svg api - add diagram: /img-svg/Title-1.Title-2.Title-3",
    );
  }

  const parsedDiagrams = instances.map((instance, idx) => {
    const parsed = parseDiagram(instance);
    if (!parsed) return null;
    return roughVennDiagram(
      parsed.titles,
      parsed.intersections,
      idx,
      parsed.universalSet,
    );
  });

  if (parsedDiagrams.includes(null)) {
    return c.text("diagram requires 1-3 sets");
  }

  if (parsedDiagrams.length === 1) {
    return c.body(parsedDiagrams[0]!, 200, {
      "Content-Type": "image/svg+xml",
    });
  }

  const diagramSizes = parsedDiagrams.map((svg) => {
    const wMatch = svg!.match(/width="(\d+)"/);
    const hMatch = svg!.match(/height="(\d+)"/);
    return {
      width: wMatch ? parseInt(wMatch[1]) : 400,
      height: hMatch ? parseInt(hMatch[1]) : 400,
      content: svg!.replace(/<svg[^>]*>|<\/svg>/g, ""),
    };
  });

  const gap = 20;
  const cols = Math.ceil(Math.sqrt(diagramSizes.length));
  const rows = Math.ceil(diagramSizes.length / cols);
  const maxWidth = Math.max(...diagramSizes.map((d) => d.width));
  const maxHeight = Math.max(...diagramSizes.map((d) => d.height));
  const totalWidth = cols * maxWidth + (cols - 1) * gap;
  const totalHeight = rows * maxHeight + (rows - 1) * gap;

  let compositeSvg = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg"><style>text { font-family: 'PermanentMarker', cursive; }</style>`;
  diagramSizes.forEach((d, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (maxWidth + gap);
    const y = row * (maxHeight + gap);
    compositeSvg += `<g transform="translate(${x}, ${y})">${d.content}</g>`;
  });
  compositeSvg += "</svg>";

  return c.body(compositeSvg, 200, {
    "Content-Type": "image/svg+xml",
  });
});

app.get("/png/*", async (c) => {
  const path = c.req.path;
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0 || segments[0] !== "png") {
    return c.text("png api");
  }

  const instances = segments.slice(1);

  if (instances.length === 0) {
    return c.text("png api - add diagram: /png/Title-1.Title-2.Title-3");
  }

  const parsedDiagrams = instances.map((instance, idx) => {
    const parsed = parseDiagram(instance);
    if (!parsed) return null;
    return roughVennDiagram(
      parsed.titles,
      parsed.intersections,
      idx,
      parsed.universalSet,
    );
  });

  if (parsedDiagrams.includes(null)) {
    return c.text("diagram requires 1-3 sets");
  }

  const diagramWidth = 400;
  const diagramHeight = 400;
  const gap = 20;
  const cols = Math.ceil(Math.sqrt(parsedDiagrams.length));
  const rows = Math.ceil(parsedDiagrams.length / cols);
  const totalWidth = cols * diagramWidth + (cols - 1) * gap;
  const totalHeight = rows * diagramHeight + (rows - 1) * gap;

  let compositeSvg = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg"><style>text { font-family: 'PermanentMarker'; }</style>`;
  parsedDiagrams.forEach((svgContent, i) => {
    if (!svgContent) return;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (diagramWidth + gap);
    const y = row * (diagramHeight + gap);
    compositeSvg += `<g transform="translate(${x}, ${y})">${svgContent.replace(/<\/?svg[^>]*>/g, "")}</g>`;
  });
  compositeSvg += "</svg>";

  const svgBuffer = Buffer.from(compositeSvg);
  const pngBuffer = await sharp(svgBuffer).png().toBuffer();

  return c.body(new Uint8Array(pngBuffer), 200, {
    "Content-Type": "image/png",
  });
});

export default app;
