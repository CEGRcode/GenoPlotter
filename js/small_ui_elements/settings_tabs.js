let nucleosomeSliderActive = false;

const settingsTabs = d3.select("#settings-tabs"),
    globalSettingsTab = settingsTabs.append("button")
        .attr("id", "global-settings-tab")
        .attr("title", "Global settings")
        .classed("settings-tab", true)
        .classed("selected-tab", true)
        .on("click", function() {
            d3.selectAll(".settings-tab").classed("selected-tab", false);
            d3.select(this).classed("selected-tab", true);
            d3.selectAll(".settings-section").classed("hidden", true);
            d3.select("#global-settings").classed("hidden", false);
            nucleosomeSliderActive = false;
            nucleosomeSliderObj.updateNucleosomeSlider()
        }),
    referenceAxesTab = settingsTabs.append("button")
        .attr("id", "reference-lines-input-tab")
        .attr("title", "Reference lines")
        .classed("settings-tab", true)
        .on("click", function() {
            d3.selectAll(".settings-tab").classed("selected-tab", false);
            d3.select(this).classed("selected-tab", true);
            d3.selectAll(".settings-section").classed("hidden", true);
            d3.select("#reference-lines-input").classed("hidden", false);
            nucleosomeSliderActive = false;
            nucleosomeSliderObj.updateNucleosomeSlider()
        }),
    nucleosomeSliderTab = settingsTabs.append("button")
        .attr("id", "nucleosome-slider-tab")
        .attr("title", "Nucleosome slider")
        .classed("settings-tab", true)
        .on("click", function() {
            d3.selectAll(".settings-tab").classed("selected-tab", false);
            d3.select(this).classed("selected-tab", true);
            d3.selectAll(".settings-section").classed("hidden", true);
            d3.select("#nucleosome-slider-input").classed("hidden", false);
            nucleosomeSliderActive = true;
            nucleosomeSliderObj.updateNucleosomeSlider()
        });

globalSettingsTab.append("i").classed("fas fa-2xl fa-globe", true);
referenceAxesTab.append("i").classed("fas fa-2xl fa-ruler-combined", true);
nucleosomeSliderTab.append("i").classed("fas fa-2xl fa-certificate", true)