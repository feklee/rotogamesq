({
    baseUrl: '.',
    appDir: 'client',
    dir: 'client.build',
    removeCombined: true,
    optimize: 'none',
    wrap: true,
    name: 'vendor/almond',
    include: ['game'],
    insertRequire: ['game']
})
