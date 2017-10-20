/*
 *  Power BI Visualizations
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
  import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

  export class VisualSettings extends DataViewObjectsParser {
    public dataPoint: dataPointSettings = new dataPointSettings();
    public chartSettings: ChartSettings = new ChartSettings();
  }

  export class ChartSettings {
    // Forced vertical domain
    public yMin: number = undefined;
    public yMax: number = undefined;

    // Line width in px
    public lineWidth: number = undefined;
    public axisWidth: number = undefined;

    // Either "K","M" or "" to indicate to show numbers in millions, thousands or as is
    public yTickFormat: string = "";
    // Number of y ticks
    public yTicks: number = 5;
  }

  export class dataPointSettings {
    // Default color
    public defaultColor: string = "";
    // Show all
    public showAllDataPoints: boolean = true;
    // Fill
    public fill: string = "";
    // Color saturation
    public fillRule: string = "";
    // Text Size
    public fontSize: number = 12;
  }

}
