/**
 * Loads the MIT LibChat widget into the page
 * Includes duplicate check to prevent multiple instances
 */
export function loadLibChatWidget(): void {
  const LIBCHAT_HASH = '1e8f3119e6cff530e0d23e2cb1f2b2a7';

  // Check if LibChat is already loaded
  if (document.getElementById(`libchat_${LIBCHAT_HASH}`)) {
    console.log('LibChat widget already loaded');
    return;
  }

  // Create the libchat div
  const div = document.createElement('div');
  div.id = `libchat_${LIBCHAT_HASH}`;
  document.body.appendChild(div);

  // Load the libchat script
  const script = document.createElement('script');
  script.src = `https://libanswers.mit.edu/load_chat.php?hash=${LIBCHAT_HASH}`;
  document.body.appendChild(script);
  console.log('LibChat widget loaded');
}
