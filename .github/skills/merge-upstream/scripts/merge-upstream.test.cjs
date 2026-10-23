const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const script = path.join(__dirname, 'merge-upstream.sh');
const originUrl = 'https://github.com/MITLibraries/Primo-NDE-Customization-Package.git';
const upstreamUrl = 'https://github.com/ExLibrisGroup/customModule.git';

function run(command, args, cwd, env, expected = 0) {
    const result = spawnSync(command, args, { cwd, env, encoding: 'utf8' });
    assert.equal(result.status, expected,
        `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    return result.stdout.trim();
}

// Uncompressed ZIP fixtures keep the tests independent of npm dependencies.
function writeZip(file, names) {
    const locals = [];
    const records = [];
    let offset = 0;
    for (const name of names) {
        const filename = Buffer.from(name);
        const data = Buffer.from('fixture\n');
        let crc = 0xffffffff;
        for (const byte of data) {
            crc ^= byte;
            for (let bit = 0; bit < 8; bit++) {
                crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
            }
        }
        crc = (crc ^ 0xffffffff) >>> 0;
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50);
        local.writeUInt16LE(20, 4);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(data.length, 18);
        local.writeUInt32LE(data.length, 22);
        local.writeUInt16LE(filename.length, 26);
        locals.push(local, filename, data);
        const central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50);
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(data.length, 20);
        central.writeUInt32LE(data.length, 24);
        central.writeUInt16LE(filename.length, 28);
        central.writeUInt32LE(offset, 42);
        records.push(central, filename);
        offset += local.length + filename.length + data.length;
    }
    const directory = Buffer.concat(records);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50);
    end.writeUInt16LE(names.length, 8);
    end.writeUInt16LE(names.length, 10);
    end.writeUInt32LE(directory.length, 12);
    end.writeUInt32LE(offset, 16);
    fs.writeFileSync(file, Buffer.concat([...locals, directory, end]));
}

function fixture(t, { conflict = false, integrated = false } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-upstream-test-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const bin = path.join(dir, 'bin');
    fs.mkdirSync(bin);
    const env = {
        ...process.env,
        GIT_CONFIG_GLOBAL: path.join(dir, 'gitconfig'),
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_AUTHOR_NAME: 'Test Author',
        GIT_AUTHOR_EMAIL: 'author@example.invalid',
        GIT_COMMITTER_NAME: 'Test Author',
        GIT_COMMITTER_EMAIL: 'author@example.invalid',
        GIT_EDITOR: 'false',
        PATH: `${bin}:${process.env.PATH}`,
        TEST_DIR: dir,
    };
    const git = (cwd, ...args) => run('git', args, cwd, env);
    const write = (cwd, name, content) => fs.writeFileSync(path.join(cwd, name), content);
    const commit = (cwd, name, content) => {
        write(cwd, name, content);
        git(cwd, 'add', '--', name);
        git(cwd, 'commit', '-m', `Update ${name}`);
    };
    git(dir, 'config', '--global', 'protocol.file.allow', 'always');
    for (const [url, name] of [[originUrl, 'origin.git'], [upstreamUrl, 'upstream.git']]) {
        git(dir, 'init', '--bare', name);
        git(dir, 'config', '--global', `url.file://${dir}/${name}.insteadOf`, url);
    }
    git(dir, 'init', '-b', 'main', 'seed');
    const seed = path.join(dir, 'seed');
    write(seed, '.gitignore', 'node_modules/\ndist/\n');
    write(seed, 'build-settings.env', 'INST_ID=01MIT_INST\nVIEW_ID=NDE\n');
    write(seed, 'package.json', '{}\n');
    write(seed, 'package-lock.json', '{}\n');
    write(seed, 'shared.txt', 'base\n');
    git(seed, 'add', '.');
    git(seed, 'commit', '-m', 'Common ancestor');
    git(seed, 'push', originUrl, 'HEAD:refs/heads/main', 'HEAD:refs/heads/mit-main');
    git(seed, 'push', upstreamUrl, 'HEAD:refs/heads/main');
    const supplier = path.join(dir, 'supplier');
    git(dir, 'clone', '--branch', 'main', upstreamUrl, supplier);
    if (!integrated) {
        commit(supplier, conflict ? 'shared.txt' : 'upstream.txt', 'upstream\n');
        git(supplier, 'push', 'origin', 'main');
    }
    commit(seed, conflict ? 'shared.txt' : 'mit.txt', 'MIT\n');
    git(seed, 'push', originUrl, 'HEAD:refs/heads/mit-main');
    const work = path.join(dir, 'work');
    git(dir, 'clone', '--branch', 'mit-main', originUrl, work);
    const shim = (name, content) => {
        fs.writeFileSync(path.join(bin, name), `#!/usr/bin/env bash\nset -euo pipefail\n${content}\n`,
            { mode: 0o755 });
    };
    shim('node', `if [[ \${1:-} == --version ]]; then echo "\${TEST_NODE_VERSION:-v24.0.0}"; else exec "${process.execPath}" "$@"; fi`);
    shim('npm', `
printf '%s\\n' "$*" >> "$TEST_DIR/npm.log"
if [[ \${TEST_NPM_FAIL:-} == "\${1:-}" ]]; then exit 1; fi
case "$*" in
  ci) mkdir -p node_modules ;;
  'test -- --no-watch --browsers=ChromeHeadless') ;;
  'run build')
    [[ $VIEW_ID == NDE_DEV && $INST_ID == 01MIT_INST ]]
    if [[ \${TEST_SKIP_BUILD:-} != yes ]]; then
      mkdir -p dist
      cp "$TEST_DIR/package.zip" dist/01MIT_INST-NDE_DEV.zip
    fi
    if [[ \${TEST_MUTATE:-} == yes ]]; then echo generated >> shared.txt; fi ;;
  *) exit 99 ;;
esac`);
    shim('gh', `
printf '%s\\n' "$*" >> "$TEST_DIR/gh.log"
case "$1 $2" in
  'auth status') ;;
  'pr list') if [[ -f $TEST_DIR/pr-url ]]; then cat "$TEST_DIR/pr-url"; fi ;;
  'pr edit') ;;
  'pr create')
    if [[ \${TEST_PR_FAIL:-} == yes ]]; then exit 1; fi
    echo 'https://github.com/MITLibraries/Primo-NDE-Customization-Package/pull/999' | tee "$TEST_DIR/pr-url" ;;
  *) exit 99 ;;
esac`);
    writeZip(path.join(dir, 'package.zip'), [
        '01MIT_INST-NDE_DEV/remoteEntry.js',
        '01MIT_INST-NDE_DEV/assets/custom.css',
    ]);
    const invoke = (args, expected = 0, extra = {}) =>
        run('bash', [script, ...args], work, { ...env, ...extra }, expected);
    const stateFile = path.join(work, '.git', 'merge-upstream', 'state');
    const state = key => git(work, 'config', '--file', stateFile, '--get', `merge.${key}`);
    const finalize = () => {
        const message = path.join(dir, 'message.txt');
        fs.writeFileSync(message, `Merge upstream ${state('upstream')}\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>\n`);
        invoke(['finalize', message]);
    };
    const publish = (expected = 0, extra = {}) => {
        const body = path.join(dir, 'pr.txt');
        fs.writeFileSync(body, 'Changes and validation results\n');
        return invoke(['publish', '--approved', git(work, 'rev-parse', 'HEAD'),
            '--title', 'Merge upstream', '--body-file', body], expected, extra);
    };
    return { dir, env, work, seed, supplier, git, write, commit, invoke, state, finalize, publish };
}

