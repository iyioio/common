import { css } from '@iyio/common';
import { createStory } from '@iyio/react-common';
import { BarSvgChartView } from './BarSvgChartView';

export default {
    component:BarSvgChartView,
    title:'BarSvgChartView'
}

export const Default = createStory(BarSvgChartView,{
    style:{
        height:400,
        width:'100%',
        background:'#1A1D1F',
    },
    options:{
        data:{
            labels:['A','B','C','D','E','F'],
            series:[
                [1,-2,8,4, 6,0],
                //[10,70,50,90,10],
                //[3,6,-3,10,9],
                // [0.2,0.8,0.125],
                // [0.1,0.8,0.333],
            ],
        },
        vLinePadding:30,
        hLines:true,
        vLines:true,
        seriesOptions:[
            {
                smoothness:1,
                cornerRadius:5,
            },
        ],
        css:css`
            @@ .svg-charts-label-line, @@ .svg-charts-value-line{
                stroke:#313336;
                stroke-width:1px;
            }

            @@ .svg-charts-text{
                color:#ffffff;
            }

            @@ .svg-charts-bar.svg-charts-odd .svg-charts-fill{
                fill:#4085F8;
            }

            @@ .svg-charts-bar.svg-charts-even .svg-charts-path{
                stroke:#4085F8;
                stroke-width:5px;
                fill:none;
            }
            @@ .svg-charts-bar.svg-charts-even .svg-charts-fill{
                display:none;
            }

            @@ .svg-charts-text-label{
                display:flex;
                justify-content:center;
                align-items:center;
                padding:0 5px;
                box-sizing:border-box;
            }
            @@ .svg-charts-text-label > div{
                overflow:hidden;
                white-space:nowrap;
                text-overflow:ellipsis;
            }
            @@ .svg-charts-label-label .svg-charts-text-first{
                justify-content:flex-start;
            }
            @@ .svg-charts-label-label .svg-charts-text-last{
                justify-content:flex-end;
            }
            @@ .svg-charts-value-label .svg-charts-text-label{
                justify-content:flex-end;
                align-items:flex-end;
            }
        `
    },
})
