module.exports = {
    apps: [
        {
            name: 'smart-bottle-dev',
            script: 'bin/www',
            instances: 2,
            exec_mode: 'cluster',
            listen_timeout: 50000,
            kill_timeout: 5000,
            env: {
                APPLICATION_STATUS: 'development',
                DATABASE_HOST: "211.192.7.222",
                DATABASE_USER: "rudwo",
                DATABASE_PASSWORD: "rudwo1!",
                DATABASE_PORT: 3306,
                DATABASE_DATABASE: "smart_bottle",
                PORT: 3000,
                MEDIAPATH: "./uploads"
            }
        },
        {
            name: 'smart-bottle-prod',
            script: 'bin/www',
            instances: 5,
            exec_mode: 'cluster',
            listen_timeout: 50000,
            kill_timeout: 5000,
            env: {
                APPLICATION_STATUS: 'production',
                DATABASE_HOST: "211.192.7.222",
                DATABASE_USER: "rudwo",
                DATABASE_PASSWORD: "rudwo1!",
                DATABASE_PORT: 3306,
                DATABASE_DATABASE: "smart_bottle",
                PORT: 3000,
                MEDIAPATH: "./uploads"
            }
        }
    ]
}
