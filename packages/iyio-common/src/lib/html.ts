export const escapeHtml=(str:string):string=>
{
    if(!str){
        return '';
    }
    return str
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export const escapeHtmlKeepSingleQuote=(str:string):string=>
{
    if(!str){
        return '';
    }
    return str
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "'")
 }

export const escapeHtmlKeepDoubleQuote=(str:string):string=>
{
    if(!str){
        return '';
    }
    return str
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/'/g, "&#039;");
}

export const escapeHtmlKeepAmp=(str:string):string=>
{
    if(!str){
        return '';
    }
    return str
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export const unescapeHtml=(str:string):string=>{
    return unescapeReplaceHtml(str,false);
}

export const unescapeReplaceHtml=(str:string,allowLongEntities:boolean,replace?:(entity:string)=>string):string=>{
    return str.replace(allowLongEntities?
        /&([^;]*);/g:
        /&([^;]{0,15});/g,
        (_:string,v:string)=>{
        v=v.toLowerCase();
        const l=lookup[v];
        if(l){
            return replace?replace(l):l;
        }
        if(v[0]==='#'){
            try{
                let n=v.substring(1);
                if(n[0]==='x' || n[0]==='X'){
                    n='0'+n;
                }
                n=String.fromCharCode(Number(n))
                return replace?replace(n):n;
            }catch{
                //
            }
        }
        return replace?replace(_):_;
    })
}

const lookup:Record<string,string>={
    quot:'"',
    gt:'>',
    lt:'<',
    amp:'&',
    tab:'\t',
    nbsp:' ',
    newline:'\n',
    iexcl:'¡',
    cent:'¢',
    pound:'£',
    curren:'¤',
    yen:'¥',
    brvbar:'¦',
    sect:'§',
    uml:'¨',
    copy:'©',
    ordf:'ª',
    laquo:'«',
    not:'¬',
    reg:'®',
    macr:'¯',
    deg:'°',
    plusmn:'±',
    sup2:'²',
    sup3:'³',
    acute:'´',
    micro:'µ',
    para:'¶',
    dot:'·',
    cedil:'¸',
    sup1:'¹',
    ordm:'º',
    raquo:'»',
    frac14:'¼',
    frac12:'½',
    frac34:'¾',
    iquest:'¿',
    agrave:'À',
    aacute:'Á',
    acirc:'Â',
    atilde:'Ã',
    auml:'Ä',
    aring:'Å',
    aelig:'Æ',
    ccedil:'Ç',
    egrave:'È',
    eacute:'É',
    ecirc:'Ê',
    euml:'Ë',
    igrave:'Ì',
    iacute:'Í',
    icirc:'Î',
    iuml:'Ï',
    eth:'Ð',
    ntilde:'Ñ',
    ograve:'Ò',
    oacute:'Ó',
    ocirc:'Ô',
    otilde:'Õ',
    ouml:'Ö',
    times:'×',
    oslash:'Ø',
    ugrave:'Ù',
    uacute:'Ú',
    ucirc:'Û',
    uuml:'Ü',
    yacute:'Ý',
    thorn:'Þ',
    szlig:'ß',
    yuml:'ÿ',
    amacr:'Ā',
    abreve:'Ă',
    aogon:'Ą',
    cacute:'Ć',
    ccirc:'Ĉ',
    cdot:'Ċ',
    ccaron:'Č',
    dcaron:'Ď',
    dstrok:'Đ',
    emacr:'Ē',
    ebreve:'Ĕ',
    edot:'Ė',
    eogon:'Ę',
    ecaron:'Ě',
    gcirc:'Ĝ',
    gbreve:'Ğ',
    gdot:'Ġ',
    gcedil:'Ģ',
    hcirc:'Ĥ',
    hstrok:'Ħ',
    itilde:'Ĩ',
    imacr:'Ī',
    ibreve:'Ĭ',
    iogon:'Į',
    idot:'İ',
    imath:'ı',
    ijlig:'Ĳ',
    jcirc:'Ĵ',
    kcedil:'Ķ',
    kgreen:'ĸ',
    lacute:'Ĺ',
    lcedil:'Ļ',
    lcaron:'Ľ',
    lmidot:'Ŀ',
    lstrok:'Ł',
    nacute:'Ń',
    ncedil:'Ņ',
    ncaron:'Ň',
    napos:'ŉ',
    eng:'Ŋ',
    omacr:'Ō',
    obreve:'Ŏ',
    odblac:'Ő',
    oelig:'Œ',
    racute:'Ŕ',
    rcedil:'Ŗ',
    rcaron:'Ř',
    sacute:'Ś',
    scirc:'Ŝ',
    scedil:'Ş',
    scaron:'Š',
    tcedil:'Ţ',
    tcaron:'Ť',
    tstrok:'Ŧ',
    utilde:'Ũ',
    umacr:'Ū',
    ubreve:'Ŭ',
    uring:'Ů',
    udblac:'Ű',
    uogon:'Ų',
    wcirc:'Ŵ',
    ycirc:'Ŷ',
    fnof:'ƒ',
    circ:'ˆ',
    tilde:'˜',
    alpha:'Α',
    beta:'Β',
    gamma:'Γ',
    delta:'Δ',
    epsilon:'Ε',
    zeta:'Ζ',
    eta:'Η',
    theta:'Θ',
    iota:'Ι',
    kappa:'Κ',
    lambda:'Λ',
    mu:'Μ',
    nu:'Ν',
    xi:'Ξ',
    omicron:'Ο',
    pi:'Π',
    rho:'Ρ',
    sigma:'Σ',
    tau:'Τ',
    upsilon:'Υ',
    phi:'Φ',
    chi:'Χ',
    psi:'Ψ',
    omega:'Ω',
    thetasym:'ϑ',
    upsih:'ϒ',
    piv:'ϖ',
    ndash:'–',
    mdash:'—',
    lsquo:'‘',
    rsquo:'’',
    sbquo:'‚',
    ldquo:'“',
    rdquo:'”',
    bdquo:'„',
    dagger:'†',
    bull:'•',
    hellip:'…',
    permil:'‰',
    prime:'′',
    lsaquo:'‹',
    rsaquo:'›',
    oline:'‾',
    euro:'€',
    trade:'™',
    larr:'←',
    uarr:'↑',
    rarr:'→',
    darr:'↓',
    harr:'↔',
    crarr:'↵',
    forall:'∀',
    part:'∂',
    exist:'∃',
    empty:'∅',
    nabla:'∇',
    isin:'∈',
    notin:'∉',
    ni:'∋',
    prod:'∏',
    sum:'∑',
    minus:'−',
    lowast:'∗',
    radic:'√',
    prop:'∝',
    infin:'∞',
    ang:'∠',
    and:'∧',
    or:'∨',
    cap:'∩',
    cup:'∪',
    int:'∫',
    there4:'∴',
    sim:'∼',
    cong:'≅',
    asymp:'≈',
    ne:'≠',
    equiv:'≡',
    le:'≤',
    ge:'≥',
    sub:'⊂',
    sup:'⊃',
    nsub:'⊄',
    sube:'⊆',
    supe:'⊇',
    oplus:'⊕',
    otimes:'⊗',
    perp:'⊥',
    sdot:'⋅',
    lceil:'⌈',
    rceil:'⌉',
    lfloor:'⌊',
    rfloor:'⌋',
    loz:'◊',
    spades:'♠',
    clubs:'♣',
    hearts:'♥',
    diams:'♦',
    ensp:'\u8194',
    emsp:'\u8195',
    thinsp:'\u8201',
    zwnj:'\u8204',
    zwj:'\u8205',
    lrm:'\u8206',
    rlm:'\u8207',
    shy:'\u0173',
}
