//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  transpilePackages: ['@mire/database', '@mire/blockchain', '@mire/ui'],
};

const plugins = [
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
