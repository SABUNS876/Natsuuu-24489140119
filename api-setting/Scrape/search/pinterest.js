const fetch = require('node-fetch');

const pint = async (query) => {
    const response = await fetch("https://www.pinterest.com/resource/BaseSearchResource/get/?data=" + encodeURIComponent('{"options":{"query":"' + encodeURIComponent(query) + '"}}'), {
        "headers": {
            "screen-dpr": "4",
            "x-pinterest-pws-handler": "www/search/[scope].js",
        },
        "method": "head"
    });
    
    if (!response.ok) throw new Error(`Error ${response.status} ${response.statusText}`);
    const rhl = response.headers.get("Link");
    if (!rhl) throw new Error(`Search results for "${query}" are empty`);
    
    const links = [...rhl.matchAll(/<(.*?)>/gm)].map(v => v[1]);
    return links;
};

// Example usage
pint("furina")
    .then(console.log)
    .catch(err => console.log(err.message));

module.exports = pint;