test('prepare guards dirty trees, active operations, and incorrect origin URLs', t => {
    const f = fixture(t);
    f.write(f.work, 'untracked.txt', 'user work\n');
    f.invoke(['prepare'], 1);
    assert.equal(f.git(f.work, 'branch', '--show-current'), 'mit-main');
    fs.unlinkSync(path.join(f.work, 'untracked.txt'));
    f.write(path.join(f.work, '.git'), 'CHERRY_PICK_HEAD', f.git(f.work, 'rev-parse', 'HEAD'));
    f.invoke(['prepare'], 1);
    fs.unlinkSync(path.join(f.work, '.git', 'CHERRY_PICK_HEAD'));
    f.git(f.work, 'remote', 'set-url', '--push', 'origin', 'https://example.invalid/wrong.git');
    f.invoke(['prepare'], 1);
    assert.equal(f.git(f.work, 'branch', '--show-current'), 'mit-main');
});

test('already-integrated upstream exits 10 without creating a branch', t => {
    const f = fixture(t, { integrated: true });
    assert.match(f.invoke(['prepare'], 10), /ALREADY_INTEGRATED/);
    assert.equal(f.git(f.work, 'branch', '--show-current'), 'mit-main');
});

test('clean merge is resumable, validates exact tree, commits, and publishes idempotently', t => {
    const f = fixture(t);
    f.invoke(['prepare']);
    assert.match(f.invoke(['status']), /branch=upstream\/merge-/);
    f.invoke(['prepare'], 1);
    f.invoke(['finalize', '/nonexistent-message'], 1);
    const message = path.join(f.dir, 'message.txt');
    fs.writeFileSync(message, `Merge ${f.state('upstream')}\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>\n`);
    f.invoke(['finalize', message], 13);
    f.invoke(['validate']);
    assert.match(fs.readFileSync(path.join(f.dir, 'npm.log'), 'utf8'), /^ci\ntest -- --no-watch --browsers=ChromeHeadless\nrun build\n$/);
    f.write(f.work, 'upstream.txt', 'reviewed upstream\n');
    f.git(f.work, 'add', 'upstream.txt');
    f.invoke(['finalize', message], 13);
    f.invoke(['validate']);
    f.finalize();
    const head = f.git(f.work, 'rev-parse', 'HEAD');
    assert.equal(f.git(f.work, 'rev-list', '--parents', '-n', '1', 'HEAD').split(' ').length, 3);
    f.git(f.work, 'merge-base', '--is-ancestor', f.state('base'), head);
    f.git(f.work, 'merge-base', '--is-ancestor', f.state('upstream'), head);
    assert.equal(f.git(f.work, 'status', '--porcelain'), '');
    assert.equal(fs.existsSync(path.join(f.dir, 'gh.log')), false);
    assert.match(f.git(f.work, 'ls-remote', '--heads', 'origin'), /refs\/heads\/mit-main/);
    f.git(f.work, 'config', 'push.followTags', 'true');
    f.git(f.work, 'tag', '-a', 'local-only', '-m', 'Do not publish this tag');
    f.publish();
    assert.equal(f.git(f.work, 'ls-remote', 'origin', `refs/heads/${f.state('branch')}`).split(/\s/)[0], head);
    assert.equal(f.git(f.work, 'ls-remote', '--tags', 'origin'), '');
    assert.equal(f.git(f.work, 'ls-remote', 'origin', 'refs/heads/mit-main').split(/\s/)[0], f.state('base'));
    f.publish();
    const calls = fs.readFileSync(path.join(f.dir, 'gh.log'), 'utf8');
    assert.equal(calls.split('\n').filter(line => line.startsWith('pr create ')).length, 1);
    assert.match(calls, /^pr edit .*--body-file /m);
    assert.match(calls, /--base mit-main --head upstream\/merge-/);
});

