({
    appDir: 'client',
    baseUrl: '.',
    dir: 'client.build',
    removeCombined: true,
    optimize: 'none',
    paths: {
        'requireLib': 'vendor/require'
    },
    modules: [{
        name: 'game',
        include: 'requireLib'
    }]
})
