const buildId = process.env.BUILD_ID ?? 'local';

if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(buildId)) {
    throw new Error('BUILD_ID must start with a letter or number and contain only letters, numbers, dots, underscores, or hyphens.');
}

module.exports = buildId;
