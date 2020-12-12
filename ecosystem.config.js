module.exports = {
    apps: [{
        "name": "Tasarım Uygulamaları Back-end",
        script: "server.js",
        "ignore_watch": ["node_modules", "storage", ".git"],
        watch: true,
        env: {
            "PORT": 5000,
            "NODE_ENV": "development"
        }
    }]
}