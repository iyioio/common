import { createStory } from '@iyio/react-common';
import { LineSvgChartView } from './LineSvgChartView';

export default {
    component:LineSvgChartView,
    title:'SvgChartView'
}

export const Default = createStory(LineSvgChartView,{
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
        style:{
            series:[
                {
                    smoothness:1
                },
                {
                    smoothness:1
                }
            ]
        },
    },
    style:{
        height:400,
        width:'100%',
        background:'#1A1D1F',
    }
})
