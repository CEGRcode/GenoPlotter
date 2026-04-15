// Initialize classes
let dataObj = new dataObject(defaultDataObjectSettings);

const xAxisInputObj = new xAxisInput("x-axis-input");
const yAxisInputObj = new yAxisInput("y-axis-input");
const lockAxesObj = new lockAxes("lock-axes");

const bedLoaderObj = new bedLoader("bed-loader");

let plotObj = new plotObject("main-plot", 500, 300, {top: 30, right: 190, bottom: 35, left: 60});
const legendObj = new legendObject();

const opacityInputObj = new opacityInput("opacity-input");
const smoothingInputObj = new smoothingInput("smoothing-input");
const bpShiftInputObj = new bpShiftInput("bp-shift-input");
const combineStrandsObj = new combineStrands("combine-strands");
const separateColorsObj = new separateColors("separate-colors");
const colorTraceObj = new colorTrace("color-trace");
const enablePlotTooltipObj = new enablePlotTooltip("enable-plot-tooltip");
const showLegendObj = new showLegend("show-legend");

const nucleosomeSliderObj = new nucleosomeSlider();
const nucleosomeSliderInputObj = new nucleosomeSliderInput("nucleosome-slider-input");

const referenceLinesObj = new referenceLines();
const referenceLinesInputObj = new referenceLinesInput("reference-lines-input");

const tooltipObj = new plotTooltip();

const targetSelectorObj = new targetSelector("target-selector");

let tableObj = new compositeTable("composite-table", false);

d3.select("#download-json").on("click", function() {
    dataObj.exportDataAsJSON()
})