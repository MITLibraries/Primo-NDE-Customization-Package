//set the url of the server you want to test your code with and start the development server using the following command:
// ng serve --proxy-config ./proxy/proxy.conf.mjs
const environments = {
    'example': 'https://myPrimoVE.com',
    'sqa03-eu01': 'https://sqa03-eu01.alma.exlibrisgroup.com',
    'sqa-na03': 'https://sqa-na03.alma.exlibrisgroup.com/',
    'sqa-eu03': 'https://sqa-eu03.alma.exlibrisgroup.com/',
    'sqa-cn01': 'https://sqa-cn01.alma.exlibrisgroup.com.cn/'
};

export const PROXY_TARGET = environments['sqa-cn01'];
console.log(`[proxy] Active proxy target: ${PROXY_TARGET}`);