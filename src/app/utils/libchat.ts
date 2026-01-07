/* 
* This function injects the libanswers <script> for libchat into the current document. 
* This function is called by src/bootstrap.ts.  
*/

export function injectLibchat() {
    try {
        var libchatHash = "1e8f3119e6cff530e0d23e2cb1f2b2a7"; // hash string goes inside quotation marks
        var div = document.createElement("div");
        div.id = "libchat_" + libchatHash;
        document.getElementsByTagName("body")[0].appendChild(div);
        var scr = document.createElement("script");
        scr.src = "https://libanswers.mit.edu/load_chat.php?hash=" + libchatHash;
        setTimeout(function () {
            document.getElementsByTagName("body")[0].appendChild(scr);
        }, 2000);
    } catch (e) {
        // keep bootstrap silent on failures
    }
}
