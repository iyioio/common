import { css } from '@iyio/common';
import { createStory } from '@iyio/react-common';
import { LineSvgChartView } from './LineSvgChartView';

export default {
    component:LineSvgChartView,
    title:'LineSvgChartView'
}

export const Default = createStory(LineSvgChartView,{
    style:{
        height:400,
        width:'100%',
        background:'#1A1D1F',
    },
    options:{
        data:{
            labels:['A','B','Castsfieijfskdjjfjfjief  asdfefefe Castsfieijfskdjjfjfjief  asdfefefe Castsfieijfskdjjfjfjief  asdfefefe Castsfieijfskdjjfjfjief  asdfefefe Castsfieijfskdjjfjfjief  asdfefefe ','D','E'],
            series:[
                //[-2,8,4, 6,0],
                //[10,70,50,90,10],
                //[3,6,-3,10,9],
                [0.2,0.8,0.125],
                [0.1,0.8,0.333],
            ],
        },
        hLines:true,
        vLines:true,
        seriesOptions:[
            {
                smoothness:1
            },
            {
                smoothness:1
            }
        ],
        css:css`
            @@ .svg-charts-label-line, @@ .svg-charts-value-line{
                stroke:#313336;
                stroke-width:1px;
            }

            @@ .svg-charts-text{
                color:#ffffff;
            }

            @@ .svg-charts-line.svg-charts-odd .svg-charts-path{
                display:none;
            }
            @@ .svg-charts-line.svg-charts-odd .svg-charts-fill{
                fill:#4085F812;
            }

            @@ .svg-charts-line.svg-charts-even .svg-charts-path{
                stroke:#4085F8;
                stroke-width:5px;
                fill:none;
                stroke-linecap:round;
            }
            @@ .svg-charts-line.svg-charts-even .svg-charts-fill{
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


export const Min = createStory(LineSvgChartView,{
    style:{
        height:400,
        //background:'#f5f5f5',
        width:'100%',
    },
    options:{
        data:{
            labels:[],
            series:[
                //[-2,8,4, 6,0],
                //[10,70,50,90,10],
                //[3,6,-3,10,9],
                [0.2,0.8,0.125],
            ],
        },
        min:true,
        seriesOptions:[
            {
                smoothness:1
            }
        ],
        css:css`
            @@ .svg-charts-line .svg-charts-path{
                stroke:#4085F8;
                stroke-width:5px;
                fill:none;
                stroke-linecap:round;
            }
            @@ .svg-charts-line .svg-charts-fill{
                display:none;
            }
        `
    },
})
