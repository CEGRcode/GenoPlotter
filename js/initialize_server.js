// Initialize classes
let dataObj = new dataObject(defaultDataObjectSettings);

const xAxisInputObj = new xAxisInput("x-axis-input");
const yAxisInputObj = new yAxisInput("y-axis-input");
const lockAxesObj = new lockAxes("lock-axes");

const bedLoaderObj = new bedLoader("bed-loader");

let plotObj = new plotObject("main-plot", defaultPlotDimensions.width,
    defaultPlotDimensions.height, defaultPlotDimensions.margins);
const legendObj = new legendObject();

const opacityInputObj = new opacityInput("opacity-input");
const smoothingInputObj = new smoothingInput("smoothing-input");
const bpShiftInputObj = new bpShiftInput("bp-shift-input");
const backdropColorObj = new backdropColorInput("backdrop-color");
const backdropOpacityObj = new backdropOpacityInput("backdrop-opacity");
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

let tableObj = new compositeTable("composite-table", false)