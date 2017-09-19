/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    "use strict";
    declare var moment: any;
    export class Visual implements IVisual {
        private target: HTMLElement;
        private settings: VisualSettings;
        private options: VisualUpdateOptions;
        private colorPalette: IColorPalette;
        private host: IVisualHost;

        constructor(options: VisualConstructorOptions) {
            this.target = options.element;
            this.host = options.host;
            this.colorPalette = this.host.colorPalette;
        }

        public update(options: VisualUpdateOptions) {
            this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
            this.settings.chartSettings
            this.target.innerHTML = `<div id="chart"></div>`;
            this.options = options;

            //Starting render of the visual
            this.render(this.options, this.settings.chartSettings);
        }


        private render(options: VisualUpdateOptions, chartSettings: ChartSettings) {
            const vm = this.visualTransform(options)

            // Line and axis sizing
            const dataLineWidth = chartSettings.lineWidth || 4;
            const axisLineWidth = chartSettings.axisWidth || 2;

            // Establishing margins
            const horizontalMargin = 30;
            const verticalMargin = 60;

            // Take forced vertical domain if set or min/max data values as domain
            let maxVertical = chartSettings.yMax != undefined ? chartSettings.yMax : vm.dataMax;
            let minVertical = chartSettings.yMin != undefined ? chartSettings.yMin : vm.dataMin;

            let verticalValuePadding = 10; //TODO: Could be a setting or percentage


            // console.log("Vertical domain = [" + minVertical + "," + maxVertical + "]");

            //TODO: Could be more robust and also handle category on horizontal axis
            // Assuming the axis series is sorted DateTime where first is min value and last is max value of horizontal domain
            let maxHorizontal = vm.dataSeries[0].dataPoints[vm.dataSeries[0].dataPoints.length - 1].category;
            let minHorizontal = vm.dataSeries[0].dataPoints[0].category;
            // console.log("Horizontal domain = [" + minHorizontal.toJSON() + "," + maxHorizontal.toJSON() + "]");

            // Again assuming the horizontal values parses to Date-objects
            // Establishing horizontal time-scale and vertical linear scale
            let xScale = d3.time.scale()
                .range([verticalMargin, options.viewport.width - verticalMargin])
                .domain([minHorizontal, maxHorizontal])
            const xAxis = d3.svg.axis().scale(xScale).orient("bottom");

            const yScale = d3.scale.linear()
                .range([options.viewport.height - horizontalMargin, horizontalMargin])
                .domain([minVertical, maxVertical + verticalValuePadding]);
            const yAxis = d3.svg.axis().scale(yScale).orient("left").tickFormat(d => { return this.formatTicks(d, chartSettings.yTickFormat) })

            // Removing old chart
            let old = d3.select("#chartsvg").remove();

            // Slicing array to only show view
            // This uses the highlight-capability to extract a subset of the dataset
            vm.dataSeries = this.sliceDataView(vm.dataSeries);

            // Setting up the main svg element
            var svg = d3.select("#chart").append("svg")
                .attr("width", options.viewport.width)
                .attr("height", options.viewport.height)
                .attr("id", "chartsvg")

            // Line function for drawing line elements
            const line = d3.svg.line()
                .x(d => { return xScale((d as any).category) })
                .y(d => { return yScale((d as any).value.valueOf() as number); });

            // Adding each dataset as a line in the svg-element
            vm.dataSeries.forEach((d, i) => {
                svg.append("g")
                    .attr("class", "line")
                    .append("path")
                    .attr("fill", "none")
                    .attr("stroke", () => {
                        // The exposed getColor method sometimes returns an array where all values are the same color
                        // This is a problem...
                        //return this.colorPalette.getColor("" + i).value

                        // Although not accessable in the typescript typings, we can cast the palette as any and access the raw color array at runtime
                        // This works, but is probably not the best way to solve the problem
                        let t = this.host.colorPalette as any;
                        return t.colors[i].value;
                    })
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke-width", dataLineWidth)
                    .attr("d", line(d.dataPoints as any));
            })

            // x-axis
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + (options.viewport.height - horizontalMargin) + ")")
                .attr("stroke", "black")
                .attr("fill", "transparent")
                .attr("stroke-width", axisLineWidth)
                .call(xAxis)

                .append("text")
                .attr("class", "label")
                .attr("x", options.viewport.width)
                .attr("y", -6)
                .style("text-anchor", "end")
            // .text("test");

            // y-axis
            svg.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + verticalMargin + ",0)")
                .attr("stroke", "black")
                .attr("fill", "transparent")
                .attr("stroke-width", axisLineWidth)
                .call(yAxis)
                .append("text")
                .attr("class", "label")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
            // .text("test");

            // Different fill/stroke for characters on the axis elements
            // Axis should have stroke and no fill, but text should have fill and no stroke
            svg.selectAll("text")
                .style("font-size", "0.6em")
                .style("fill", "black")
                .style("stroke", "transparent")
        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        private sliceDataView(series: Array<DataSeries>): Array<DataSeries> {
            for (const s of series) {
                let selectionIndex;
                // Find position of highlighted value
                for (let i = s.dataPoints.length - 1; i >= 0; i--) {
                    if (s.dataPoints[i].highlighted) {
                        selectionIndex = i;
                        break;
                    }
                }
                // Take the entire array up to, and including the highlighted value
                s.dataPoints = s.dataPoints.slice(0, selectionIndex + 1)
            }
            return series;
        }

        /** 
         * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the 
         * objects and properties you want to expose to the users in the property pane.
         * 
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }

        private visualTransform(options: VisualUpdateOptions): LineChartViewModel {
            const dataViews = options.dataViews;

            // Construct empty VM
            const viewModel: LineChartViewModel = {
                dataSeries: [],
                dataMax: 0,
                dataMin: 0
            };
            if (!dataViews
                || !dataViews[0]
                || !dataViews[0].categorical
                || !dataViews[0].categorical.categories
                || !dataViews[0].categorical.categories[0].source
                || !dataViews[0].categorical.values)
                return viewModel;

            let categorical = dataViews[0].categorical;
            let category = categorical.categories[0];
            let dataValues = categorical.values;

            // Finding length of longest series
            let longestSeriesLength = 0;
            for (const series of dataValues) {
                longestSeriesLength = series.values.length > longestSeriesLength ? series.values.length : longestSeriesLength;
            }
            for (let n = 0; n < dataValues.length; n++) {
                const series = {
                    dataPoints: []
                }
                // Creating values for each series matching the length of either longest series or category
                for (let i = 0, len = Math.max(category.values.length, longestSeriesLength); i < len; i++) {
                    // If nothing is selected, highlights array is undefined
                    // Set all values to highlighted
                    let h = true
                    if (dataValues[n].highlights) {
                        // If highlights array exists, highlight only selected values
                        if (dataValues[n].highlights[i] == null)
                            h = false;
                    }
                    // Handle datapoints with null/undefined values
                    if (category.values[i] == null) {
                        console.warn("Date axis is missing for index " + i + ". This item is skipped");
                        continue;
                    }
                    if (dataValues[n].values[i] == null) {
                        console.warn("Measure is missing for index " + i);
                        continue;
                    }
                    series.dataPoints.push({
                        value: dataValues[n].values[i],
                        category: category.values[i],
                        highlighted: h
                    });
                }
                viewModel.dataSeries.push(series);
            }
            // Finding max value of dataset and assigning VM data max to determine vertical chart domain
            for (const series of viewModel.dataSeries) {
                const maxValue = d3.max(series.dataPoints.map(x => x.value as number));
                viewModel.dataMax = maxValue > viewModel.dataMax ? maxValue : viewModel.dataMax;
                const minValue = d3.min(series.dataPoints.map(x => x.value as number));
                viewModel.dataMin = minValue < viewModel.dataMin ? minValue : viewModel.dataMin;
            }
            return viewModel;
        }

        // Label formats based on setting
        private formatTicks = function (d, format: string) {
            if (format == "") {
                return d;
            }
            else if (format == "K") {
                return this.formatInteger(d / 1e3) + "K"
            }
            else if (format == "M") {
                return this.formatInteger(d / 1e6) + "M"
            }
        }
        private formatInteger = d3.format(".0f");
    }
}