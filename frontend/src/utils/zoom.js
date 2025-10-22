import * as d3 from 'd3'

/**
 * Zooms the D3 visualization to center on the selected node.
 * * @param {object} node - The d3.hierarchy node object (with x, y, r properties).
 * @param {number} svgWidth - The width of the SVG viewport.
 * @param {number} svgHeight - The height of the SVG viewport.
 * @param {object} gElement - The D3 selection of the main transformable <g> element.
 */
function zoomToNode(node, svgWidth, svgHeight, gElement) {
    if (!node) return

    // 1. Calculate the new scale (k): 
    // We want the diameter (2 * r) of the selected circle to nearly fill the viewport.
    // Use the minimum of width/height to ensure the circle always fits.
    const diameter = node.r * 2
    const padding = 20; // Some margin
    const minDimension = Math.min(svgWidth, svgHeight)
    
    // Scale 'k' should be inverse of the ratio of the node's diameter to the viewport size.
    // We divide by (diameter * 1.1) to leave a little margin around the node.
    const k = minDimension / (diameter + padding)

    // 2. Calculate the new translation (tx, ty):
    // Center of the screen: (svgWidth/2, svgHeight/2)
    // Center of the node in current scale: (node.x, node.y)
    // The required translation (tx, ty) must compensate for the node's position AND the new scale.
    const tx = svgWidth / 2 - node.x * k
    const ty = svgHeight / 2 - node.y * k

    // 3. Apply the transform with a smooth D3 transition
    gElement
        .transition()
        .duration(750) // Smooth transition time
        .attr(
            "transform", 
            `translate(${tx},${ty}) scale(${k})`
        );
}