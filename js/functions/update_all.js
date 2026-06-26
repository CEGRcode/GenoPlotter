const updateAll = function(local) {
    tableObj.loadFromDataObject();
    if (local) {
        compositeLoaderObj.updateReferenceCounter()
    };
    xAxisInputObj.update();
    yAxisInputObj.update();
    lockAxesObj.update();
    opacityInputObj.update();
    smoothingInputObj.update();
    bpShiftInputObj.update();
    backdropColorObj.update();
    backdropOpacityObj.update();
    combineStrandsObj.update();
    separateColorsObj.update();
    colorTraceObj.update();
    enablePlotTooltipObj.update();
    showLegendObj.update();
    plotObj.updatePlot();
    legendObj.updateLegend();
    referenceLinesObj.updateReferenceLines();
    referenceLinesInputObj.updateAll();
    nucleosomeSliderObj.updateNucleosomeSlider();
    nucleosomeSliderInputObj.update();
    if (!local) {
        bedLoaderObj.update();
        targetSelectorObj.updateFromDataObj()
    }
}