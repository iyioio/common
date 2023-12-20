const arnReg=/^arn:aws:sqs:([^:]+):([^:]+):(.*)$/i;
const urlReg=/^https:\/\/sqs.[^.]+.amazonaws.com\/[^/]+\/[^/]+$/i
export const getSqsUrl=(value:string):string|null=>{
    if(urlReg.test(value)){
        return value;
    }
    const arnMatch=arnReg.exec(value);
    if(arnMatch){
        return `https://sqs.${arnMatch[1]}.amazonaws.com/${arnMatch[2]}/${arnMatch[3]}`
    }
    return null;
}
