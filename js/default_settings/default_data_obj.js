const defaultDataObjectSettings = {
    globalSettings: {
        xmin: -500,
        xmax: 500,
        ymin: -1,
        ymax: 1,
        symmetricY: true,
        lockAxes: false,
        minOpacity: .5,
        maxOpacity: 1,
        smoothing: 7,
        bpShift: 0,
        combined: false,
        separateColors: false,
        colorTrace: false,
        enableTooltip: true,
        showLegend: true,
        labels: {
            title: "Composite plot",
            xlabel: "Position (bp)",
            ylabel: "Occupancy (AU)"
        }
    },
    fileData: {},
    compositeData: [],
    referenceLines: {
        horizontalLines: [],
        verticalLines: [{
            x: 0,
            color: "#999999",
            linestyle: "dashed",
            fontSize: 14,
            fontColor: "#000000",
            textOrientation: "horizontal",
            labelOffset: 15
        }]
    },
    nucleosomeSlider: {
        x: 0,
        lines: []
    }
}