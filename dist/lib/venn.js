import rough from 'roughjs';
import { FONT_DATA_URI } from './font-data';
export function roughVennDiagram(titles, intersections = [], diagramId = 0, universalSet) {
    const generator = rough.generator();
    const numSets = titles.length;
    const baseRadius = 80;
    const basePadding = 40;
    const maxTitleLen = Math.max(...titles.map(t => t.length), 1);
    const titlePadding = Math.max(0, (maxTitleLen - 5) * 14);
    const radius = baseRadius + titlePadding * 0.3;
    const maxIntersectionLen = Math.max(0, ...intersections.map(i => i.label.length));
    const intersectionPadding = Math.max(0, (maxIntersectionLen - 3) * 10);
    const setWidth = radius * 2 + titlePadding;
    const gap = Math.min(radius * 0.8, 40 + titlePadding * 0.5);
    let width, height;
    if (numSets === 1) {
        width = setWidth + basePadding * 2;
        height = radius * 2 + basePadding * 2 + 60;
    }
    else if (numSets === 2) {
        width = setWidth * 2 + gap + basePadding * 2;
        height = radius * 2 + basePadding * 2 + 80 + intersectionPadding;
    }
    else {
        width = setWidth * 2.5 + gap + basePadding * 2;
        height = radius * 2 + basePadding * 2 + 100 + intersectionPadding;
    }
    width = Math.max(width, 300);
    height = Math.max(height, 300);
    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const circles = numSets === 1
        ? [[centerX, centerY, radius]]
        : numSets === 2
            ? [[centerX - radius * 2 / 3 - titlePadding * 0.5, centerY, radius], [centerX + radius * 2 / 3 + titlePadding * 0.5, centerY, radius]]
            : [[centerX, centerY - gap * 0.8, radius], [centerX - gap * 0.8, centerY + gap * 0.5, radius], [centerX + gap * 0.8, centerY + gap * 0.5, radius]];
    const colors = ['#FFB3BA', '#BAFFC9', '#BAE1FF'];
    let pathsHtml = `<defs><style>@font-face { font-family: 'PermanentMarker'; src: url('${FONT_DATA_URI}'); }</style></defs>`;
    circles.forEach(([cx, cy, r], i) => {
        pathsHtml += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors[i]}" fill-opacity="0.6" />`;
        const drawable = generator.circle(cx, cy, r * 2, { stroke: '#333', strokeWidth: 2, fill: 'none' });
        const strokePaths = generator.toPaths(drawable);
        strokePaths.forEach((path) => {
            pathsHtml += `<path d="${path.d}" fill="none" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" />`;
        });
        const labelY = cy - radius - 15;
        pathsHtml += `<text x="${cx}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="bold" fill="#333" font-family="PermanentMarker">${titles[i].replace(/-/g, ' ')}</text>`;
    });
    intersections.forEach(({ label, set1, set2 }, i) => {
        const [x1, y1, r] = circles[set1];
        const [x2, y2] = circles[set2];
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dx = midX - centerX;
        const dy = midY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maskId = `d${diagramId}-m${i}`;
        pathsHtml += `
      <mask id="${maskId}">
        <circle cx="${x1}" cy="${y1}" r="${r}" fill="white" />
      </mask>
      <circle cx="${x2}" cy="${y2}" r="${r}" fill="rgba(255, 200, 100, 0.5)" mask="url(#${maskId})" />
    `;
        let labelX, labelY;
        if (dist > 0) {
            const startX = midX + (dx / dist) * radius * 0.5;
            const startY = midY + (dy / dist) * radius * 0.5;
            const endX = midX + (dx / dist) * radius * 1.1;
            const endY = midY + (dy / dist) * radius * 1.1;
            labelX = midX + (dx / dist) * radius * 1.8;
            labelY = midY + (dy / dist) * radius * 1.8;
            const lineDrawable = generator.line(startX, startY, endX, endY, { stroke: '#333', strokeWidth: 1.5 });
            const linePaths = generator.toPaths(lineDrawable);
            let lineHtml = '';
            linePaths.forEach((path) => {
                lineHtml += `<path d="${path.d}" fill="none" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" />`;
            });
            pathsHtml += `${lineHtml}<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#333" font-family="PermanentMarker">${label.replace(/-/g, ' ')}</text>`;
        }
        else {
            labelX = midX;
            labelY = midY + radius * 1.2;
            const lineDrawable = generator.line(midX, midY + radius * 0.5, midX, midY + radius * 0.9, { stroke: '#333', strokeWidth: 1.5 });
            const linePaths = generator.toPaths(lineDrawable);
            let lineHtml = '';
            linePaths.forEach((path) => {
                lineHtml += `<path d="${path.d}" fill="none" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" />`;
            });
            pathsHtml += `${lineHtml}<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#333" font-family="PermanentMarker">${label.replace(/-/g, ' ')}</text>`;
        }
    });
    if (universalSet) {
        const startX = centerX;
        const startY = centerY;
        const endX = centerX + (width - centerX) * 0.5;
        const endY = height - 40;
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const pathD = `M ${startX} ${startY} C ${midX} ${startY} ${endX} ${midY} ${endX} ${endY}`;
        const bezierDrawable = generator.path(pathD, { stroke: '#333', strokeWidth: 1.5 });
        const bezierPaths = generator.toPaths(bezierDrawable);
        let bezierHtml = '';
        bezierPaths.forEach((path) => {
            bezierHtml += `<path d="${path.d}" fill="none" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" />`;
        });
        pathsHtml += `<text x="${endX}" y="${endY}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#333" font-family="PermanentMarker">${universalSet.replace(/-/g, ' ')}</text>${bezierHtml.replace(/stroke-width="[^"]*"/, 'stroke-width="1.5" stroke-dasharray="4,4"')}`;
    }
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${pathsHtml}</svg>`;
}