test('conflicts exit 11 and resume after individual resolution', t => {
    const f = fixture(t, { conflict: true });
    f.invoke(['prepare'], 11);
    f.invoke(['status'], 11);
    f.invoke(['validate'], 11);
    f.write(f.work, 'shared.txt', 'MIT and upstream\n');
    f.git(f.work, 'add', 'shared.txt');
    f.invoke(['validate']);
    f.finalize();
    assert.equal(fs.readFileSync(path.join(f.work, 'shared.txt'), 'utf8'), 'MIT and upstream\n');
});

test('branch collisions preserve existing local and remote branches', t => {
    const f = fixture(t);
    const stem = `upstream/merge-${new Date().toISOString().slice(0, 10)}`;
    f.git(f.work, 'branch', stem);
    f.git(f.work, 'push', 'origin', `HEAD:refs/heads/${stem}-1`);
    const original = f.git(f.work, 'rev-parse', stem);
    f.invoke(['prepare']);
    assert.equal(f.state('branch'), `${stem}-2`);
    assert.equal(f.git(f.work, 'rev-parse', stem), original);
});

test('validation failures and generated source changes cannot be finalized', t => {
    const f = fixture(t);
    f.invoke(['prepare']);
    f.invoke(['validate'], 13, { TEST_NODE_VERSION: 'v22.0.0' });
    f.invoke(['validate'], 13, { TEST_NPM_FAIL: 'ci' });
    f.invoke(['validate'], 13, { TEST_NPM_FAIL: 'test' });
    assert.equal(f.state('validated-tree'), '');
    f.invoke(['validate'], 13, { TEST_NPM_FAIL: 'run' });
    f.invoke(['validate']);
    f.invoke(['validate'], 13, { TEST_SKIP_BUILD: 'yes' });
    fs.writeFileSync(path.join(f.dir, 'package.zip'), 'not a zip');
    f.invoke(['validate'], 13);
    writeZip(path.join(f.dir, 'package.zip'), ['wrong/remoteEntry.js']);
    f.invoke(['validate'], 13);
    writeZip(path.join(f.dir, 'package.zip'), ['01MIT_INST-NDE_DEV/remoteEntry.js']);
    f.invoke(['validate'], 13);
    writeZip(path.join(f.dir, 'package.zip'), [
        '01MIT_INST-NDE_DEV/remoteEntry.js', '01MIT_INST-NDE_DEV/assets/custom.css',
    ]);
    f.invoke(['validate'], 13, { TEST_MUTATE: 'yes' });
    assert.equal(f.state('validated-tree'), '');
});

