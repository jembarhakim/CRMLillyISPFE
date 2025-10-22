module.exports = {
  apps: [
    {
      name: 'crm-frontend',
      port: '3000',
      exec_mode: 'cluster',
      instances: '1',
      script: './.output/server/index.mjs',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}

