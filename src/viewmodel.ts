module powerbi.extensibility.visual {
    export interface LineChartViewModel{
        dataSeries: Array<DataSeries>;
        dataMax: number;
        dataMin: number;
    }

    export interface DataSeries {
        name:string;        
        dataPoints: Array<DataSeriesDataPoint>;
    }

    export interface DataSeriesDataPoint{
        value: PrimitiveValue;
        highlighted: boolean;
        category: Date;
    }
}    