test('wrong branch and externally changed HEAD are rejected', t => {
    const f = fixture(t);
    f.invoke(['prepare']);
    f.invoke(['validate']);
    f.finalize();
    f.git(f.work, 'switch', 'mit-main');
    f.invoke(['status'], 1);
    f.git(f.work, 'switch', f.state('branch'));
    f.commit(f.work, 'extra.txt', 'outside workflow\n');
    f.invoke(['status'], 1);
});

test('advanced base blocks publication, refresh invalidates validation and approval', t => {
    const f = fixture(t);
    f.invoke(['prepare']);
    f.invoke(['validate']);
    f.finalize();
    const approved = f.git(f.work, 'rev-parse', 'HEAD');
    f.commit(f.seed, 'new-mit.txt', 'new MIT base\n');
    f.git(f.seed, 'push', originUrl, 'HEAD:refs/heads/mit-main');
    f.publish(12);
    assert.equal(fs.existsSync(path.join(f.dir, 'gh.log')), false);
    f.invoke(['refresh']);
    assert.equal(f.state('validated-tree'), '');
    f.invoke(['validate']);
    f.finalize();
    const body = path.join(f.dir, 'pr.txt');
    f.invoke(['publish', '--approved', approved, '--title', 'Old approval', '--body-file', body], 1);
    f.publish();
    assert.equal(fs.readFileSync(path.join(f.work, 'new-mit.txt'), 'utf8'), 'new MIT base\n');
});

test('failed PR creation remains retryable after a successful branch push', t => {
    const f = fixture(t);
    f.invoke(['prepare']);
    f.invoke(['validate']);
    f.finalize();
    f.publish(1, { TEST_PR_FAIL: 'yes' });
    assert.equal(f.state('published'), 'false');
    f.publish();
    assert.equal(f.state('published'), 'true');
});

