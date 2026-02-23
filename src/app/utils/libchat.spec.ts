import { loadLibChatWidget } from "./libchat"

describe('loadLibChatWidget', () => {
    const LIBCHAT_HASH = '1e8f3119e6cff530e0d23e2cb1f2b2a7';

    beforeEach(() => {
        // Clean up any existing LibChat elements before each test
        const existingDiv = document.getElementById(`libchat_${LIBCHAT_HASH}`);
        if (existingDiv) {
            existingDiv.remove();
        }

        const existingScripts = document.querySelectorAll('script[src*="load_chat.php"]');
        existingScripts.forEach(script => script.remove());
    });

    afterEach(() => {
        // Clean up after each test
        const div = document.getElementById(`libchat_${LIBCHAT_HASH}`);
        if (div) {
            div.remove();
        }

        const scripts = document.querySelectorAll('script[src*="load_chat.php"]');
        scripts.forEach(script => script.remove());
    });

    it('should create a div with the correct libchat ID', () => {
        loadLibChatWidget();

        const div = document.getElementById(`libchat_${LIBCHAT_HASH}`);
        expect(div).toBeTruthy();
        expect(div?.tagName).toBe('DIV');
    });

    it('should append the div to the body', () => {
        loadLibChatWidget();

        const div = document.getElementById(`libchat_${LIBCHAT_HASH}`);
        expect(div?.parentElement).toBe(document.body);
    });

    it('should load the script immediately', () => {
        loadLibChatWidget();

        const script = document.querySelector('script[src*="load_chat.php"]');
        expect(script).toBeTruthy();
        expect(script?.getAttribute('src')).toBe(`https://libanswers.mit.edu/load_chat.php?hash=${LIBCHAT_HASH}`);
    });

    it('should append the script to the body', () => {
        loadLibChatWidget();

        const script = document.querySelector('script[src*="load_chat.php"]');
        expect(script?.parentElement).toBe(document.body);
    });

    it('should not create duplicate divs if called multiple times', () => {
        loadLibChatWidget();
        loadLibChatWidget();
        loadLibChatWidget();

        const divs = document.querySelectorAll(`#libchat_${LIBCHAT_HASH}`);
        expect(divs.length).toBe(1);
    });

    it('should not load duplicate scripts if called multiple times', () => {
        loadLibChatWidget();
        loadLibChatWidget();
        loadLibChatWidget();

        const scripts = document.querySelectorAll('script[src*="load_chat.php"]');
        expect(scripts.length).toBe(1);
    });

    it('should log message when widget is already loaded', () => {
        spyOn(console, 'log');

        loadLibChatWidget();
        loadLibChatWidget();

        expect(console.log).toHaveBeenCalledWith('LibChat widget already loaded');
    });

    it('should log message when widget is successfully loaded', () => {
        spyOn(console, 'log');

        loadLibChatWidget();

        expect(console.log).toHaveBeenCalledWith('LibChat widget loaded');
    });

    it('should use the correct LibChat hash in the script URL', () => {
        loadLibChatWidget();

        const script = document.querySelector('script[src*="load_chat.php"]');
        expect(script?.getAttribute('src')).toContain(LIBCHAT_HASH);
    });
});