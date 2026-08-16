const test = require('node:test');
const assert = require('node:assert/strict');

test('resolveCustomModuleManifestPath handles IZ manifest requests and ignores central package manifests', async () => {
  const { resolveCustomModuleManifestPath, isCustomModuleAssetManifestRequest, shouldProxyLandingPageAssetRequest } = await import('../proxy/proxy-utils.mjs');

  const manifestPath = resolveCustomModuleManifestPath('/custom/TEST_INST-TEST_VIEW/asset-manifest.json', 'dist/custom-module');
  assert.equal(manifestPath, 'dist/custom-module/asset-manifest.json');

  const centralManifestPath = resolveCustomModuleManifestPath('/custom/TEST_NZ-CENTRAL_PACKAGE/asset-manifest.json', 'dist/custom-module');
  assert.equal(centralManifestPath, null);

  assert.equal(isCustomModuleAssetManifestRequest('/custom/TEST_INST-TEST_VIEW/asset-manifest.json'), true);
  assert.equal(isCustomModuleAssetManifestRequest('/custom/TEST_NZ-CENTRAL_PACKAGE/asset-manifest.json'), false);
  assert.equal(isCustomModuleAssetManifestRequest('/custom/TEST_INST-TEST_VIEW/CENTRAL_CODE.txt'), false);
  assert.equal(isCustomModuleAssetManifestRequest('/custom/TEST_INST-TEST_VIEW/assets/example.png'), false);

  assert.equal(shouldProxyLandingPageAssetRequest('/custom/TEST_INST-TEST_VIEW/assets/landingpage/icon.svg'), true);
  assert.equal(shouldProxyLandingPageAssetRequest('/nde/custom/TEST_INST-TEST_VIEW/assets/landingpage/search.svg'), true);
  assert.equal(shouldProxyLandingPageAssetRequest('/custom/TEST_INST-TEST_VIEW/assets/homepage/homepage.css'), true);
  assert.equal(shouldProxyLandingPageAssetRequest('/nde/custom/TEST_INST-TEST_VIEW/assets/homepage/homepage_de.html'), true);
  assert.equal(shouldProxyLandingPageAssetRequest('/custom/TEST_INST-TEST_VIEW/assets/main.js'), false);
});

test('createMergedAssetManifest merges dynamic IZ proxy sources and derives directories from files', async () => {
  const { createMergedAssetManifest, normalizeManifestPath, addParentDirectories } = await import('../proxy/proxy-utils.mjs');

  const manifestA = {
    files: ['assets/css/custom.css', 'assets/images/a.svg'],
    directories: ['assets', 'assets/css', 'assets/images']
  };

  const manifestB = {
    files: ['assets/css/custom.css', 'assets/images/b.svg'],
    directories: ['assets', 'assets/css', 'assets/images']
  };

  const merged = createMergedAssetManifest([manifestA, manifestB]);

  assert.deepEqual(merged.files, ['assets/css/custom.css', 'assets/images/a.svg', 'assets/images/b.svg']);
  assert.deepEqual(merged.directories, ['assets', 'assets/css', 'assets/images']);

  const filePath = 'C:\\env\\nde\\mainCustomModule\\dist\\customModule\\assets\\images\\logo.svg';
  assert.equal(normalizeManifestPath(filePath, 'C:\\env\\nde\\mainCustomModule\\dist\\customModule'), 'assets/images/logo.svg');

  const derived = addParentDirectories(['assets/images/icons/test.svg']);
  assert.deepEqual(derived, ['assets', 'assets/images', 'assets/images/icons']);
});