test('fetch failures leave the original branch untouched', t => {
    const f = fixture(t);
    f.git(f.work, 'config', '--global', '--unset-all', `url.file://${f.dir}/upstream.git.insteadOf`);
    f.git(f.work, 'config', '--global',
        `url.file://${f.dir}/missing.git.insteadOf`, upstreamUrl);
    f.invoke(['prepare'], 1);
    assert.equal(f.git(f.work, 'branch', '--show-current'), 'mit-main');
    assert.equal(f.git(f.work, 'status', '--porcelain'), '');
});

test('existing dependencies are reused unless manifests changed', t => {
    const f = fixture(t);
    fs.mkdirSync(path.join(f.work, 'node_modules'));
    f.git(f.work, 'remote', 'set-url', 'origin',
        'git@github.com:MITLibraries/Primo-NDE-Customization-Package.git');
    f.git(f.work, 'config', '--global', `url.file://${f.dir}/origin.git.insteadOf`,
        'git@github.com:MITLibraries/Primo-NDE-Customization-Package.git');
    f.invoke(['prepare']);
    f.invoke(['validate']);
    assert.doesNotMatch(fs.readFileSync(path.join(f.dir, 'npm.log'), 'utf8'), /^ci$/m);
    f.write(f.work, 'package.json', '{"changed":true}\n');
    f.git(f.work, 'add', 'package.json');
    f.invoke(['validate']);
    assert.match(fs.readFileSync(path.join(f.dir, 'npm.log'), 'utf8'), /^ci$/m);
});

test('linked worktrees keep workflow state outside the shared Git directory', t => {
    const f = fixture(t);
    const linked = path.join(f.dir, 'linked');
    f.git(f.work, 'worktree', 'add', '-b', 'linked-start', linked, 'mit-main');
    run('bash', [script, 'prepare'], linked, f.env);
    assert.match(run('bash', [script, 'status'], linked, f.env), /branch=upstream\/merge-/);
    assert.equal(fs.existsSync(path.join(f.work, '.git', 'merge-upstream', 'state')), false);
    const stateDir = f.git(linked, 'rev-parse', '--path-format=absolute', '--git-path', 'merge-upstream');
    assert.equal(fs.existsSync(path.join(stateDir, 'state')), true);
});

test('prepare completes even when switching branches removes the running script', t => {
    const f = fixture(t);
    f.commit(f.work, 'workflow.sh', fs.readFileSync(script, 'utf8'));
    run('bash', ['workflow.sh', 'prepare'], f.work, f.env);
    assert.equal(fs.existsSync(path.join(f.work, 'workflow.sh')), false);
    assert.match(f.invoke(['status']), /branch=upstream\/merge-/);
});

test('refresh conflicts resume through validation and finalization', t => {
    const f = fixture(t);
    f.commit(f.supplier, 'shared.txt', 'upstream edit\n');
    f.git(f.supplier, 'push', 'origin', 'main');
    f.invoke(['prepare']);
    f.invoke(['validate']);
    f.finalize();
    f.commit(f.seed, 'shared.txt', 'new MIT edit\n');
    f.git(f.seed, 'push', originUrl, 'HEAD:refs/heads/mit-main');
    f.publish(12);
    f.invoke(['refresh'], 11);
    f.invoke(['validate'], 11);
    f.write(f.work, 'shared.txt', 'reviewed MIT and upstream edits\n');
    f.git(f.work, 'add', 'shared.txt');
    f.invoke(['validate']);
    f.finalize();
    f.publish();
});

test('rewritten remote base stops refresh without resetting the integration branch', t => {
    const f = fixture(t);
    f.invoke(['prepare']);
    f.invoke(['validate']);
    f.finalize();
    const head = f.git(f.work, 'rev-parse', 'HEAD');
    const ancestor = f.git(f.seed, 'rev-parse', 'HEAD^');
    f.git(f.dir, '--git-dir', path.join(f.dir, 'origin.git'),
        'update-ref', 'refs/heads/mit-main', ancestor);
    f.invoke(['refresh'], 1);
    assert.equal(f.git(f.work, 'rev-parse', 'HEAD'), head);
    assert.equal(f.git(f.work, 'status', '--porcelain'), '');
});
