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
        backdropColor: "#FFFFFF",
        backdropOpacity: 1,
        combined: false,
        separateColors: false,
        colorTrace: false,
        enableTooltip: true,
        showLegend: true,
        normalization: "none",
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
            linewidth: 1,
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
    },
    bedObj: {
        reference_points: [],
        radius: 500,
        file_name: "No BED loaded",
        skipped_lines_list: []
    }
}