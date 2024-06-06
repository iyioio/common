
import { aiCompleteConvoModule } from "@iyio/ai-complete";
//import { aiCompleteLambdaModule } from "@iyio/ai-complete-lambda";
import { openAiModule } from "@iyio/ai-complete-openai";
import { EnvParams, ScopeRegistration, getErrorMessage, initRootScope, rootScope } from "@iyio/common";
import { ConvoWebCrawler } from "../lib/ConvoWebCrawler";

const main=async ()=>{

    initRootScope((reg:ScopeRegistration)=>{

        reg.addParams(new EnvParams())

        //reg.use(aiCompleteLambdaModule);
        reg.use(openAiModule);// For testing locally

        reg.use(aiCompleteConvoModule);


    });
    await rootScope.getInitPromise();

    console.log('inited');

    const crawler=new ConvoWebCrawler({
        googleSearchApiKey:process.env['NX_GOOGLE_SEARCH_API_KEY'],
        googleSearchCx:process.env['NX_GOOGLE_SEARCH_CX'],
        headed:true
    });

    const url=(
        //'https://investors.apogeetherapeutics.com/news-releases/news-release-details/apogee-announces-positive-interim-results-phase-1-healthy'
        //'https://investors.apogeetherapeutics.com/news-releases/news-release-details/apogee-therapeutics-expands-board-directors-appointment-lisa'
        //'https://www.prnewswire.com/news-releases/apogee-therapeutics-launches-with-169-million-to-develop-potentially-best-in-class-therapies-for-immunological-and-inflammatory-disorders-301696381.html'
        //'https://www.sec.gov/ixviewer/ix.html?doc=/Archives/edgar/data/0001018724/000101872424000083/amzn-20240331.htm'
        //'https://www.sec.gov/ix?doc=/Archives/edgar/data/0001018724/000101872424000083/amzn-20240331.htm' // with iframe
        //'https://www.youtube.com/'
        //'https://finance.yahoo.com/quote/APGE/?guccounter=1&guce_referrer=aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS8&guce_referrer_sig=AQAAADddFlUFWmyvBKfu4mmWacbtR7fIp-mcXwlA1OCR9Qz-y5fbCvHuQ7bqzYY0h5JgMhr8Cmnz9bAH6teyU4O7rryLqMJCVJLAMqfrwimf0zj-08NFTYwWY_cvGG2fA8sMHJCtb5l98G2s7G_qL6fW9pxxPDtmGD8BWvoYd_4kTvx8'
        //'https://www.spacex.com/updates'
        //'https://intellspot.com/wp-content/uploads/2017/12/bar-chart-example.png'
        //'https://ppcexpo.com/blog/wp-content/uploads/2022/07/time-series-graph-examples.jpg'
        //'https://cdn.ablebits.com/_img-blog/pie-chart/excel-pie-chart.png'
        'https://policyviz.com/wp-content/uploads/2018/02/share-of-us-agricultural-exports-value-01.png'
        //'https://www.includehelp.com/ds/Images/graph-a.jpg'
    )

    try{

        //await crawler.testAsync(url);

        await crawler.convertPageAsync({url});

        // await crawler.searchAsync({
        //     term:'Apogee Therapeutics news',
        //     crawlOptions:{
        //         pageRequirementPrompt:'Should contain a full news article about Apogee Therapeutics',
        //     }
        // })
    }catch(ex){
        console.error('Crawler failed')
        console.error(getErrorMessage(ex));
        console.error('stack',(ex as any)?.stack);
        throw ex;
    }

}

main();


//         const images=[
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-0.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-1.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-2.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-3.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-4.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-5.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-6.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-7.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-8.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-9.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-10.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-11.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-12.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-13.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-14.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-15.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-16.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-17.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-18.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-19.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-20.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-21.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-22.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-23.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-24.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-25.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-26.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-27.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-28.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-29.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-30.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-31.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-32.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-33.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-34.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-35.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-36.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-37.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-38.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-39.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-40.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-41.png',
//   'f6b51019-b244-4995-b225-070af475ede4/d458abd4-5fa6-43ef-9696-402c12f9697a-img-42.png'
// ]
