const targetSelector = class {
    constructor(elementID) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };

        let self = this;
        this.selected_targets = {};
        this.targets_object = {};

        this.element = d3.select("#" + elementID);
        this.element.append("h5").text("Select targets:");
        this.search_bar = this.element.append("input")
            .classed("target-search-bar", true)
            .classed("inactive", true)
            .attr("type", "text")
            .attr("placeholder", "Search targets...")
            .on("input", function() {
                let search_term = self.search_bar.node().value.toLowerCase();
                self.target_list.selectAll("li")
                    .each(function() {
                        let li = d3.select(this);
                        if (li.select("label").text().toLowerCase().includes(search_term)) {
                            li.style("display", null)
                        } else {
                            li.style("display", "none")
                        }
                    })
            });
        this.selected_counter = this.element.append("div")
            .classed("selected-counter", true)
            .text("Selected targets: " + Object.keys(this.selected_targets).length);
        const target_list_container = this.element.append("div")
            .classed("target-list-container", true)
        this.target_list = target_list_container.append("ul")
            .classed("target-list", true);
        
        this.loadTargets()
    }

    async loadTargets() {
        let self = this,
            res = await fetch(document.URL + "api/bigwig/list", {method: "GET"}),
            targets = await res.json();
        targets.sort();
        
        this.targets_object = {};
        this.target_list.selectAll("li").data(targets).join("li")
            .each(function(d) {
                self.targets_object[d.name] = new targetCheckbox(d3.select(this), d.name, d.forward, d.reverse, self)
            })
    }

    sortTargets() {
        let targets = Object.keys(this.targets_object),
            target_list_node = this.target_list.node();
        targets
            .sort((a, b) => !(a.selected ^ b.selected) ? a.name.localeCompare(b.name) : b.selected - a.selected)
            .forEach(target => target_list_node.appendChild(target.element.node()))
    }

    updateSelectedCounter() {
        this.selected_counter.text("Selected targets: " + Object.keys(this.selected_targets).length)
    }

    moveTarget(oldIdx, newIdx) {
        for (let target in this.selected_targets) {
            if (this.selected_targets[target] === oldIdx) {
                this.selected_targets[target] = newIdx
            } else if (this.selected_targets[target] > oldIdx && this.selected_targets[target] <= newIdx) {
                this.selected_targets[target]--
            } else if (this.selected_targets[target] < oldIdx && this.selected_targets[target] >= newIdx) {
                this.selected_targets[target]++
            }
        }
    }
}
