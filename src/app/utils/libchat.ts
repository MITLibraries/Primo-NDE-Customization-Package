/* 
* This function injects the libanswers <script> for libchat into the current document. 
* This function is called by src/bootstrap.ts.  
*/

export function injectLibchat() {
    try {
        var libchatHash = "1e8f3119e6cff530e0d23e2cb1f2b2a7";
        var div = document.createElement("div");
        div.id = "libchat_" + libchatHash;
        document.body.appendChild(div);
        var scr = document.createElement("script");
        scr.src = "https://libanswers.mit.edu/load_chat.php?hash=" + libchatHash;
        // we added this error handling to the libanswers-provided script for libchat
        scr.onerror = (ev) => {
            console.error('Libchat script failed to load', scr.src, ev);
        };
        setTimeout(function () {
            document.body.appendChild(scr);
        }, 2000);
    } catch (e) {
        console.error('error injecting libchat', e)
    }
}
