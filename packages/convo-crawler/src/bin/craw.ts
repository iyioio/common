
import { aiCompleteConvoModule } from "@iyio/ai-complete";
//import { aiCompleteLambdaModule } from "@iyio/ai-complete-lambda";
import { openAiModule } from "@iyio/ai-complete-openai";
import { EnvParams, ScopeRegistration, getErrorMessage, initRootScope, parseCliArgsT, rootScope } from "@iyio/common";
import { ConvoWebCrawler } from "../lib/ConvoWebCrawler";
import { ConvoWebSearchResult } from "../lib/convo-web-crawler-types";
import { loadTmpEnv } from "../tmp/tmp-env";
import { startTmpTunnelAsync, stopTmpTunnelAsync } from "../tmp/tmp-ngrok";



interface Args
{
    /**
     * Scrapes a url
     */
    url?:string;

    /**
     * Preforms a google search and scrapes top search result
     */
    search?:string;

    pageRequirement?:string;

    researchTitle?:string;

    researchSubject?:string[];

    researchConclusion?:string;

    autoTunnel:boolean;

    dev?:boolean;

    debug?:boolean;
}

const args=parseCliArgsT<Args>({
    args:process.argv,
    startIndex:2,
    converter:{
        url:args=>args[0],
        search:args=>args[0],
        pageRequirement:args=>args[0],
        researchTitle:args=>args[0],
        researchSubject:args=>args,
        researchConclusion:args=>args[0],
        autoTunnel:args=>args.length?true:false,
        dev:args=>args.length?true:false,
        debug:args=>args.length?true:false,
    }
}).parsed as Args

loadTmpEnv();

const main=async ()=>{

    let exitCode=0;

    initRootScope((reg:ScopeRegistration)=>{

        reg.addParams(new EnvParams())

        //reg.use(aiCompleteLambdaModule);
        reg.use(openAiModule);// For testing locally

        reg.use(aiCompleteConvoModule);


    });
    await rootScope.getInitPromise();

    let httpAccessPoint:string|undefined;
    if(args.autoTunnel){
        httpAccessPoint=await startTmpTunnelAsync();
        if(httpAccessPoint.endsWith('/')){
            httpAccessPoint=httpAccessPoint.substring(0,httpAccessPoint.length-1);
        }
        console.info(`Tunnel URL ${httpAccessPoint}`)
    }

    const crawler=new ConvoWebCrawler({
        googleSearchApiKey:process.env['NX_GOOGLE_SEARCH_API_KEY'],
        googleSearchCx:process.env['NX_GOOGLE_SEARCH_CX'],
        headed:true,
        httpAccessPoint,
        debug:args.debug
    });

    try{

        let done=false;

        if(args.dev){
            done=true;
            const url=(
                //'https://investors.apogeetherapeutics.com/news-releases/news-release-details/apogee-announces-positive-interim-results-phase-1-healthy'
                //'https://investors.apogeetherapeutics.com/news-releases/news-release-details/apogee-therapeutics-expands-board-directors-appointment-lisa'
                //'https://investors.apogeetherapeutics.com/news-events/news'
                //'https://www.prnewswire.com/news-releases/apogee-therapeutics-launches-with-169-million-to-develop-potentially-best-in-class-therapies-for-immunological-and-inflammatory-disorders-301696381.html'
                //'https://www.sec.gov/ixviewer/ix.html?doc=/Archives/edgar/data/0001018724/000101872424000083/amzn-20240331.htm'
                'https://www.sec.gov/ix?doc=/Archives/edgar/data/0001018724/000101872424000083/amzn-20240331.htm' // with iframe
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

        if(args.url){
            await crawler.convertPageAsync({url:args.url});
            done=true;
        }

        let searchResults:ConvoWebSearchResult|undefined;

        if(args.search){
            searchResults=await crawler.searchAsync({
                term:args.search,
                crawlOptions:{
                    pageRequirementPrompt:args.pageRequirement
                }
            })
            done=true;
        }

        if(args.researchTitle || args.researchConclusion || args.researchSubject){
            if(!searchResults){
                console.error('--search required');
                exitCode=1;
                return;
            }

            if(!args.researchTitle){
                console.error('--researchTitle required');
                exitCode=1;
                return;
            }

            if(!args.researchConclusion){
                console.error('--researchConclusion required');
                exitCode=1;
                return;
            }

            if(!args.researchSubject){
                console.error('--researchSubject required');
                exitCode=1;
                return;
            }

            await crawler.runResearchAsync({
                title:args.researchTitle,
                subjects:args.researchSubject,
                conclusion:args.researchConclusion,
                searchResults,
            });
            done=true;
        }

        if(done){
            console.info('Done');
        }else{
            console.info(`Usage:
--url                 [ url ]         scrape a URL
--search              [ term ]        preforms a search and scrapes the top results
--pageRequirement     [ prompt ]      A prompt that is used to check if a page should be scraped
--researchTitle       [ title ]       Title for research document
--researchSubject     [ subject ]     A subject that should be searched. Multiple subjects can be researched by supplying multiple --researchSubject arguments
--researchConclusion  [ conclusion ]  The conclusion that should be derived from research
--autoTunnel                          Opens a temporary Ngrok tunnel for relaying images to external LLMs
--debug                               Print debug information


Scrape a single URL:
convo-web --url https://example.com


Search for a web pages about going fast:
convo-web --search 'go fast turn left' --pageRequirement 'The page should be related to driving fast'


Research Nuclear fusion reactors
convo-web \\
    --search 'Nuclear fusion reactors' \\
    --pageRequirement 'The page should contain information about Nuclear fusion reactor that are currently under development or operating' \\
    --researchTitle 'The power of a star' \\
    --researchSubject 'Operating reactors' \\
    --researchSubject 'Reactors under development' \\
    --researchSubject 'Net gain' \\
    --researchConclusion 'How long will it take until we have net energy gains'


`)
        }

    }catch(ex){
        console.error('Crawler failed')
        console.error(getErrorMessage(ex));
        console.error('stack',(ex as any)?.stack);
        throw ex;
    }finally{
        if(args.autoTunnel){
            await stopTmpTunnelAsync();
        }
        process.exit(exitCode);
    }


}

main();

