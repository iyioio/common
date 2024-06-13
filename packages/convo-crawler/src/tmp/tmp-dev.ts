import { ConvoWebCrawler } from "../lib/ConvoWebCrawler";

export const doConvoCrawlerDevStuffAsync=async (crawler:ConvoWebCrawler)=>{
    const url=(
        //'https://investors.apogeetherapeutics.com/news-releases/news-release-details/apogee-announces-positive-interim-results-phase-1-healthy'
        //'https://investors.apogeetherapeutics.com/news-releases/news-release-details/apogee-therapeutics-expands-board-directors-appointment-lisa'
        //'https://investors.apogeetherapeutics.com/news-events/news'
        //'https://www.prnewswire.com/news-releases/apogee-therapeutics-launches-with-169-million-to-develop-potentially-best-in-class-therapies-for-immunological-and-inflammatory-disorders-301696381.html'
        //'https://www.sec.gov/ixviewer/ix.html?doc=/Archives/edgar/data/0001018724/000101872424000083/amzn-20240331.htm'
        //'https://www.sec.gov/ix?doc=/Archives/edgar/data/0001018724/000101872424000083/amzn-20240331.htm' // with iframe
        //'https://www.youtube.com/'
        //'https://finance.yahoo.com/quote/APGE/?guccounter=1&guce_referrer=aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS8&guce_referrer_sig=AQAAADddFlUFWmyvBKfu4mmWacbtR7fIp-mcXwlA1OCR9Qz-y5fbCvHuQ7bqzYY0h5JgMhr8Cmnz9bAH6teyU4O7rryLqMJCVJLAMqfrwimf0zj-08NFTYwWY_cvGG2fA8sMHJCtb5l98G2s7G_qL6fW9pxxPDtmGD8BWvoYd_4kTvx8'
        //'https://www.spacex.com/updates'
        //'https://intellspot.com/wp-content/uploads/2017/12/bar-chart-example.png'
        //'https://ppcexpo.com/blog/wp-content/uploads/2022/07/time-series-graph-examples.jpg'
        //'https://cdn.ablebits.com/_img-blog/pie-chart/excel-pie-chart.png'
        //'https://policyviz.com/wp-content/uploads/2018/02/share-of-us-agricultural-exports-value-01.png'
        //'https://www.includehelp.com/ds/Images/graph-a.jpg'
        //'https://www.sec.gov/comments/sr-iex-2019-15/sriex201915.htm' // trusted error
        //'https://www.3i.com/infrastructure/' // multiple banners
        //'https://allarity.com/'
        //'https://www.dobs.pa.gov/Documents/Publications/Brochures/The%20Basics%20for%20Investing%20in%20Stocks.pdf'
        //'https://websites.umich.edu/~antigran/InteriorDesignBooks/ARCH%20X%20454A%20Elements%20of%20Design%20I/Art%20Fundamentals%20Theory%20and%20Practice,%2012th%20Edition%20by%20Otto%20G.%20Ocvirk,%20Robert%20Stinson,%20Philip%20R.%20Wigg,%20Robert%20O.%20Bone,%20David%20L.%20Cayton.pdf',
        //'file:///Users/scott/docs/learning-content/Random.pdf'
        'http://localhost:3000/Random.pdf'
    )

    //await crawler.testAsync(url);

    //await crawler.capturePageAsync({url});

    await crawler.convertPageAsync({url});


    // await crawler.searchAsync({
    //     term:'Apogee Therapeutics news',
    //     crawlOptions:{
    //         pageRequirementPrompt:'Should contain a full news article about Apogee Therapeutics',
    //     }
    // })

    // await crawler.runResearchAsync({
    //     searchOptions:{
    //         term:'Apogee Therapeutics news',
    //         crawlOptions:{
    //             pageRequirementPrompt:'Should contain a full news article about Apogee Therapeutics',
    //         },
    //     },
    //     searchResults:await readFileAsJsonAsync('convo-crawler-out/2024-06-06-22-38-2ea9dc0f-7b00-4db8-b15a-2136d57eecc8/search-1717728132813.json'),
    //     title:'Apogee Therapeutics news',
    //     subjects:[
    //         'New Treatments',
    //         'Saving costs',
    //         'Climate goals',
    //     ],
    //     conclusion:'How can Apogee Therapeutics improve profits next quarter'
    // })

    // await crawler.runResearchAsync({
    //     searchOptions:{
    //         term:'reds friday night fireworks',
    //     },
    //     title:'Friday Night Fireworks',
    //     subjects:[
    //         'Dates',
    //         'Who is playing',
    //         'View from the river',
    //     ],
    //     conclusion:'General'
    // })
}
